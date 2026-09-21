/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerService.cs
 * Purpose: Enforce business validations, life-cycle transitions, and DTO mappings for solar prosumers.
 */

using System.Text.RegularExpressions;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class ProsumerService : IProsumerService
{
    private static readonly Regex OldNicRegex = new(@"^\d{9}[VX]$", RegexOptions.Compiled);
    private static readonly Regex NewNicRegex = new(@"^\d{12}$", RegexOptions.Compiled);
    private static readonly Regex EmailRegex = new(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"^(0\d{9}|\+94\d{9})$", RegexOptions.Compiled);

    private readonly IProsumerRepository _prosumerRepository;

    public ProsumerService(IProsumerRepository prosumerRepository)
    {
        // Store the prosumer repository used to persist prosumer domain entities.
        _prosumerRepository = prosumerRepository;
    }

    public async Task<ProsumerServiceResult<IReadOnlyList<ProsumerResponse>>> GetAllAsync(
        string? statusFilter = null,
        CancellationToken cancellationToken = default)
    {
        // Query prosumers from the repository with optional lifecycle status filtering.
        ProsumerStatus? parsedStatus = null;

        if (!string.IsNullOrWhiteSpace(statusFilter))
        {
            if (!Enum.TryParse<ProsumerStatus>(statusFilter.Trim(), true, out var statusVal)
                || !Enum.IsDefined(statusVal))
            {
                return ProsumerServiceResult<IReadOnlyList<ProsumerResponse>>.Failure(
                    ProsumerServiceErrorType.Validation,
                    "Invalid status filter. Permitted values are Pending, Active, or Deactivated.");
            }

            parsedStatus = statusVal;
        }

        var prosumers = await _prosumerRepository.GetAllAsync(parsedStatus, cancellationToken);
        var responses = prosumers.Select(MapToResponse).ToList();

        return ProsumerServiceResult<IReadOnlyList<ProsumerResponse>>.Success(responses);
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> GetByNicAsync(
        string nic,
        CancellationToken cancellationToken = default)
    {
        // Normalize the provided National Identity Card and retrieve the matching prosumer profile.
        var normalizedNic = NormalizeNic(nic);

        if (string.IsNullOrEmpty(normalizedNic) || !IsValidNic(normalizedNic))
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                "A valid Sri Lankan National Identity Card (NIC) is required.");
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(normalizedNic, cancellationToken);

        if (prosumer is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(prosumer));
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> CreateAsync(
        CreateProsumerRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate prosumer profile fields and prevent duplicate NIC registration.
        var normalizedNic = NormalizeNic(request.Nic);

        var validationError = ValidateProsumerFields(
            normalizedNic,
            request.FullName,
            request.Email,
            request.Phone,
            request.Address,
            requireNic: true);

        if (validationError is not null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                validationError);
        }

        var exists = await _prosumerRepository.ExistsByNicAsync(normalizedNic, cancellationToken);

        if (exists)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Conflict,
                "A prosumer with this National Identity Card (NIC) already exists.");
        }

        var now = DateTime.UtcNow;
        var prosumer = new Prosumer
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Nic = normalizedNic,
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            Phone = CleanPhone(request.Phone),
            Address = request.Address.Trim(),
            Role = "Solar Prosumer",
            Status = ProsumerStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };

        var created = await _prosumerRepository.CreateAsync(prosumer, cancellationToken);

        return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(created));
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> UpdateDetailsAsync(
        string nic,
        UpdateProsumerRequest request,
        CancellationToken cancellationToken = default)
    {
        // Enforce immutable NIC constraint and validate updated contact and profile information.
        var normalizedNic = NormalizeNic(nic);

        if (string.IsNullOrEmpty(normalizedNic) || !IsValidNic(normalizedNic))
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                "A valid Sri Lankan National Identity Card (NIC) is required.");
        }

        var validationError = ValidateProsumerFields(
            normalizedNic,
            request.FullName,
            request.Email,
            request.Phone,
            request.Address,
            requireNic: false);

        if (validationError is not null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                validationError);
        }

        var existing = await _prosumerRepository.GetByNicAsync(normalizedNic, cancellationToken);

        if (existing is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        existing.FullName = request.FullName.Trim();
        existing.Email = request.Email.Trim();
        existing.Phone = CleanPhone(request.Phone);
        existing.Address = request.Address.Trim();
        existing.UpdatedAt = DateTime.UtcNow;

        var updated = await _prosumerRepository.UpdateDetailsAsync(existing, cancellationToken);

        if (updated is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(updated));
    }

    public async Task<ProsumerServiceResult<ProsumerResponse>> ChangeStatusAsync(
        string nic,
        UpdateProsumerStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        // Verify prosumer existence and validate permitted lifecycle status transitions.
        var normalizedNic = NormalizeNic(nic);

        if (string.IsNullOrEmpty(normalizedNic) || !IsValidNic(normalizedNic))
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                "A valid Sri Lankan National Identity Card (NIC) is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                "Status is required.");
        }

        if (!Enum.TryParse<ProsumerStatus>(request.Status.Trim(), true, out var requestedStatus)
            || !Enum.IsDefined(requestedStatus))
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.Validation,
                "Status must be Pending, Active, or Deactivated.");
        }

        var existing = await _prosumerRepository.GetByNicAsync(normalizedNic, cancellationToken);

        if (existing is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        if (existing.Status == requestedStatus)
        {
            return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(existing));
        }

        var updated = await _prosumerRepository.UpdateStatusAsync(
            normalizedNic,
            requestedStatus,
            DateTime.UtcNow,
            cancellationToken);

        if (updated is null)
        {
            return ProsumerServiceResult<ProsumerResponse>.Failure(
                ProsumerServiceErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        return ProsumerServiceResult<ProsumerResponse>.Success(MapToResponse(updated));
    }

    public static string NormalizeNic(string? nic)
    {
        // Safely trim whitespace and convert NIC alphabetic characters to uppercase.
        if (string.IsNullOrWhiteSpace(nic))
        {
            return string.Empty;
        }

        return nic.Trim().ToUpperInvariant();
    }

    public static bool IsValidNic(string normalizedNic)
    {
        // Validate against 9-digit old format with V/X or 12-digit new numeric format.
        if (string.IsNullOrWhiteSpace(normalizedNic))
        {
            return false;
        }

        return OldNicRegex.IsMatch(normalizedNic) || NewNicRegex.IsMatch(normalizedNic);
    }

    private static string? ValidateProsumerFields(
        string normalizedNic,
        string? fullName,
        string? email,
        string? phone,
        string? address,
        bool requireNic)
    {
        // Enforce enterprise business rules for prosumer registration and profile modifications.
        if (requireNic)
        {
            if (string.IsNullOrWhiteSpace(normalizedNic))
            {
                return "National Identity Card (NIC) is required.";
            }

            if (!IsValidNic(normalizedNic))
            {
                return "Invalid NIC format. Enter 9 digits followed by V/X (e.g., 123456789V) or 12 digits (e.g., 199912345678).";
            }
        }

        var trimmedName = fullName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            return "Full name is required.";
        }

        if (trimmedName.Length < 2)
        {
            return "Full name must be at least 2 characters.";
        }

        var trimmedEmail = email?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmedEmail))
        {
            return "Email address is required.";
        }

        if (!EmailRegex.IsMatch(trimmedEmail))
        {
            return "Please enter a valid email address (e.g., user@example.com).";
        }

        var cleanedPhone = CleanPhone(phone);
        if (string.IsNullOrWhiteSpace(cleanedPhone))
        {
            return "Phone number is required.";
        }

        if (!PhoneRegex.IsMatch(cleanedPhone))
        {
            return "Invalid phone format. Enter 10 digits starting with 0 (e.g., 0712345678) or +94 followed by 9 digits (e.g., +94712345678).";
        }

        var trimmedAddress = address?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmedAddress))
        {
            return "Address is required.";
        }

        if (trimmedAddress.Length < 5)
        {
            return "Address must be at least 5 characters.";
        }

        return null;
    }

    private static string CleanPhone(string? phone)
    {
        // Strip spaces and hyphens from the phone number while preserving country code prefix.
        if (string.IsNullOrWhiteSpace(phone))
        {
            return string.Empty;
        }

        return Regex.Replace(phone.Trim(), @"[\s-]", string.Empty);
    }

    private static ProsumerResponse MapToResponse(Prosumer prosumer)
    {
        // Convert the internal MongoDB prosumer document into a clean external DTO.
        return new ProsumerResponse
        {
            Nic = prosumer.Nic,
            FullName = prosumer.FullName,
            Email = prosumer.Email,
            Phone = prosumer.Phone,
            Address = prosumer.Address,
            Role = prosumer.Role,
            Status = prosumer.Status.ToString(),
            CreatedAt = prosumer.CreatedAt,
            UpdatedAt = prosumer.UpdatedAt
        };
    }
}
