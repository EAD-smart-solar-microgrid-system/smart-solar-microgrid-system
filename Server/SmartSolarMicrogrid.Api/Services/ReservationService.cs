/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationService.cs
 * Purpose: Enforce reservation scheduling windows, notice policies, conflict checks, and secure QR generation.
 */

using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Utilities;
using SmartSolarMicrogrid.Api.DTOs.Reservations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class ReservationService : IReservationService
{
    private static readonly TimeSpan NoticeThreshold = TimeSpan.FromHours(12);
    private static readonly TimeSpan MaxForwardBookingWindow = TimeSpan.FromDays(7);

    private readonly IReservationRepository _reservationRepository;
    private readonly IStationRepository _stationRepository;
    private readonly IProsumerRepository _prosumerRepository;
    private readonly ISlotAvailabilityChecker _slotAvailabilityChecker;
    private readonly ICurrentProsumerAccessor _currentProsumerAccessor;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ReservationService(
        IReservationRepository reservationRepository,
        IStationRepository stationRepository,
        IProsumerRepository prosumerRepository,
        ISlotAvailabilityChecker slotAvailabilityChecker,
        ICurrentProsumerAccessor currentProsumerAccessor,
        IHttpContextAccessor httpContextAccessor)
    {
        // Store all repositories, slot verification, and identity dependencies required by reservation rules.
        _reservationRepository = reservationRepository;
        _stationRepository = stationRepository;
        _prosumerRepository = prosumerRepository;
        _slotAvailabilityChecker = slotAvailabilityChecker;
        _currentProsumerAccessor = currentProsumerAccessor;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ReservationServiceResult<ReservationResponse>> CreateAsync(
        CreateReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        var httpUser = _httpContextAccessor.HttpContext?.User;
        var isProsumer = httpUser?.IsInRole("Prosumer") ?? false;

        if (isProsumer)
        {
            var authNic = ProsumerService.NormalizeNic(await _currentProsumerAccessor.GetCurrentProsumerNicAsync(cancellationToken));
            if (string.IsNullOrEmpty(authNic))
            {
                return ReservationServiceResult<ReservationResponse>.Failure(
                    ReservationServiceErrorType.Forbidden,
                    "An authenticated prosumer identity is required.");
            }

            if (!string.IsNullOrWhiteSpace(request.ProsumerNic) &&
                !string.Equals(ProsumerService.NormalizeNic(request.ProsumerNic), authNic, StringComparison.OrdinalIgnoreCase))
            {
                return ReservationServiceResult<ReservationResponse>.Failure(
                    ReservationServiceErrorType.Forbidden,
                    "You are not authorized to create a reservation for another prosumer.");
            }

            request.ProsumerNic = authNic;
        }

        // Validate prosumer, station existence, 7-day booking window, and prevent slot booking conflicts.
        var validationError = ValidateCreateInput(request);
        if (validationError is not null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                validationError);
        }

        var normalizedNic = ProsumerService.NormalizeNic(request.ProsumerNic);
        var prosumer = await _prosumerRepository.GetByNicAsync(normalizedNic, cancellationToken);
        if (prosumer is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The referenced solar prosumer profile was not found.");
        }

        if (prosumer.AccountStatus == ProsumerAccountStatus.Deactivated)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "A deactivated solar prosumer profile cannot create energy reservations.");
        }

        var trimmedStationId = request.StationId.Trim();
        var station = HubIdGenerator.IsValid(trimmedStationId)
            ? await _stationRepository.GetByHubIdAsync(trimmedStationId, cancellationToken)
            : await _stationRepository.GetByIdAsync(trimmedStationId, cancellationToken);

        if (station is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The referenced microgrid node was not found.");
        }

        if (station.Status != StationStatus.Active)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Reservations cannot be booked for an inactive microgrid node.");
        }

        var internalStationId = station.Id;
        var now = DateTime.UtcNow;
        var requestedUtc = request.ReservationDateTime.ToUniversalTime();

        if (requestedUtc <= now)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Reservation date and time must be in the future.");
        }

        if (requestedUtc > now.Add(MaxForwardBookingWindow))
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Reservations must be scheduled within a rolling 7-day forward window.");
        }

        var hasConflict = await _reservationRepository.HasConflictingReservationAsync(
            internalStationId,
            request.SlotId.Trim(),
            requestedUtc,
            excludeReservationId: null,
            cancellationToken);

        if (hasConflict)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Conflict,
                "A conflicting reservation already exists for this station slot at the requested time.");
        }

        var slotAvailability = await _slotAvailabilityChecker.CheckSlotAvailabilityAsync(
            internalStationId,
            request.SlotId.Trim(),
            requestedUtc,
            cancellationToken);

        var slotAvailabilityError = MapSlotAvailabilityFailure(slotAvailability);
        if (slotAvailabilityError is not null)
        {
            return slotAvailabilityError;
        }

        var reservationType = ReservationType.DropOff;
        if (!string.IsNullOrWhiteSpace(request.ReservationType)
            && Enum.TryParse<ReservationType>(request.ReservationType.Trim(), true, out var parsedType)
            && Enum.IsDefined(parsedType))
        {
            reservationType = parsedType;
        }

        // New reservations created by the prosumer always start in Pending status under server control.
        var reservation = new EnergyReservation
        {
            Id = ObjectId.GenerateNewId().ToString(),
            ProsumerNic = normalizedNic,
            StationId = internalStationId,
            SlotId = request.SlotId.Trim(),
            ReservationDateTime = requestedUtc,
            ReservationType = reservationType,
            Status = ReservationStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };

        var created = await _reservationRepository.CreateAsync(reservation, cancellationToken);

        return ReservationServiceResult<ReservationResponse>.Success(MapToResponse(created));
    }

    public async Task<ReservationServiceResult<ReservationResponse>> UpdateAsync(
        string id,
        UpdateReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        // Enforce the 12-hour modification policy, 7-day forward window, and prevent slot overlap.
        if (!ObjectId.TryParse(id, out _))
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "The reservation id must be a valid MongoDB ObjectId.");
        }

        var existing = await _reservationRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        var httpUser = _httpContextAccessor.HttpContext?.User;
        var isProsumer = httpUser?.IsInRole("Prosumer") ?? false;

        if (isProsumer)
        {
            var authNic = ProsumerService.NormalizeNic(await _currentProsumerAccessor.GetCurrentProsumerNicAsync(cancellationToken));
            if (string.IsNullOrEmpty(authNic) || !string.Equals(existing.ProsumerNic, authNic, StringComparison.OrdinalIgnoreCase))
            {
                return ReservationServiceResult<ReservationResponse>.Failure(
                    ReservationServiceErrorType.Forbidden,
                    "You are not authorized to modify another prosumer's reservation.");
            }
        }

        if (existing.Status == ReservationStatus.Cancelled)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Cancelled reservations cannot be modified.");
        }

        if (existing.Status == ReservationStatus.Completed)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Completed reservations cannot be modified.");
        }

        var now = DateTime.UtcNow;
        if (existing.ReservationDateTime - now < NoticeThreshold)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Reservation modifications require at least 12 hours advance notice before the scheduled slot time.");
        }

        var requestedUtc = request.ReservationDateTime.ToUniversalTime();
        if (requestedUtc <= now)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Reservation date and time must be in the future.");
        }

        if (requestedUtc > now.Add(MaxForwardBookingWindow))
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Reservations must be scheduled within a rolling 7-day forward window.");
        }

        var targetSlot = !string.IsNullOrWhiteSpace(request.SlotId)
            ? request.SlotId.Trim()
            : existing.SlotId;

        var hasConflict = await _reservationRepository.HasConflictingReservationAsync(
            existing.StationId,
            targetSlot,
            requestedUtc,
            excludeReservationId: existing.Id,
            cancellationToken);

        if (hasConflict)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Conflict,
                "A conflicting reservation already exists for this station slot at the requested time.");
        }

        var slotAvailability = await _slotAvailabilityChecker.CheckSlotAvailabilityAsync(
            existing.StationId,
            targetSlot,
            requestedUtc,
            cancellationToken);

        var slotAvailabilityError = MapSlotAvailabilityFailure(slotAvailability);
        if (slotAvailabilityError is not null)
        {
            return slotAvailabilityError;
        }

        if (!string.IsNullOrWhiteSpace(request.ReservationType)
            && Enum.TryParse<ReservationType>(request.ReservationType.Trim(), true, out var parsedType)
            && Enum.IsDefined(parsedType))
        {
            existing.ReservationType = parsedType;
        }

        existing.SlotId = targetSlot;
        existing.ReservationDateTime = requestedUtc;
        existing.UpdatedAt = now;

        // Reset QR token on schedule modification so client must request fresh QR token for new slot/time.
        existing.QrToken = null;
        existing.QrIssuedAt = null;
        existing.QrExpiresAt = null;

        var updated = await _reservationRepository.UpdateAsync(existing, cancellationToken);
        if (updated is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        return ReservationServiceResult<ReservationResponse>.Success(MapToResponse(updated));
    }

    public async Task<ReservationServiceResult<ReservationResponse>> CancelAsync(
        string id,
        CancelReservationRequest? request,
        CancellationToken cancellationToken = default)
    {
        // Enforce the 12-hour cancellation notice policy and update reservation status to Cancelled.
        if (!ObjectId.TryParse(id, out _))
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "The reservation id must be a valid MongoDB ObjectId.");
        }

        var existing = await _reservationRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        var httpUser = _httpContextAccessor.HttpContext?.User;
        var isProsumer = httpUser?.IsInRole("Prosumer") ?? false;

        if (isProsumer)
        {
            var authNic = ProsumerService.NormalizeNic(await _currentProsumerAccessor.GetCurrentProsumerNicAsync(cancellationToken));
            if (string.IsNullOrEmpty(authNic) || !string.Equals(existing.ProsumerNic, authNic, StringComparison.OrdinalIgnoreCase))
            {
                return ReservationServiceResult<ReservationResponse>.Failure(
                    ReservationServiceErrorType.Forbidden,
                    "You are not authorized to cancel another prosumer's reservation.");
            }
        }

        if (existing.Status == ReservationStatus.Cancelled)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Conflict,
                "The reservation has already been cancelled.");
        }

        if (existing.Status == ReservationStatus.Completed)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Completed reservations cannot be cancelled.");
        }

        var now = DateTime.UtcNow;
        if (existing.ReservationDateTime - now < NoticeThreshold)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Reservation cancellations require at least 12 hours advance notice before the scheduled slot time.");
        }

        var reason = !string.IsNullOrWhiteSpace(request?.Reason)
            ? request.Reason.Trim()
            : "Cancelled by prosumer";

        var updated = await _reservationRepository.UpdateStatusAsync(
            id,
            ReservationStatus.Cancelled,
            reason,
            now,
            now,
            cancellationToken);

        if (updated is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        return ReservationServiceResult<ReservationResponse>.Success(MapToResponse(updated));
    }

    public async Task<ReservationServiceResult<ReservationResponse>> ApproveAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        // Enforce that only valid, pending reservations can be approved by Grid Operators.
        if (!ObjectId.TryParse(id, out _))
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "The reservation id must be a valid MongoDB ObjectId.");
        }

        var existing = await _reservationRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        if (existing.Status == ReservationStatus.Approved)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "The reservation is already approved.");
        }

        if (existing.Status == ReservationStatus.Cancelled)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Cancelled reservations cannot be approved.");
        }

        if (existing.Status == ReservationStatus.Completed)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Completed reservations cannot be approved.");
        }

        if (existing.Status != ReservationStatus.Pending)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Only pending reservations can be approved.");
        }

        var now = DateTime.UtcNow;
        if (NormalizeToUtc(existing.ReservationDateTime) <= now)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "Cannot approve an expired reservation date and time.");
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(existing.ProsumerNic, cancellationToken);
        if (prosumer is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The referenced solar prosumer profile was not found.");
        }

        if (prosumer.AccountStatus == ProsumerAccountStatus.Deactivated)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "A reservation for a deactivated solar prosumer profile cannot be approved.");
        }

        var station = await _stationRepository.GetByIdAsync(existing.StationId, cancellationToken);
        if (station is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The referenced microgrid node was not found.");
        }

        if (station.Status != StationStatus.Active)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Conflict,
                "Reservations cannot be approved for an inactive microgrid node.");
        }

        var hasConflict = await _reservationRepository.HasConflictingReservationAsync(
            existing.StationId,
            existing.SlotId,
            existing.ReservationDateTime,
            excludeReservationId: existing.Id,
            cancellationToken);

        if (hasConflict)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Conflict,
                "A conflicting reservation already exists for this station slot at the requested time.");
        }

        var slotAvailability = await _slotAvailabilityChecker.CheckSlotAvailabilityAsync(
            existing.StationId,
            existing.SlotId,
            existing.ReservationDateTime,
            cancellationToken);

        var slotAvailabilityError = MapSlotAvailabilityFailure(slotAvailability);
        if (slotAvailabilityError is not null)
        {
            return slotAvailabilityError;
        }

        var approved = await _reservationRepository.ApproveIfPendingAsync(
            existing.Id,
            now,
            cancellationToken);

        if (approved is not null)
        {
            return ReservationServiceResult<ReservationResponse>.Success(MapToResponse(approved));
        }

        var current = await _reservationRepository.GetByIdAsync(existing.Id, cancellationToken);
        if (current is null)
        {
            return ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        return ReservationServiceResult<ReservationResponse>.Failure(
            ReservationServiceErrorType.Conflict,
            "The reservation status changed before approval could be completed.");
    }

    public async Task<ReservationServiceResult<QrTokenResponse>> GenerateQrTokenAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        // Generate a cryptographically strong opaque server token strictly for approved reservations.
        if (!ObjectId.TryParse(id, out _))
        {
            return ReservationServiceResult<QrTokenResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "The reservation id must be a valid MongoDB ObjectId.");
        }

        var existing = await _reservationRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return ReservationServiceResult<QrTokenResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        var authNic = ProsumerService.NormalizeNic(await _currentProsumerAccessor.GetCurrentProsumerNicAsync(cancellationToken));
        if (string.IsNullOrEmpty(authNic) || !string.Equals(existing.ProsumerNic, authNic, StringComparison.OrdinalIgnoreCase))
        {
            return ReservationServiceResult<QrTokenResponse>.Failure(
                ReservationServiceErrorType.Forbidden,
                "You are not authorized to access the QR token for this reservation.");
        }

        if (existing.Status == ReservationStatus.Cancelled)
        {
            return ReservationServiceResult<QrTokenResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "QR tokens cannot be issued for cancelled reservations.");
        }

        if (existing.Status == ReservationStatus.Completed)
        {
            return ReservationServiceResult<QrTokenResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "QR tokens cannot be issued for already completed reservations.");
        }

        if (existing.Status == ReservationStatus.Pending)
        {
            return ReservationServiceResult<QrTokenResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "QR tokens can only be generated for approved reservations. The current reservation is pending administrative approval.");
        }

        if (existing.Status != ReservationStatus.Approved)
        {
            return ReservationServiceResult<QrTokenResponse>.Failure(
                ReservationServiceErrorType.Validation,
                "QR tokens can only be generated for approved reservations.");
        }

        var now = DateTime.UtcNow;
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var opaqueToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();

        var issuedAt = now;
        var expiresAt = existing.ReservationDateTime.AddHours(4);

        var updated = await _reservationRepository.SaveQrTokenAsync(
            existing.Id,
            opaqueToken,
            issuedAt,
            expiresAt,
            now,
            cancellationToken);

        if (updated is null)
        {
            return ReservationServiceResult<QrTokenResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        var response = new QrTokenResponse
        {
            ReservationId = updated.Id,
            QrToken = opaqueToken,
            IssuedAt = issuedAt,
            ExpiresAt = expiresAt,
            StationId = updated.StationId,
            ProsumerNic = updated.ProsumerNic,
            Status = updated.Status.ToString()
        };

        return ReservationServiceResult<QrTokenResponse>.Success(response);
    }

    private static string? ValidateCreateInput(CreateReservationRequest request)
    {
        // Enforce structural parameter presence prior to database verification.
        if (string.IsNullOrWhiteSpace(request.ProsumerNic))
        {
            return "Prosumer NIC is required.";
        }

        if (!ProsumerService.IsValidNic(request.ProsumerNic))
        {
            return "Invalid NIC format. Enter 9 digits followed by V/X or 12 numeric digits.";
        }

        if (string.IsNullOrWhiteSpace(request.StationId)
            || (!ObjectId.TryParse(request.StationId.Trim(), out _) && !HubIdGenerator.IsValid(request.StationId.Trim())))
        {
            return "A valid station id (HubId or MongoDB ObjectId) is required.";
        }

        if (string.IsNullOrWhiteSpace(request.SlotId))
        {
            return "Slot id is required.";
        }

        if (request.ReservationDateTime == default)
        {
            return "A valid reservation date and time is required.";
        }

        return null;
    }

    private static ReservationServiceResult<ReservationResponse>? MapSlotAvailabilityFailure(
        SlotAvailabilityStatus status)
    {
        // Translate Member 4 slot-check outcomes into reservation HTTP-mappable errors.
        return status switch
        {
            SlotAvailabilityStatus.Available => null,
            SlotAvailabilityStatus.NotFound => ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.NotFound,
                "The requested energy booking slot was not found."),
            SlotAvailabilityStatus.ServiceUnavailable => ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.DependencyUnavailable,
                "Slot availability verification is unavailable because Member 4's battery storage slot service is not yet integrated."),
            _ => ReservationServiceResult<ReservationResponse>.Failure(
                ReservationServiceErrorType.Conflict,
                "The requested battery storage slot is currently occupied or unavailable.")
        };
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        // Normalize unspecified timestamps as UTC before comparing reservation eligibility.
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            _ => value.ToUniversalTime()
        };
    }

    private static ReservationResponse MapToResponse(EnergyReservation reservation)
    {
        // Map database model to external REST DTO response.
        return new ReservationResponse
        {
            Id = reservation.Id,
            ProsumerNic = reservation.ProsumerNic,
            StationId = reservation.StationId,
            SlotId = reservation.SlotId,
            ReservationDateTime = reservation.ReservationDateTime,
            ReservationType = reservation.ReservationType.ToString(),
            Status = reservation.Status.ToString(),
            CancellationReason = reservation.CancellationReason,
            CancelledAt = reservation.CancelledAt,
            QrToken = reservation.QrToken,
            CreatedAt = reservation.CreatedAt,
            UpdatedAt = reservation.UpdatedAt
        };
    }
}
