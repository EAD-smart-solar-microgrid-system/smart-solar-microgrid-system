/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IProsumerRepository.cs
 * Purpose: Define persistence contracts for solar prosumer accounts in MongoDB.
 */

using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public interface IProsumerRepository
{
    Task<IReadOnlyList<Prosumer>> GetAllAsync(
        ProsumerStatus? status = null,
        CancellationToken cancellationToken = default);

    Task<Prosumer?> GetByNicAsync(
        string normalizedNic,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsByNicAsync(
        string normalizedNic,
        CancellationToken cancellationToken = default);

    Task<Prosumer> CreateAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default);

    Task<Prosumer?> UpdateDetailsAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default);

    Task<Prosumer?> UpdateStatusAsync(
        string normalizedNic,
        ProsumerStatus status,
        DateTime updatedAt,
        CancellationToken cancellationToken = default);
}
