/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: RegisterProsumerRequest.cs
 * Purpose: Define client-controlled data required for Prosumer registration.
 */

using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogrid.Api.Common.Validation;

namespace SmartSolarMicrogrid.Api.DTOs.Prosumers;

public sealed class RegisterProsumerRequest
{
    [Required]
    public string? Nic { get; set; }

    [Required]
    [StringLength(AccountValidation.FullNameMaxLength, MinimumLength = AccountValidation.FullNameMinLength)]
    public string? FullName { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(AccountValidation.EmailMaxLength)]
    public string? Email { get; set; }

    [StringLength(AccountValidation.PhoneMaxLength)]
    public string? PhoneNumber { get; set; }

    [StringLength(AccountValidation.AddressMaxLength, MinimumLength = AccountValidation.AddressMinLength)]
    public string? Address { get; set; }
}
