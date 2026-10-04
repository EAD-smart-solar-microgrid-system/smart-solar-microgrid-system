/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UpdateProsumerProfileRequest.cs
 * Purpose: Define editable Prosumer profile fields.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Prosumers;

public sealed class UpdateProsumerProfileRequest
{
    public string? FullName { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Address { get; set; }
}
