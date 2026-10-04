/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: CreateEnergyBookingSlotRequest.cs
 * Purpose: Define client-controlled data required to create an energy booking slot.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Slots;

public sealed class CreateEnergyBookingSlotRequest
{
    public DateTime SlotStartUtc { get; set; }

    public DateTime SlotEndUtc { get; set; }

    public double CapacityKw { get; set; }

    public bool IsAvailable { get; set; } = true;
}
