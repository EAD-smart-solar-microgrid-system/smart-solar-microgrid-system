/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AdminProsumerService.cs
 * Purpose: Enforce business validations, coarse administrative lifecycle mappings, and DTO projections.
 */

using System.Text.RegularExpressions;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class AdminProsumerService : IAdminProsumerService
{
    private static readonly Regex OldNicRegex = new(@"^\d{9}[VX]$", RegexOptions.Compiled);
    private static readonly Regex NewNicRegex = new(@"^\d{12}$", RegexOptions.Compiled);
    private static readonly Regex EmailRegex = new(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"^(0\d{9}|\+94\d{9})$", RegexOptions.Compiled);

    private readonly IAdminProsumerRepository _adminRepository;

    public AdminProsumerService(IAdminProsumerRepository adminRepository)
    {
        _adminRepository = adminRepository;
    }

    public async Task<AdminProsumerServiceResult<IReadOnlyList<AdminProsumerResponse>>> GetAllAsync(
        string? statusFilter = null,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(statusFilter))
        {
            var filter = statusFilter.Trim().ToLowerInvariant();
            if (filter is not "pending" and not "active" and not "deactivated")
            {
                return AdminProsumerServiceResult<IReadOnlyList<AdminProsumerResponse>>.Failure(
                    AdminProsumerErrorType.Validation,
                    "Invalid status filter. Permitted values are Pending, Active, or Deactivated.");
            }
        }

        var prosumers = await _adminRepository.GetAllAsync(statusFilter, cancellationToken);
        var responses = prosumers.Select(MapToResponse).ToList();

        return AdminProsumerServiceResult<IReadOnlyList<AdminProsumerResponse>>.Success(responses);
    }

    public async Task<AdminProsumerServiceResult<AdminProsumerResponse>> GetByNicAsync(
        string nic,
        CancellationToken cancellationToken = default)
    {
        var normalizedNic = NormalizeNic(nic);

        if (string.IsNullOrEmpty(normalizedNic) || !IsValidNic(normalizedNic))
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.Validation,
                "A valid Sri Lankan National Identity Card (NIC) is required.");
        }

        var prosumer = await _adminRepository.GetByNicAsync(normalizedNic, cancellationToken);

        if (prosumer is null)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        return AdminProsumerServiceResult<AdminProsumerResponse>.Success(MapToResponse(prosumer));
    }

    public async Task<AdminProsumerServiceResult<AdminProsumerResponse>> CreateAsync(
        CreateProsumerRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedNic = NormalizeNic(request.Nic);

        var validationError = ValidateFields(
            normalizedNic,
            request.FullName,
            request.Email,
            request.Phone,
            request.Address,
            requireNic: true);

        if (validationError is not null)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.Validation,
                validationError);
        }

        var exists = await _adminRepository.ExistsByNicAsync(normalizedNic, cancellationToken);

        if (exists)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.Conflict,
                "A prosumer with this National Identity Card (NIC) already exists.");
        }

        var now = DateTime.UtcNow;
        var cleanPhone = CleanPhone(request.Phone);

        // Uses Member 4's canonical Prosumer model
        var prosumer = new Prosumer
        {
            Nic = normalizedNic,
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            PhoneNumber = cleanPhone,
            Address = request.Address?.Trim(),
            AccountStatus = ProsumerAccountStatus.PendingActivation,
            CreatedAt = now,
            UpdatedAt = now
        };

        var created = await _adminRepository.CreateAsync(prosumer, cancellationToken);

        return AdminProsumerServiceResult<AdminProsumerResponse>.Success(MapToResponse(created));
    }

    public async Task<AdminProsumerServiceResult<AdminProsumerResponse>> UpdateDetailsAsync(
        string nic,
        UpdateProsumerRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedNic = NormalizeNic(nic);

        if (string.IsNullOrEmpty(normalizedNic) || !IsValidNic(normalizedNic))
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.Validation,
                "A valid Sri Lankan National Identity Card (NIC) is required.");
        }

        var validationError = ValidateFields(
            normalizedNic,
            request.FullName,
            request.Email,
            request.Phone,
            request.Address,
            requireNic: false);

        if (validationError is not null)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.Validation,
                validationError);
        }

        var existing = await _adminRepository.GetByNicAsync(normalizedNic, cancellationToken);

        if (existing is null)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        var cleanPhone = CleanPhone(request.Phone);
        var updated = await _adminRepository.UpdateDetailsAsync(
            normalizedNic,
            request.FullName.Trim(),
            request.Email.Trim(),
            cleanPhone,
            request.Address?.Trim(),
            DateTime.UtcNow,
            cancellationToken);

        if (updated is null)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        return AdminProsumerServiceResult<AdminProsumerResponse>.Success(MapToResponse(updated));
    }

    public async Task<AdminProsumerServiceResult<AdminProsumerResponse>> ChangeStatusAsync(
        string nic,
        UpdateProsumerStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedNic = NormalizeNic(nic);

        if (string.IsNullOrEmpty(normalizedNic) || !IsValidNic(normalizedNic))
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.Validation,
                "A valid Sri Lankan National Identity Card (NIC) is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.Validation,
                "Status is required.");
        }

        var requestedLower = request.Status.Trim().ToLowerInvariant();
        if (requestedLower is not "pending" and not "active" and not "deactivated")
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.Validation,
                "Status must be Pending, Active, or Deactivated.");
        }

        var existing = await _adminRepository.GetByNicAsync(normalizedNic, cancellationToken);

        if (existing is null)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        ProsumerAccountStatus targetAccountStatus;

        if (existing.AccountStatus == ProsumerAccountStatus.DeactivationRequested)
        {
            // Explicitly handle deactivation requests:
            // Admin choosing "Deactivated" approves the user's request.
            // Admin choosing "Active" rejects the request and keeps the account active.
            if (requestedLower == "deactivated")
            {
                targetAccountStatus = ProsumerAccountStatus.Deactivated;
            }
            else if (requestedLower == "active")
            {
                targetAccountStatus = ProsumerAccountStatus.Active;
            }
            else
            {
                return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                    AdminProsumerErrorType.Validation,
                    "An account with a pending deactivation request can only be Approved (Deactivated) or Kept Active.");
            }
        }
        else
        {
            targetAccountStatus = requestedLower switch
            {
                "active" => ProsumerAccountStatus.Active,
                "deactivated" => ProsumerAccountStatus.Deactivated,
                _ => ProsumerAccountStatus.PendingActivation
            };
        }

        if (existing.AccountStatus == targetAccountStatus)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Success(MapToResponse(existing));
        }

        var updated = await _adminRepository.UpdateStatusAsync(
            normalizedNic,
            targetAccountStatus,
            DateTime.UtcNow,
            cancellationToken);

        if (updated is null)
        {
            return AdminProsumerServiceResult<AdminProsumerResponse>.Failure(
                AdminProsumerErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        return AdminProsumerServiceResult<AdminProsumerResponse>.Success(MapToResponse(updated));
    }

    public static string NormalizeNic(string? nic)
    {
        return string.IsNullOrWhiteSpace(nic)
            ? string.Empty
            : nic.Trim().ToUpperInvariant();
    }

    public static bool IsValidNic(string? normalizedNic)
    {
        if (string.IsNullOrWhiteSpace(normalizedNic))
        {
            return false;
        }

        var normalized = NormalizeNic(normalizedNic);
        return OldNicRegex.IsMatch(normalized) || NewNicRegex.IsMatch(normalized);
    }

    private static string? ValidateFields(
        string normalizedNic,
        string? fullName,
        string? email,
        string? phone,
        string? address,
        bool requireNic)
    {
        if (requireNic)
        {
            if (string.IsNullOrEmpty(normalizedNic))
            {
                return "National Identity Card (NIC) is required.";
            }

            if (!IsValidNic(normalizedNic))
            {
                return "Invalid NIC format. Must be 9 digits followed by V/X or 12 digits.";
            }
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            return "Full name is required.";
        }

        if (fullName.Trim().Length < 2)
        {
            return "Full name must be at least 2 characters.";
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return "Email address is required.";
        }

        if (!EmailRegex.IsMatch(email.Trim()))
        {
            return "Email must be a valid email address.";
        }

        if (string.IsNullOrWhiteSpace(phone))
        {
            return "Phone number is required.";
        }

        var cleanedPhone = CleanPhone(phone);
        if (!PhoneRegex.IsMatch(cleanedPhone))
        {
            return "Phone number must be a valid Sri Lankan phone number (e.g. 0712345678 or +94712345678).";
        }

        if (string.IsNullOrWhiteSpace(address))
        {
            return "Address is required.";
        }

        return null;
    }

    private static string CleanPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return string.Empty;
        }

        return phone.Trim().Replace(" ", string.Empty).Replace("-", string.Empty);
    }

    public static AdminProsumerResponse MapToResponse(Prosumer prosumer)
    {
        // Coarse admin view mapping:
        // PendingActivation -> Pending
        // Active -> Active
        // DeactivationRequested -> Active (with note or mapped coarsely)
        // Deactivated -> Deactivated
        var adminStatus = prosumer.AccountStatus switch
        {
            ProsumerAccountStatus.Active => "Active",
            ProsumerAccountStatus.DeactivationRequested => "Active",
            ProsumerAccountStatus.Deactivated => "Deactivated",
            _ => "Pending"
        };

        return new AdminProsumerResponse
        {
            Nic = prosumer.Nic,
            FullName = prosumer.FullName,
            Email = prosumer.Email,
            Phone = prosumer.PhoneNumber ?? string.Empty,
            Address = prosumer.Address,
            Role = "Solar Prosumer",
            Status = adminStatus,
            CreatedAt = prosumer.CreatedAt,
            UpdatedAt = prosumer.UpdatedAt
        };
    }
}
