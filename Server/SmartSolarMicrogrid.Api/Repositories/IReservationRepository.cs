/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IReservationRepository.cs
 * Purpose: Define persistence contracts for energy slot reservations in MongoDB.
 */

using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public interface IReservationRepository
{
    Task<EnergyReservation?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default);

    Task<EnergyReservation?> GetByQrTokenAsync(
        string qrToken,
        CancellationToken cancellationToken = default);

    Task<EnergyReservation> CreateAsync(
        EnergyReservation reservation,
        CancellationToken cancellationToken = default);

    Task<EnergyReservation?> UpdateAsync(
        EnergyReservation reservation,
        CancellationToken cancellationToken = default);

    Task<EnergyReservation?> UpdateStatusAsync(
        string id,
        ReservationStatus status,
        string? cancellationReason,
        DateTime? cancelledAt,
        DateTime updatedAt,
        CancellationToken cancellationToken = default);

    Task<EnergyReservation?> SaveQrTokenAsync(
        string id,
        string qrToken,
        DateTime issuedAt,
        DateTime expiresAt,
        DateTime updatedAt,
        CancellationToken cancellationToken = default);

    Task<bool> HasConflictingReservationAsync(
        string stationId,
        string slotId,
        DateTime reservationDateTime,
        string? excludeReservationId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveReservationsForStationAsync(
        string stationId,
        CancellationToken cancellationToken = default);
}
