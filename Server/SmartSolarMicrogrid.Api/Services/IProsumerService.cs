/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IProsumerService.cs
 * Purpose: Define business operations and validation contracts for solar prosumers.
 */

using SmartSolarMicrogrid.Api.DTOs.Prosumers;

namespace SmartSolarMicrogrid.Api.Services;

public interface IProsumerService
{
    Task<ProsumerServiceResult<IReadOnlyList<ProsumerResponse>>> GetAllAsync(
        string? statusFilter = null,
        CancellationToken cancellationToken = default);

    Task<ProsumerServiceResult<ProsumerResponse>> GetByNicAsync(
        string nic,
        CancellationToken cancellationToken = default);

    Task<ProsumerServiceResult<ProsumerResponse>> CreateAsync(
        CreateProsumerRequest request,
        CancellationToken cancellationToken = default);

    Task<ProsumerServiceResult<ProsumerResponse>> UpdateDetailsAsync(
        string nic,
        UpdateProsumerRequest request,
        CancellationToken cancellationToken = default);

    Task<ProsumerServiceResult<ProsumerResponse>> ChangeStatusAsync(
        string nic,
        UpdateProsumerStatusRequest request,
        CancellationToken cancellationToken = default);
}
