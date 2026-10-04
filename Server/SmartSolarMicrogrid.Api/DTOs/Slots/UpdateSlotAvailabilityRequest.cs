/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UpdateSlotAvailabilityRequest.cs
 * Purpose: Define the client request used to change slot availability only.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Slots;

public sealed class UpdateSlotAvailabilityRequest
{
    public bool IsAvailable { get; set; }
}
