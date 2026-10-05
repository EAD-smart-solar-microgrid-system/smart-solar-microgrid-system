/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: WebUserService.cs
 * Purpose: Implementation of web user management and security lifecycle business logic.
 */

using System.Security.Cryptography;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public class WebUserService : IWebUserService
{
    private readonly IWebUserRepository _repo;
    private readonly IAdminProsumerRepository _prosumerRepo;
    private readonly IEmailService _emailService;
    private readonly ILogger<WebUserService> _logger;

    public WebUserService(
        IWebUserRepository repo,
        IAdminProsumerRepository prosumerRepo,
        IEmailService emailService,
        ILogger<WebUserService> logger)
    {
        _repo = repo;
        _prosumerRepo = prosumerRepo;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<List<WebUserDto>> GetAllUsersAsync()
    {
        var users = await _repo.GetAllAsync();
        return users.Select(u => new WebUserDto(
            u.Id,
            u.Username,
            u.Role,
            u.Status,
            u.Email,
            u.IsEmailVerified
        )).ToList();
    }

    public async Task<WebUserDto?> GetUserByIdAsync(string id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return null;
        return new WebUserDto(
            user.Id,
            user.Username,
            user.Role,
            user.Status,
            user.Email,
            user.IsEmailVerified
        );
    }

    public async Task<WebUserDto?> CreateUserAsync(CreateWebUserRequest request)
    {
        var existing = await _repo.GetByUsernameAsync(request.Username);
        if (existing != null) return null;

        var email = request.Email.Trim();
        if (string.IsNullOrWhiteSpace(email) || await _repo.GetByEmailAsync(email) != null) return null;

        var verificationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var unusableRandomPassword = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        var user = new WebUser
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Username = request.Username.Trim(),
            PasswordHash = PasswordHasher.Hash(unusableRandomPassword),
            Role = request.Role,
            Status = WebUserStatus.Active,
            Email = email,
            IsEmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationExpiry = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repo.CreateAsync(user);

        var roleTitle = user.Role == WebUserRole.Backoffice ? "Administrator" : "Grid Operator";
        var invitationEmailSent = await _emailService.SendAccountInvitationEmailAsync(
            user.Email, user.Username, roleTitle, verificationToken);

        return new WebUserDto(
            user.Id,
            user.Username,
            user.Role,
            user.Status,
            user.Email,
            user.IsEmailVerified,
            invitationEmailSent
        );
    }

    public async Task<bool> UpdateUserAsync(string id, UpdateWebUserRequest request)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return false;

        user.Username = request.Username.Trim();
        user.Role = request.Role;
        if (request.Email != null)
        {
            user.Email = request.Email.Trim();
        }
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(id, user);
        return true;
    }

    public async Task<bool> UpdateUserStatusAsync(string id, UpdateWebUserStatusRequest request)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return false;

        user.Status = request.Status;
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(id, user);
        return true;
    }

    public async Task<bool> ForgotPasswordAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;

        var user = await _repo.GetByEmailAsync(email);
        if (user == null)
        {
            // Also check prosumers to see if an email matches
            var prosumers = await _prosumerRepo.GetAllAsync();
            var prosumer = prosumers.FirstOrDefault(p => string.Equals(p.Email, email.Trim(), StringComparison.OrdinalIgnoreCase));
            if (prosumer == null)
            {
                _logger.LogInformation("Password reset requested for non-existent email {Email}", email);
                return false;
            }

            // For prosumer account with email
            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            await _emailService.SendPasswordResetEmailAsync(prosumer.Email, prosumer.FullName, token);
            return true;
        }

        var resetToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = resetToken;
        user.PasswordResetExpiry = DateTime.UtcNow.AddMinutes(15);
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(user.Id, user);
        await _emailService.SendPasswordResetEmailAsync(user.Email, user.Username, resetToken);
        return true;
    }

    public async Task<(bool Success, string Message)> ResetPasswordAsync(string token, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return (false, "Reset token is required.");
        }

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
        {
            return (false, "Password must be at least 6 characters long.");
        }

        var user = await _repo.GetByResetTokenAsync(token);
        if (user == null)
        {
            return (false, "Invalid or expired password reset token.");
        }

        if (user.PasswordResetExpiry == null || user.PasswordResetExpiry < DateTime.UtcNow)
        {
            return (false, "This password reset token has expired. Please request a new one.");
        }

        user.PasswordHash = PasswordHasher.Hash(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(user.Id, user);
        return (true, "Password has been successfully updated. You may now log in with your new credentials.");
    }

    public async Task<(bool Success, string Message)> VerifyEmailAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return (false, "Verification token is required.");
        }

        var user = await _repo.GetByVerificationTokenAsync(token);
        if (user == null)
        {
            return (false, "Invalid or expired email verification token.");
        }

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(user.Id, user);
        return (true, "Email has been successfully verified!");
    }

    public async Task<int> BroadcastEmailAsync(string subject, string message, string? targetRole)
    {
        var recipientEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // 1. Gather web user emails
        var webUsers = await _repo.GetAllAsync();
        foreach (var u in webUsers)
        {
            if (string.IsNullOrWhiteSpace(u.Email)) continue;

            if (string.IsNullOrWhiteSpace(targetRole) ||
                string.Equals(targetRole, "All", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(targetRole, u.Role.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                recipientEmails.Add(u.Email);
            }
        }

        // 2. Gather prosumer emails if targetRole is All or Prosumer
        if (string.IsNullOrWhiteSpace(targetRole) ||
            string.Equals(targetRole, "All", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(targetRole, "Prosumer", StringComparison.OrdinalIgnoreCase))
        {
            var prosumers = await _prosumerRepo.GetAllAsync();
            foreach (var p in prosumers)
            {
                if (!string.IsNullOrWhiteSpace(p.Email))
                {
                    recipientEmails.Add(p.Email);
                }
            }
        }

        _logger.LogInformation("Broadcasting announcement '{Subject}' to {Count} recipients", subject, recipientEmails.Count);
        return await _emailService.SendBroadcastEmailAsync(recipientEmails, subject, message);
    }
}
