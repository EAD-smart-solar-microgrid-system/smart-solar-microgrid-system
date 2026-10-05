/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AuthDTOs.cs
 * Purpose: DTOs for authentication.
 */
using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Validation;

namespace SmartSolarMicrogrid.Api.DTOs;

public record LoginRequest(
    [Required, StringLength(AccountValidation.LoginIdentifierMaxLength, MinimumLength = 1)] string Username,
    [Required, StringLength(AccountValidation.PasswordMaxLength, MinimumLength = 1)] string Password
);

public record LoginResponse(
    string Token,
    string Username,
    WebUserRole Role
);

public record ProsumerLoginRequest(
    [Required] string Nic
);

public record ProsumerLoginResponse(
    string Token,
    string Nic,
    string FullName,
    string Email,
    string AccountStatus
);
