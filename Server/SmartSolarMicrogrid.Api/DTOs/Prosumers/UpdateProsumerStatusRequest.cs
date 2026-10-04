/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UpdateProsumerStatusRequest.cs
 * Purpose: Receive administrative requests for prosumer activation, deactivation, or reactivation.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Prosumers;

public sealed class UpdateProsumerStatusRequest
{
    public string Status { get; set; } = string.Empty;

    public string? Reason { get; set; }
}
