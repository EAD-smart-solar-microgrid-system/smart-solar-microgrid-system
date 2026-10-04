/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UpdateEnergyBookingSlotRequest.cs
 * Purpose: Define client-controlled data required to update an energy booking slot.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Slots;

public sealed class UpdateEnergyBookingSlotRequest
{
    public DateTime SlotStartUtc { get; set; }

    public DateTime SlotEndUtc { get; set; }

    public double CapacityKw { get; set; }

    public bool IsAvailable { get; set; }
}
