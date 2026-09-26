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
    WebUserStatus Status
);

public record CreateWebUserRequest(
    [Required] string Username,
    [Required] string Password,
    [Required] WebUserRole Role
);

public record UpdateWebUserRequest(
    [Required] string Username,
    [Required] WebUserRole Role
);

public record UpdateWebUserStatusRequest(
    [Required] WebUserStatus Status
);
