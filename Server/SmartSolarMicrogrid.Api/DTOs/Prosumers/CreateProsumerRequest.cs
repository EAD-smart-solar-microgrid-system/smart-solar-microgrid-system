/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: CreateProsumerRequest.cs
 * Purpose: Receive client data for registering a new solar prosumer profile.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Prosumers;

public sealed class CreateProsumerRequest
{
    public string Nic { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;
}
