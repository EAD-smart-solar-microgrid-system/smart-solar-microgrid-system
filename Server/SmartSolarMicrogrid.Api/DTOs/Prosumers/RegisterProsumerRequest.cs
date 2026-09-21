/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: RegisterProsumerRequest.cs
 * Purpose: Define client-controlled data required for Prosumer registration.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Prosumers;

public sealed class RegisterProsumerRequest
{
    public string? Nic { get; set; }

    public string? FullName { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Address { get; set; }
}
