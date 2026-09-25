/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ISlotAvailabilityChecker.cs
 * Purpose: Define the slot validation boundary contract consumed from Member 4's battery slot management.
 */

namespace SmartSolarMicrogrid.Api.Services;

public interface ISlotAvailabilityChecker
{
    Task<SlotAvailabilityStatus> CheckSlotAvailabilityAsync(
        string stationId,
        string slotId,
        DateTime reservationDateTime,
        CancellationToken cancellationToken = default);
}
