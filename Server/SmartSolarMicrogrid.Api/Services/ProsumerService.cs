/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerService.cs
 * Purpose: Apply Prosumer validation, account-state rules, and DTO/model mapping.
 */

using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Validation;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class ProsumerService : IProsumerService
{
    private static readonly Regex FullNameRegex =
        new(@"^[\p{L}\p{M} .'-]+$", RegexOptions.Compiled);

    private readonly ICurrentProsumerAccessor _currentProsumerAccessor;
    private readonly IProsumerRepository _prosumerRepository;
    private readonly IProsumerNotificationService _notificationService;

    public ProsumerService(
        IProsumerRepository prosumerRepository,
        ICurrentProsumerAccessor currentProsumerAccessor,
        IProsumerNotificationService notificationService)
    {
        _prosumerRepository = prosumerRepository;
        _currentProsumerAccessor = currentProsumerAccessor;
        _notificationService = notificationService;
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> RegisterAsync(
        RegisterProsumerRequest request,
        CancellationToken cancellationToken = default)
    {
        /*
         * Normalize and validate all public registration data before
         * constructing the persistence model.
         */
        var nic = NormalizeNic(request.Nic);

        var validationMessage = ValidateRegistration(
            nic,
            request.FullName,
            request.Email,
            request.PhoneNumber,
            request.Address);

        if (validationMessage is not null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                validationMessage);
        }

        /*
         * Application-level duplicate NIC protection.
         */
        var existingProsumer = await _prosumerRepository.GetByNicAsync(
            nic!,
            cancellationToken);

        if (existingProsumer is not null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "A Prosumer account with this NIC already exists.");
        }

        var now = DateTime.UtcNow;

        var prosumer = new Prosumer
        {
            Nic = nic!,
            FullName = request.FullName!.Trim(),
            Email = request.Email!.Trim(),
            PhoneNumber = NormalizeOptionalPhone(request.PhoneNumber),
            Address = NormalizeOptionalText(request.Address),
            AccountStatus = ProsumerAccountStatus.PendingActivation,
            CreatedAt = now,
            UpdatedAt = now
        };

        try
        {
            var createdProsumer = await _prosumerRepository.CreateAsync(
                prosumer,
                cancellationToken);

            /*
             * Preserve registration notification functionality.
             */
            await _notificationService.SendRegistrationNotificationsAsync(
                createdProsumer,
                cancellationToken);

            return ProsumerServiceResult<ProsumerResponse>.Success(
                MapToResponse(createdProsumer));
        }
        catch (MongoWriteException exception)
            when (exception.WriteError?.Code == 11000)
        {
            /*
             * Preserve database-level protection against a concurrent
             * duplicate NIC registration race.
             */
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "A Prosumer account with this NIC already exists.");
        }
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> GetCurrentAsync(
        CancellationToken cancellationToken = default)
    {
        /*
         * Resolve the authenticated Prosumer identity instead of
         * accepting a client-supplied NIC.
         */
        var nic = await GetCurrentNicAsync(cancellationToken);

        if (nic is null)
        {
            return UnauthorizedResult();
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(
            nic,
            cancellationToken);

        if (prosumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        return ProsumerServiceResult<ProsumerResponse>.Success(
            MapToResponse(prosumer));
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> UpdateCurrentAsync(
        UpdateProsumerProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        /*
         * Resolve the authenticated profile.
         * The NIC is never accepted from the update DTO.
         */
        var nic = await GetCurrentNicAsync(cancellationToken);

        if (nic is null)
        {
            return UnauthorizedResult();
        }

        /*
         * Validate only the editable profile fields.
         */
        var validationMessage = ValidateProfile(
            request.FullName,
            request.Email,
            request.PhoneNumber,
            request.Address);

        if (validationMessage is not null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                validationMessage);
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(
            nic,
            cancellationToken);

        if (prosumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        /*
         * Preserve incoming account-state protection:
         * a deactivated account cannot modify its profile.
         */
        if (prosumer.AccountStatus == ProsumerAccountStatus.Deactivated)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "Your account has been deactivated by administration. " +
                "Profile updates are not permitted.");
        }

        prosumer.FullName = request.FullName!.Trim();
        prosumer.Email = request.Email!.Trim();
        prosumer.PhoneNumber =
            NormalizeOptionalPhone(request.PhoneNumber);
        prosumer.Address =
            NormalizeOptionalText(request.Address);
        prosumer.UpdatedAt = DateTime.UtcNow;

        var updatedProsumer =
            await _prosumerRepository.UpdateProfileAsync(
                prosumer,
                cancellationToken);

        if (updatedProsumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        return ProsumerServiceResult<ProsumerResponse>.Success(
            MapToResponse(updatedProsumer));
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>>
        RequestDeactivationAsync(
            CancellationToken cancellationToken = default)
    {
        /*
         * Move an eligible profile to DeactivationRequested.
         * This does not directly deactivate the account.
         */
        var nic = await GetCurrentNicAsync(cancellationToken);

        if (nic is null)
        {
            return UnauthorizedResult();
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(
            nic,
            cancellationToken);

        if (prosumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        /*
         * Preserve idempotent behaviour for an already-requested account.
         */
        if (prosumer.AccountStatus ==
            ProsumerAccountStatus.DeactivationRequested)
        {
            return ProsumerServiceResult<ProsumerResponse>.Success(
                MapToResponse(prosumer));
        }

        /*
         * Pending accounts cannot request deactivation.
         */
        if (prosumer.AccountStatus ==
            ProsumerAccountStatus.PendingActivation)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "A PendingActivation account cannot request deactivation.");
        }

        /*
         * An already-deactivated account cannot request deactivation again.
         */
        if (prosumer.AccountStatus ==
            ProsumerAccountStatus.Deactivated)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "A Deactivated account cannot request deactivation.");
        }

        var updatedProsumer =
            await _prosumerRepository.UpdateStatusAsync(
                nic,
                ProsumerAccountStatus.DeactivationRequested,
                DateTime.UtcNow,
                cancellationToken);

        if (updatedProsumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        return ProsumerServiceResult<ProsumerResponse>.Success(
            MapToResponse(updatedProsumer));
    }

    private async Task<string?> GetCurrentNicAsync(
        CancellationToken cancellationToken)
    {
        /*
         * Normalize the authenticated identity supplied by the
         * current-Prosumer accessor.
         */
        var normalized = NormalizeNic(
            await _currentProsumerAccessor
                .GetCurrentProsumerNicAsync(cancellationToken));

        return string.IsNullOrEmpty(normalized)
            ? null
            : normalized;
    }

    public static string NormalizeNic(string? nic)
    {
        /*
         * Preserve the shared normalization implementation introduced
         * through AccountValidation.
         */
        return AccountValidation.NormalizeNic(nic);
    }

    public static bool IsValidNic(string? nic)
    {
        /*
         * Preserve the shared NIC-format implementation.
         */
        return AccountValidation.IsValidNic(nic);
    }

    public static bool IsValidFullName(string? name)
    {
        /*
         * Keep the proven Unicode-aware Full Name validation.
         *
         * \p{L} = Unicode letters
         * \p{M} = Unicode combining marks
         *
         * This allows names in scripts such as Sinhala and Tamil while
         * continuing to reject digits and inappropriate symbols.
         */
        if (string.IsNullOrWhiteSpace(name))
        {
            return false;
        }

        var trimmed = name.Trim();

        return trimmed.Length >= 2
            && trimmed.Length <= 100
            && FullNameRegex.IsMatch(trimmed);
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }

    private static string? NormalizeOptionalPhone(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : AccountValidation.NormalizePhone(value);
    }

    private static string? ValidateRegistration(
        string? nic,
        string? fullName,
        string? email,
        string? phoneNumber = null,
        string? address = null)
    {
        /*
         * Preserve the existing tested registration rules.
         */
        if (string.IsNullOrWhiteSpace(nic))
        {
            return "Nic is required.";
        }

        if (!IsValidNic(nic))
        {
            return "Enter a valid NIC number.";
        }

        return ValidateProfile(
            fullName,
            email,
            phoneNumber,
            address);
    }

    private static string? ValidateProfile(
        string? fullName,
        string? email,
        string? phoneNumber = null,
        string? address = null)
    {
        /*
         * Full Name
         */
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return "FullName is required.";
        }

        var trimmedName = fullName.Trim();

        if (trimmedName.Length < 2)
        {
            return "FullName must be at least 2 characters.";
        }

        if (trimmedName.Length > 100)
        {
            return "FullName cannot exceed 100 characters.";
        }

        if (!FullNameRegex.IsMatch(trimmedName))
        {
            return "FullName contains invalid characters.";
        }

        /*
         * Email
         */
        if (string.IsNullOrWhiteSpace(email))
        {
            return "Email is required.";
        }

        if (!new EmailAddressAttribute().IsValid(email.Trim()))
        {
            return "Email must be a valid email address.";
        }

        /*
         * Phone
         *
         * Optional, but validate when supplied.
         */
        if (!string.IsNullOrWhiteSpace(phoneNumber))
        {
            var cleaned = phoneNumber
                .Trim()
                .Replace(" ", string.Empty)
                .Replace("-", string.Empty);

            if (!Regex.IsMatch(
                    cleaned,
                    @"^(0\d{9}|\+94\d{9})$"))
            {
                return
                    "Phone number must be a valid Sri Lankan phone number " +
                    "(e.g. 07XXXXXXXX or +947XXXXXXXX).";
            }
        }

        /*
         * Address
         *
         * Optional with maximum length of 250 characters.
         */
        if (!string.IsNullOrWhiteSpace(address)
            && address.Trim().Length > 250)
        {
            return "Address cannot exceed 250 characters.";
        }

        return null;
    }

    private static ProsumerServiceResult<ProsumerResponse>
        UnauthorizedResult()
    {
        return ProsumerServiceResult<ProsumerResponse>.Failure(
            ProsumerServiceErrorType.Unauthorized,
            "An authenticated Prosumer identity is required.");
    }

    private static ProsumerResponse MapToResponse(
        Prosumer prosumer)
    {
        return new ProsumerResponse
        {
            Nic = prosumer.Nic,
            FullName = prosumer.FullName,
            Email = prosumer.Email,
            PhoneNumber = prosumer.PhoneNumber,
            Address = prosumer.Address,
            AccountStatus = prosumer.AccountStatus.ToString(),
            CreatedAt = prosumer.CreatedAt,
            UpdatedAt = prosumer.UpdatedAt
        };
    }
}