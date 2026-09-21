/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IReservationService.cs
 * Purpose: Define business operations and validation contracts for energy slot reservation commands.
 */

using SmartSolarMicrogrid.Api.DTOs.Reservations;

namespace SmartSolarMicrogrid.Api.Services;

public interface IReservationService
{
    Task<ReservationServiceResult<ReservationResponse>> CreateAsync(
        CreateReservationRequest request,
        CancellationToken cancellationToken = default);

    Task<ReservationServiceResult<ReservationResponse>> UpdateAsync(
        string id,
        UpdateReservationRequest request,
        CancellationToken cancellationToken = default);

    Task<ReservationServiceResult<ReservationResponse>> CancelAsync(
        string id,
        CancelReservationRequest? request,
        CancellationToken cancellationToken = default);

    Task<ReservationServiceResult<QrTokenResponse>> GenerateQrTokenAsync(
        string id,
        CancellationToken cancellationToken = default);
}
