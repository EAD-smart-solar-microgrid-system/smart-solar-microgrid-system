/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EnergyBookingSlotResponse.cs
 * Purpose: Define the public response contract for an energy booking slot.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Slots;

public sealed class EnergyBookingSlotResponse
{
    public string Id { get; set; } = string.Empty;

    public string StationId { get; set; } = string.Empty;

    public DateTime SlotStartUtc { get; set; }

    public DateTime SlotEndUtc { get; set; }

    public double CapacityKw { get; set; }

    public bool IsAvailable { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
