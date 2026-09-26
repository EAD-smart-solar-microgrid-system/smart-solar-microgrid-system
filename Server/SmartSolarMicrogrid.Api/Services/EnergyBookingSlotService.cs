/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EnergyBookingSlotService.cs
 * Purpose: Apply energy booking slot validation, overlap rules, and DTO/model mapping.
 */

using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class EnergyBookingSlotService : IEnergyBookingSlotService
{
    private readonly IEnergyBookingSlotRepository _slotRepository;
    private readonly IStationRepository _stationRepository;

    public EnergyBookingSlotService(
        IEnergyBookingSlotRepository slotRepository,
        IStationRepository stationRepository)
    {
        // Store repositories used to validate stations and persist booking slots.
        _slotRepository = slotRepository;
        _stationRepository = stationRepository;
    }

    public async Task<StationServiceResult<IReadOnlyList<EnergyBookingSlotResponse>>> GetByStationIdAsync(
        string stationId,
        CancellationToken cancellationToken = default)
    {
        // Validate the station identifier and confirm the parent station exists before listing slots.
        if (!ObjectId.TryParse(stationId, out _))
        {
            return StationServiceResult<IReadOnlyList<EnergyBookingSlotResponse>>.Failure(
                StationServiceErrorType.Validation,
                "The station id must be a valid MongoDB ObjectId.");
        }

        var station = await _stationRepository.GetByIdAsync(stationId, cancellationToken);

        if (station is null)
        {
            return StationServiceResult<IReadOnlyList<EnergyBookingSlotResponse>>.Failure(
                StationServiceErrorType.NotFound,
                "The requested station was not found.");
        }

        var slots = await _slotRepository.GetByStationIdAsync(stationId, cancellationToken);
        var responses = slots.Select(MapToResponse).ToList();

        return StationServiceResult<IReadOnlyList<EnergyBookingSlotResponse>>.Success(responses);
    }

    public async Task<StationServiceResult<EnergyBookingSlotResponse>> CreateAsync(
        string stationId,
        CreateEnergyBookingSlotRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate identifiers, slot input, station existence, and overlap before inserting.
        if (!ObjectId.TryParse(stationId, out _))
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.Validation,
                "The station id must be a valid MongoDB ObjectId.");
        }

        var station = await _stationRepository.GetByIdAsync(stationId, cancellationToken);

        if (station is null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested station was not found.");
        }

        if (station.Status != StationStatus.Active)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.Validation,
                "Energy booking slots can only be created for active stations.");
        }

        var validationMessage = ValidateSlotInput(
            request.SlotStartUtc,
            request.SlotEndUtc,
            request.CapacityKw,
            station.CapacityKwPerHour);

        if (validationMessage is not null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.Validation,
                validationMessage);
        }

        var normalizedStart = NormalizeToUtc(request.SlotStartUtc);
        var normalizedEnd = NormalizeToUtc(request.SlotEndUtc);

        var overlapMessage = await ValidateNoOverlapAsync(
            stationId,
            normalizedStart,
            normalizedEnd,
            excludeSlotId: null,
            cancellationToken);

        if (overlapMessage is not null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.Conflict,
                overlapMessage);
        }

        var now = DateTime.UtcNow;
        var slot = new EnergyBookingSlot
        {
            Id = ObjectId.GenerateNewId().ToString(),
            StationId = stationId,
            SlotStartUtc = normalizedStart,
            SlotEndUtc = normalizedEnd,
            CapacityKw = request.CapacityKw,
            IsAvailable = request.IsAvailable,
            CreatedAt = now,
            UpdatedAt = now
        };

        var createdSlot = await _slotRepository.CreateAsync(slot, cancellationToken);

        return StationServiceResult<EnergyBookingSlotResponse>.Success(MapToResponse(createdSlot));
    }

    public async Task<StationServiceResult<EnergyBookingSlotResponse>> UpdateAsync(
        string slotId,
        UpdateEnergyBookingSlotRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate the slot identifier, editable fields, and overlap constraints before updating.
        if (!ObjectId.TryParse(slotId, out _))
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.Validation,
                "The slot id must be a valid MongoDB ObjectId.");
        }

        var existingSlot = await _slotRepository.GetByIdAsync(slotId, cancellationToken);

        if (existingSlot is null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested energy booking slot was not found.");
        }

        var station = await _stationRepository.GetByIdAsync(existingSlot.StationId, cancellationToken);

        if (station is null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The parent station for this slot was not found.");
        }

        var validationMessage = ValidateSlotInput(
            request.SlotStartUtc,
            request.SlotEndUtc,
            request.CapacityKw,
            station.CapacityKwPerHour);

        if (validationMessage is not null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.Validation,
                validationMessage);
        }

        var normalizedStart = NormalizeToUtc(request.SlotStartUtc);
        var normalizedEnd = NormalizeToUtc(request.SlotEndUtc);

        var overlapMessage = await ValidateNoOverlapAsync(
            existingSlot.StationId,
            normalizedStart,
            normalizedEnd,
            excludeSlotId: existingSlot.Id,
            cancellationToken);

        if (overlapMessage is not null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.Conflict,
                overlapMessage);
        }

        existingSlot.SlotStartUtc = normalizedStart;
        existingSlot.SlotEndUtc = normalizedEnd;
        existingSlot.CapacityKw = request.CapacityKw;
        existingSlot.IsAvailable = request.IsAvailable;
        existingSlot.UpdatedAt = DateTime.UtcNow;

        var updatedSlot = await _slotRepository.UpdateAsync(existingSlot, cancellationToken);

        if (updatedSlot is null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested energy booking slot was not found.");
        }

        return StationServiceResult<EnergyBookingSlotResponse>.Success(MapToResponse(updatedSlot));
    }

    public async Task<StationServiceResult<EnergyBookingSlotResponse>> UpdateAvailabilityAsync(
        string slotId,
        UpdateSlotAvailabilityRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate the slot identifier and update only the availability flag.
        if (!ObjectId.TryParse(slotId, out _))
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.Validation,
                "The slot id must be a valid MongoDB ObjectId.");
        }

        var existingSlot = await _slotRepository.GetByIdAsync(slotId, cancellationToken);

        if (existingSlot is null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested energy booking slot was not found.");
        }

        if (existingSlot.IsAvailable == request.IsAvailable)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Success(MapToResponse(existingSlot));
        }

        var updatedSlot = await _slotRepository.UpdateAvailabilityAsync(
            existingSlot.Id,
            request.IsAvailable,
            DateTime.UtcNow,
            cancellationToken);

        if (updatedSlot is null)
        {
            return StationServiceResult<EnergyBookingSlotResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested energy booking slot was not found.");
        }

        return StationServiceResult<EnergyBookingSlotResponse>.Success(MapToResponse(updatedSlot));
    }

    public async Task<StationServiceResult<object?>> DeleteAsync(
        string slotId,
        CancellationToken cancellationToken = default)
    {
        // Validate the slot identifier and remove the booking slot when it exists.
        if (!ObjectId.TryParse(slotId, out _))
        {
            return StationServiceResult<object?>.Failure(
                StationServiceErrorType.Validation,
                "The slot id must be a valid MongoDB ObjectId.");
        }

        var existingSlot = await _slotRepository.GetByIdAsync(slotId, cancellationToken);

        if (existingSlot is null)
        {
            return StationServiceResult<object?>.Failure(
                StationServiceErrorType.NotFound,
                "The requested energy booking slot was not found.");
        }

        var deleted = await _slotRepository.DeleteAsync(existingSlot.Id, cancellationToken);

        if (!deleted)
        {
            return StationServiceResult<object?>.Failure(
                StationServiceErrorType.NotFound,
                "The requested energy booking slot was not found.");
        }

        return StationServiceResult<object?>.Success(null);
    }

    private static string? ValidateSlotInput(
        DateTime slotStartUtc,
        DateTime slotEndUtc,
        double capacityKw,
        double stationCapacityKwPerHour)
    {
        // Apply the complete slot input validation required by the assignment.
        if (slotStartUtc == default)
        {
            return "SlotStartUtc is required.";
        }

        if (slotEndUtc == default)
        {
            return "SlotEndUtc is required.";
        }

        if (slotStartUtc.Kind == DateTimeKind.Local || slotEndUtc.Kind == DateTimeKind.Local)
        {
            return "Slot times must be expressed in UTC.";
        }

        var normalizedStart = NormalizeToUtc(slotStartUtc);
        var normalizedEnd = NormalizeToUtc(slotEndUtc);

        if (normalizedEnd <= normalizedStart)
        {
            return "SlotEndUtc must be later than SlotStartUtc.";
        }

        if (!double.IsFinite(capacityKw) || capacityKw <= 0)
        {
            return "CapacityKw must be greater than 0.";
        }

        if (!double.IsFinite(stationCapacityKwPerHour) || stationCapacityKwPerHour <= 0)
        {
            return "The parent station has an invalid CapacityKwPerHour configuration.";
        }

        if (capacityKw > stationCapacityKwPerHour)
        {
            return "CapacityKw cannot exceed the parent station CapacityKwPerHour.";
        }

        return null;
    }

    private async Task<string?> ValidateNoOverlapAsync(
        string stationId,
        DateTime slotStartUtc,
        DateTime slotEndUtc,
        string? excludeSlotId,
        CancellationToken cancellationToken)
    {
        // Reject slot windows that overlap another slot at the same station.
        var stationSlots = await _slotRepository.GetByStationIdAsync(stationId, cancellationToken);

        foreach (var candidate in stationSlots)
        {
            if (excludeSlotId is not null && candidate.Id == excludeSlotId)
            {
                continue;
            }

            if (RangesOverlap(slotStartUtc, slotEndUtc, candidate.SlotStartUtc, candidate.SlotEndUtc))
            {
                return "The slot time window overlaps an existing slot for this station.";
            }
        }

        return null;
    }

    private static bool RangesOverlap(
        DateTime startA,
        DateTime endA,
        DateTime startB,
        DateTime endB)
    {
        // Treat touching boundaries as non-overlapping and any shared interior time as overlap.
        return startA < endB && endA > startB;
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        // Normalize unspecified timestamps as UTC to match server-side storage.
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            _ => value.ToUniversalTime()
        };
    }

    private static EnergyBookingSlotResponse MapToResponse(EnergyBookingSlot slot)
    {
        // Map a MongoDB model to a response without exposing the model directly.
        return new EnergyBookingSlotResponse
        {
            Id = slot.Id,
            StationId = slot.StationId,
            SlotStartUtc = slot.SlotStartUtc,
            SlotEndUtc = slot.SlotEndUtc,
            CapacityKw = slot.CapacityKw,
            IsAvailable = slot.IsAvailable,
            CreatedAt = slot.CreatedAt,
            UpdatedAt = slot.UpdatedAt
        };
    }
}
