/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ActiveReservationChecker.cs
 * Purpose: Provide authoritative reservation checks to protect microgrid nodes from deactivation while active bookings exist.
 */

using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class ActiveReservationChecker : IActiveReservationChecker
{
    private readonly IReservationRepository _reservationRepository;

    public ActiveReservationChecker(IReservationRepository reservationRepository)
    {
        // Bind the reservation repository for checking active reservations against the EnergyReservation collection.
        _reservationRepository = reservationRepository;
    }

    public async Task<bool?> HasActiveReservationsAsync(
        string stationId,
        CancellationToken cancellationToken = default)
    {
        // Query the repository to ascertain if any pending or approved reservations are linked to this station.
        var hasActive = await _reservationRepository
            .HasActiveReservationsForStationAsync(stationId, cancellationToken);

        return hasActive;
    }
}
