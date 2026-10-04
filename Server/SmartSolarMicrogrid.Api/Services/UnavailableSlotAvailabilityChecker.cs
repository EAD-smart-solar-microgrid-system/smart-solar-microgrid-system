/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UnavailableSlotAvailabilityChecker.cs
 * Purpose: Signal that Member 4's battery slot management is not yet integrated without hard-coding availability.
 */

namespace SmartSolarMicrogrid.Api.Services;

public sealed class UnavailableSlotAvailabilityChecker : ISlotAvailabilityChecker
{
    public Task<SlotAvailabilityStatus> CheckSlotAvailabilityAsync(
        string stationId,
        string slotId,
        DateTime reservationDateTime,
        CancellationToken cancellationToken = default)
    {
        // Signal that Member 4's dynamic slot availability service is not yet deployed.
        return Task.FromResult(SlotAvailabilityStatus.ServiceUnavailable);
    }
}
