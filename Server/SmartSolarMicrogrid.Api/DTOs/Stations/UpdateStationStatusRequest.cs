/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UpdateStationStatusRequest.cs
 * Purpose: Define the client request for a controlled station status change.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public sealed class UpdateStationStatusRequest
{
    public string? Status { get; set; }
}
