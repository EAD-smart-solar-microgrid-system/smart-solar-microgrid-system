/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IStationService.cs
 * Purpose: Define the station management service contract.
 */

using SmartSolarMicrogrid.Api.DTOs.Stations;

namespace SmartSolarMicrogrid.Api.Services;

public interface IStationService
{
    Task<StationServiceResult<IReadOnlyList<StationResponse>>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<StationServiceResult<StationResponse>> CreateAsync(
        CreateStationRequest request,
        CancellationToken cancellationToken = default);

    Task<StationServiceResult<StationResponse>> UpdateDetailsAsync(
        string id,
        UpdateStationRequest request,
        CancellationToken cancellationToken = default);

    Task<StationServiceResult<StationResponse>> ChangeStatusAsync(
        string id,
        UpdateStationStatusRequest request,
        CancellationToken cancellationToken = default);
}
