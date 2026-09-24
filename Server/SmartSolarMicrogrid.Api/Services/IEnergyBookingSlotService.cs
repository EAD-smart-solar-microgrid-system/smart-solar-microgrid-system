/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IEnergyBookingSlotService.cs
 * Purpose: Define energy booking slot business operations exposed to controllers.
 */

using SmartSolarMicrogrid.Api.DTOs.Slots;

namespace SmartSolarMicrogrid.Api.Services;

public interface IEnergyBookingSlotService
{
    Task<StationServiceResult<IReadOnlyList<EnergyBookingSlotResponse>>> GetByStationIdAsync(
        string stationId,
        CancellationToken cancellationToken = default);

    Task<StationServiceResult<EnergyBookingSlotResponse>> CreateAsync(
        string stationId,
        CreateEnergyBookingSlotRequest request,
        CancellationToken cancellationToken = default);

    Task<StationServiceResult<EnergyBookingSlotResponse>> UpdateAsync(
        string slotId,
        UpdateEnergyBookingSlotRequest request,
        CancellationToken cancellationToken = default);

    Task<StationServiceResult<EnergyBookingSlotResponse>> UpdateAvailabilityAsync(
        string slotId,
        UpdateSlotAvailabilityRequest request,
        CancellationToken cancellationToken = default);

    Task<StationServiceResult<object?>> DeleteAsync(
        string slotId,
        CancellationToken cancellationToken = default);
}
