/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: WebUserDTOs.cs
 * Purpose: DTOs for web user management.
 */
using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.DTOs;

public record WebUserDto(
    string Id,
    string Username,
    WebUserRole Role,
    WebUserStatus Status,
    string? Email = null,
    bool IsEmailVerified = false,
    bool? InvitationEmailSent = null
);

public record CreateWebUserRequest(
    [Required] string Username,
    [Required] WebUserRole Role,
    [Required, EmailAddress] string Email
);

public record UpdateWebUserRequest(
    [Required] string Username,
    [Required] WebUserRole Role,
    string? Email = null
);

public record UpdateWebUserStatusRequest(
    [Required] WebUserStatus Status
);

public record ForgotPasswordRequest(
    [Required] string Email
);

public record ResetPasswordRequest(
    [Required] string Token,
    [Required] string NewPassword
);

public record BroadcastEmailRequest(
    [Required] string Subject,
    [Required] string Message,
    string? TargetRole = null
);
