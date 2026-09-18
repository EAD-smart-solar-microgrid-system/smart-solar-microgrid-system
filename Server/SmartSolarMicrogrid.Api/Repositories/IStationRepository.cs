/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IStationRepository.cs
 * Purpose: Define MongoDB operations required by station management services.
 */

using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public interface IStationRepository
{
    Task<IReadOnlyList<SolarStation>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<SolarStation?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    Task<SolarStation> CreateAsync(SolarStation station, CancellationToken cancellationToken = default);

    Task<SolarStation?> UpdateDetailsAsync(
        SolarStation station,
        CancellationToken cancellationToken = default);

    Task<SolarStation?> UpdateStatusAsync(
        string id,
        StationStatus status,
        DateTime updatedAt,
        CancellationToken cancellationToken = default);
}
