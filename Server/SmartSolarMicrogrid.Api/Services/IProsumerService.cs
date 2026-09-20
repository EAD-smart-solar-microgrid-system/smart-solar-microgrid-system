/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IProsumerService.cs
 * Purpose: Define Prosumer registration and self-service account operations.
 */

using SmartSolarMicrogrid.Api.DTOs.Prosumers;

namespace SmartSolarMicrogrid.Api.Services;

public interface IProsumerService
{
    Task<ProsumerServiceResult<ProsumerResponse>> RegisterAsync(
        RegisterProsumerRequest request,
        CancellationToken cancellationToken = default);

    Task<ProsumerServiceResult<ProsumerResponse>> GetCurrentAsync(
        CancellationToken cancellationToken = default);

    Task<ProsumerServiceResult<ProsumerResponse>> UpdateCurrentAsync(
        UpdateProsumerProfileRequest request,
        CancellationToken cancellationToken = default);

    Task<ProsumerServiceResult<ProsumerResponse>> RequestDeactivationAsync(
        CancellationToken cancellationToken = default);
}
