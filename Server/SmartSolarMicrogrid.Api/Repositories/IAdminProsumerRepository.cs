/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IAdminProsumerRepository.cs
 * Purpose: Define administrative persistence operations for prosumers in the shared UsersDetail collection.
 */

using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public interface IAdminProsumerRepository
{
    Task<IReadOnlyList<Prosumer>> GetAllAsync(
        string? adminStatusFilter = null,
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
        string normalizedNic,
        string fullName,
        string email,
        string? phoneNumber,
        string? address,
        DateTime updatedAt,
        CancellationToken cancellationToken = default);

    Task<Prosumer?> UpdateStatusAsync(
        string normalizedNic,
        ProsumerAccountStatus status,
        DateTime updatedAt,
        CancellationToken cancellationToken = default);
}
