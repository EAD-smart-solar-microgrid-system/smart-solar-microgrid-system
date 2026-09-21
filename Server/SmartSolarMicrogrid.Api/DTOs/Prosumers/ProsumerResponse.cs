/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerResponse.cs
 * Purpose: Define the public Prosumer profile response.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Prosumers;

public sealed class ProsumerResponse
{
    public string Nic { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string? Address { get; set; }

    public string AccountStatus { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
