/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AdminProsumerResponse.cs
 * Purpose: Expose normalized administrative prosumer account details to API clients.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Prosumers;

public sealed class AdminProsumerResponse
{
    public string Nic { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string? Address { get; set; }

    public string Role { get; set; } = "Solar Prosumer";

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
