/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerService.cs
 * Purpose: Apply Prosumer validation, account-state rules, and DTO/model mapping.
 */

using System.ComponentModel.DataAnnotations;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class ProsumerService : IProsumerService
{
    private readonly ICurrentProsumerAccessor _currentProsumerAccessor;
    private readonly IProsumerRepository _prosumerRepository;

    public ProsumerService(
        IProsumerRepository prosumerRepository,
        ICurrentProsumerAccessor currentProsumerAccessor)
    {
        // Store persistence and current-identity dependencies used by account operations.
        _prosumerRepository = prosumerRepository;
        _currentProsumerAccessor = currentProsumerAccessor;
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> RegisterAsync(
        RegisterProsumerRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate and normalize public registration data before creating server fields.
        var nic = NormalizeNic(request.Nic);
        var validationMessage = ValidateRegistration(nic, request.FullName, request.Email);

        if (validationMessage is not null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                validationMessage);
        }

        var existingProsumer = await _prosumerRepository.GetByNicAsync(nic!, cancellationToken);

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
            PhoneNumber = NormalizeOptionalText(request.PhoneNumber),
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

            return ProsumerServiceResult<ProsumerResponse>.Success(
                MapToResponse(createdProsumer));
        }
        catch (MongoWriteException exception) when (exception.WriteError?.Code == 11000)
        {
            // Convert a concurrent NIC uniqueness race into the public conflict response.
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "A Prosumer account with this NIC already exists.");
        }
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> GetCurrentAsync(
        CancellationToken cancellationToken = default)
    {
        // Resolve the authenticated identity instead of accepting a client-provided NIC.
        var nic = await GetCurrentNicAsync(cancellationToken);

        if (nic is null)
        {
            return UnauthorizedResult();
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(nic, cancellationToken);

        if (prosumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(prosumer));
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> UpdateCurrentAsync(
        UpdateProsumerProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        // Resolve the authenticated profile and validate only editable fields.
        var nic = await GetCurrentNicAsync(cancellationToken);

        if (nic is null)
        {
            return UnauthorizedResult();
        }

        var validationMessage = ValidateProfile(request.FullName, request.Email);

        if (validationMessage is not null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                validationMessage);
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(nic, cancellationToken);

        if (prosumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        prosumer.FullName = request.FullName!.Trim();
        prosumer.Email = request.Email!.Trim();
        prosumer.PhoneNumber = NormalizeOptionalText(request.PhoneNumber);
        prosumer.Address = NormalizeOptionalText(request.Address);
        prosumer.UpdatedAt = DateTime.UtcNow;

        var updatedProsumer = await _prosumerRepository.UpdateProfileAsync(
            prosumer,
            cancellationToken);

        if (updatedProsumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(updatedProsumer));
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> RequestDeactivationAsync(
        CancellationToken cancellationToken = default)
    {
        // Move an active profile to a request state without deleting or directly deactivating it.
        var nic = await GetCurrentNicAsync(cancellationToken);

        if (nic is null)
        {
            return UnauthorizedResult();
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(nic, cancellationToken);

        if (prosumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The authenticated Prosumer profile was not found.");
        }

        if (prosumer.AccountStatus == ProsumerAccountStatus.DeactivationRequested)
        {
            return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(prosumer));
        }

        if (prosumer.AccountStatus == ProsumerAccountStatus.PendingActivation)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "A PendingActivation account cannot request deactivation.");
        }

        if (prosumer.AccountStatus == ProsumerAccountStatus.Deactivated)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "A Deactivated account cannot request deactivation.");
        }

        var updatedProsumer = await _prosumerRepository.UpdateStatusAsync(
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

        return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(updatedProsumer));
    }

    private async Task<string?> GetCurrentNicAsync(CancellationToken cancellationToken)
    {
        // Normalize the identity supplied by the future authentication integration.
        return NormalizeNic(await _currentProsumerAccessor
            .GetCurrentProsumerNicAsync(cancellationToken));
    }

    private static string? NormalizeNic(string? nic)
    {
        // Normalize the primary business identifier consistently before repository calls.
        return string.IsNullOrWhiteSpace(nic)
            ? null
            : nic.Trim().ToUpperInvariant();
    }

    private static string? NormalizeOptionalText(string? value)
    {
        // Trim optional profile text and represent whitespace-only input as absent.
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? ValidateRegistration(
        string? nic,
        string? fullName,
        string? email)
    {
        // Apply registration validation without inventing a strict national NIC format.
        if (nic is null)
        {
            return "Nic is required.";
        }

        return ValidateProfile(fullName, email);
    }

    private static string? ValidateProfile(string? fullName, string? email)
    {
        // Validate required profile fields and use a standard reasonable email check.
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return "FullName is required.";
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return "Email is required.";
        }

        if (!new EmailAddressAttribute().IsValid(email.Trim()))
        {
            return "Email must be a valid email address.";
        }

        return null;
    }

    private static ProsumerServiceResult<ProsumerResponse> UnauthorizedResult()
    {
        // Return the safe boundary response until Member 1 identity integration is available.
        return ProsumerServiceResult<ProsumerResponse>.Failure(
            ProsumerServiceErrorType.Unauthorized,
            "An authenticated Prosumer identity is required.");
    }

    private static ProsumerResponse MapToResponse(Prosumer prosumer)
    {
        // Map persistence data to the public response without exposing credentials.
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
