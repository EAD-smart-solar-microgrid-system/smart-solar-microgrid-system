/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IProsumerRepository.cs
 * Purpose: Define MongoDB operations required by Prosumer account services.
 */

using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public interface IProsumerRepository
{
    Task<Prosumer?> GetByNicAsync(
        string nic,
        CancellationToken cancellationToken = default);

    Task<Prosumer> CreateAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default);

    Task<Prosumer?> UpdateProfileAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default);

    Task<Prosumer?> UpdateStatusAsync(
        string nic,
        ProsumerAccountStatus status,
        DateTime updatedAt,
        CancellationToken cancellationToken = default);
}
