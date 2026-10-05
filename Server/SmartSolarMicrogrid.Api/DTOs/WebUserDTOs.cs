/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: WebUserDTOs.cs
 * Purpose: DTOs for web user management.
 */
using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Validation;

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
    [Required, EnumDataType(typeof(WebUserRole))] WebUserRole Role,
    [Required, EmailAddress, StringLength(AccountValidation.EmailMaxLength)] string Email
);

public record UpdateWebUserRequest(
    [Required] string Username,
    [Required, EnumDataType(typeof(WebUserRole))] WebUserRole Role,
    [Required, EmailAddress, StringLength(AccountValidation.EmailMaxLength)] string Email
);

public record UpdateWebUserStatusRequest(
    [Required] WebUserStatus Status
);

public record ForgotPasswordRequest(
    [Required, EmailAddress, StringLength(AccountValidation.EmailMaxLength)] string Email
);

public record ResetPasswordRequest(
    [Required, RegularExpression(AccountValidation.TokenPatternText)] string Token,
    [Required, StringLength(AccountValidation.PasswordMaxLength, MinimumLength = AccountValidation.PasswordMinLength)] string NewPassword
);

public record CompleteRegistrationRequest(
    [Required, RegularExpression(AccountValidation.TokenPatternText)] string Token,
    [Required, StringLength(AccountValidation.PasswordMaxLength, MinimumLength = AccountValidation.PasswordMinLength)] string NewPassword
);

public record BroadcastEmailRequest(
    [Required] string Subject,
    [Required] string Message,
    string? TargetRole = null
);
