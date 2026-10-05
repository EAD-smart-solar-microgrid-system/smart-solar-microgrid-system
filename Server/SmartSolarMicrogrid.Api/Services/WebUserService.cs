/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: WebUserService.cs
 * Purpose: Implementation of web user management and security lifecycle business logic.
 */

using System.Security.Cryptography;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Validation;
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
        // Store user, prosumer, email, and logging dependencies for web account management.
        _repo = repo;
        _prosumerRepo = prosumerRepo;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<List<WebUserDto>> GetAllUsersAsync()
    {
        // Retrieve all web users and project them into public DTO responses.
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
        // Look up a single web user by identifier and map to a DTO.
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
        // Create a new web user with hashed password and optional credential email delivery.
        var existing = await _repo.GetByUsernameAsync(request.Username);
        if (existing != null) return null; // Username already exists

        var email = request.Email.Trim();
        if (string.IsNullOrWhiteSpace(email) || await _repo.GetByEmailAsync(email) != null) return null;

        var verificationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var unusableRandomPassword = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        var user = new WebUser
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Username = username,
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

    public async Task<(bool Success, bool Conflict)> UpdateUserAsync(string id, UpdateWebUserRequest request)
    {
        // Update editable profile fields for an existing web user.
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return (false, false);

        if (AccountValidation.GetUsernameError(request.Username) is not null ||
            !AccountValidation.IsSupportedRole(request.Role) ||
            AccountValidation.GetEmailError(request.Email) is not null)
        {
            return (false, false);
        }

        var matchingUsername = await _repo.GetByUsernameAsync(request.Username);
        if (matchingUsername is not null && matchingUsername.Id != id) return (false, true);

        var matchingEmail = await _repo.GetByEmailAsync(request.Email);
        if (matchingEmail is not null && matchingEmail.Id != id) return (false, true);

        user.Username = request.Username.Trim();
        user.Role = request.Role;
        user.Email = request.Email.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(id, user);
        return (true, false);
    }

    public async Task<bool> UpdateUserStatusAsync(string id, UpdateWebUserStatusRequest request)
    {
        // Apply an administrative status change to the specified web user.
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return false;

        user.Status = request.Status;
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(id, user);
        return true;
    }

    public async Task<bool> ForgotPasswordAsync(string email)
    {
        // Issue a password reset token for matching web users or prosumers by email.
        if (string.IsNullOrWhiteSpace(email)) return false;

        var user = await _repo.GetByEmailAsync(email);
        if (user == null)
        {
            _logger.LogInformation("Password reset requested for non-existent web-user email {Email}", email);
            return false;
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
        // Validate the reset token and persist a new hashed password.
        if (string.IsNullOrWhiteSpace(token))
        {
            return (false, tokenError);
        }

        var passwordError = AccountValidation.GetNewPasswordError(newPassword);
        if (passwordError is not null)
        {
            return (false, passwordError);
        }

        var user = await _repo.GetByResetTokenAsync(token.Trim());
        if (user == null)
        {
            return (false, "Invalid or expired password reset token.");
        }

        if (user.PasswordResetExpiry == null || user.PasswordResetExpiry < DateTime.UtcNow)
        {
            return (false, "This password reset token has expired. Please request a new one.");
        }

        user.PasswordHash = PasswordHasher.Hash(newPassword);
        // Successfully using the reset link proves control of the registered mailbox.
        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationExpiry = null;
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(user.Id, user);
        return (true, "Password has been successfully updated. You may now log in with your new credentials.");
    }

    public async Task<(bool Success, string Message)> CompleteRegistrationAsync(string token, string newPassword)
    {
        // Mark the user email as verified when the token is valid.
        if (string.IsNullOrWhiteSpace(token))
        {
            return (false, passwordError);
        }

        var user = await _repo.GetByVerificationTokenAsync(token.Trim());
        if (user == null)
        {
            return (false, "Invalid or already-used account setup link.");
        }

        var expiry = user.EmailVerificationExpiry ?? user.CreatedAt.AddHours(24);
        if (expiry < DateTime.UtcNow)
        {
            return (false, "This account setup link has expired. Please ask an administrator for a new invitation.");
        }

        user.PasswordHash = PasswordHasher.Hash(newPassword);
        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(user.Id, user);
        return (true, "Your email is verified and your password has been created. You can now sign in.");
    }

    public async Task<int> BroadcastEmailAsync(string subject, string message, string? targetRole)
    {
        // Collect recipient emails by role filter and dispatch the broadcast announcement.
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
