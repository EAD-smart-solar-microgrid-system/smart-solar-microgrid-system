/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IEnergyBookingSlotRepository.cs
 * Purpose: Define MongoDB operations required by energy booking slot services.
 */

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public interface IEnergyBookingSlotRepository
{
    Task<IReadOnlyList<EnergyBookingSlot>> GetByStationIdAsync(
        string stationId,
        CancellationToken cancellationToken = default);

    Task<EnergyBookingSlot?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default);

    Task<EnergyBookingSlot> CreateAsync(
        EnergyBookingSlot slot,
        CancellationToken cancellationToken = default);

    Task<EnergyBookingSlot?> UpdateAsync(
        EnergyBookingSlot slot,
        CancellationToken cancellationToken = default);

    Task<EnergyBookingSlot?> UpdateAvailabilityAsync(
        string id,
        bool isAvailable,
        DateTime updatedAt,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        string id,
        CancellationToken cancellationToken = default);
}
