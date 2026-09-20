/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerResponse.cs
 * Purpose: Expose normalized solar prosumer account details to API clients.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Prosumers;

public sealed class ProsumerResponse
{
    public string Nic { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime RegisteredAt => CreatedAt;

    public DateTime UpdatedAt { get; set; }
}
