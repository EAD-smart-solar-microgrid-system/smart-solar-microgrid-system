/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IAdminProsumerService.cs
 * Purpose: Define administrative business operations and lifecycle rules for solar prosumers.
 */

using SmartSolarMicrogrid.Api.DTOs.Prosumers;

namespace SmartSolarMicrogrid.Api.Services;

public interface IAdminProsumerService
{
    Task<AdminProsumerServiceResult<IReadOnlyList<AdminProsumerResponse>>> GetAllAsync(
        string? statusFilter = null,
        CancellationToken cancellationToken = default);

    Task<AdminProsumerServiceResult<AdminProsumerResponse>> GetByNicAsync(
        string nic,
        CancellationToken cancellationToken = default);

    Task<AdminProsumerServiceResult<AdminProsumerResponse>> CreateAsync(
        CreateProsumerRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminProsumerServiceResult<AdminProsumerResponse>> UpdateDetailsAsync(
        string nic,
        UpdateProsumerRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminProsumerServiceResult<AdminProsumerResponse>> ChangeStatusAsync(
        string nic,
        UpdateProsumerStatusRequest request,
        CancellationToken cancellationToken = default);
}
