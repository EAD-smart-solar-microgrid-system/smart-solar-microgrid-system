/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EnergyBookingSlotAvailabilityChecker.cs
 * Purpose: Validate reservation requests against Member 4 EnergyBookingSlots availability and time windows.
 */

using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class EnergyBookingSlotAvailabilityChecker : ISlotAvailabilityChecker
{
    private readonly IEnergyBookingSlotRepository _slotRepository;

    public EnergyBookingSlotAvailabilityChecker(IEnergyBookingSlotRepository slotRepository)
    {
        // Bind the energy booking slot repository used to verify slot ownership and availability.
        _slotRepository = slotRepository;
    }

    public async Task<bool?> IsSlotAvailableAsync(
        string stationId,
        string slotId,
        DateTime reservationDateTime,
        CancellationToken cancellationToken = default)
    {
        // Reject invalid station identifiers before querying MongoDB.
        if (string.IsNullOrWhiteSpace(stationId) || !ObjectId.TryParse(stationId, out _))
        {
            return false;
        }

        // Reject invalid slot identifiers before querying MongoDB.
        if (string.IsNullOrWhiteSpace(slotId) || !ObjectId.TryParse(slotId, out _))
        {
            return false;
        }

        // Load the requested booking slot from the EnergyBookingSlots collection.
        var slot = await _slotRepository.GetByIdAsync(slotId.Trim(), cancellationToken);

        // Treat a missing slot as unavailable for the reservation request.
        if (slot is null)
        {
            return false;
        }

        // Ensure the slot belongs to the station referenced by the reservation.
        if (!string.Equals(slot.StationId, stationId.Trim(), StringComparison.Ordinal))
        {
            return false;
        }

        // Enforce the Member 4 availability flag before accepting the reservation time.
        if (!slot.IsAvailable)
        {
            return false;
        }

        // Confirm the reservation instant falls inside the slot's configured UTC window.
        var reservationUtc = NormalizeToUtc(reservationDateTime);
        var slotStartUtc = NormalizeToUtc(slot.SlotStartUtc);
        var slotEndUtc = NormalizeToUtc(slot.SlotEndUtc);

        if (reservationUtc < slotStartUtc || reservationUtc > slotEndUtc)
        {
            return false;
        }

        return true;
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        // Normalize unspecified timestamps as UTC to match server-side slot storage.
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            _ => value.ToUniversalTime()
        };
    }
}
