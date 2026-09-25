/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationRepository.cs
 * Purpose: Execute MongoDB persistence operations for energy reservations in the EnergyReservation collection.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public sealed class ReservationRepository : IReservationRepository
{
    private const string CollectionName = "EnergyReservation";
    private readonly IMongoCollection<EnergyReservation> _reservations;

    public ReservationRepository(MongoDbContext databaseContext)
    {
        // Bind this repository to the agreed EnergyReservation MongoDB collection.
        _reservations = databaseContext.Database.GetCollection<EnergyReservation>(CollectionName);
    }

    public async Task<EnergyReservation?> GetByQrTokenAsync(
        string qrToken,
        CancellationToken cancellationToken = default)
    {
        return await _reservations
            .Find(reservation => reservation.QrToken == qrToken)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<EnergyReservation?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        // Retrieve a single reservation document by its MongoDB identifier.
        return await _reservations
            .Find(reservation => reservation.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<EnergyReservation> CreateAsync(
        EnergyReservation reservation,
        CancellationToken cancellationToken = default)
    {
        // Insert a new energy reservation document into the MongoDB collection.
        await _reservations.InsertOneAsync(reservation, cancellationToken: cancellationToken);
        return reservation;
    }

    public async Task<EnergyReservation?> UpdateAsync(
        EnergyReservation reservation,
        CancellationToken cancellationToken = default)
    {
        // Replace an existing reservation document with updated schedule and slot fields.
        return await _reservations.FindOneAndReplaceAsync(
            existing => existing.Id == reservation.Id,
            reservation,
            new FindOneAndReplaceOptions<EnergyReservation>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<EnergyReservation?> UpdateStatusAsync(
        string id,
        ReservationStatus status,
        string? cancellationReason,
        DateTime? cancelledAt,
        DateTime updatedAt,
        CancellationToken cancellationToken = default)
    {
        // Update reservation status and cancellation metadata with server timestamps.
        var update = Builders<EnergyReservation>.Update
            .Set(reservation => reservation.Status, status)
            .Set(reservation => reservation.CancellationReason, cancellationReason)
            .Set(reservation => reservation.CancelledAt, cancelledAt)
            .Set(reservation => reservation.UpdatedAt, updatedAt);

        return await _reservations.FindOneAndUpdateAsync(
            reservation => reservation.Id == id,
            update,
            new FindOneAndUpdateOptions<EnergyReservation>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<EnergyReservation?> SaveQrTokenAsync(
        string id,
        string qrToken,
        DateTime issuedAt,
        DateTime expiresAt,
        DateTime updatedAt,
        CancellationToken cancellationToken = default)
    {
        // Persist the generated secure QR token and validity window for future operator verification.
        var update = Builders<EnergyReservation>.Update
            .Set(reservation => reservation.QrToken, qrToken)
            .Set(reservation => reservation.QrIssuedAt, issuedAt)
            .Set(reservation => reservation.QrExpiresAt, expiresAt)
            .Set(reservation => reservation.UpdatedAt, updatedAt);

        return await _reservations.FindOneAndUpdateAsync(
            reservation => reservation.Id == id,
            update,
            new FindOneAndUpdateOptions<EnergyReservation>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<bool> HasConflictingReservationAsync(
        string stationId,
        string slotId,
        DateTime reservationDateTime,
        string? excludeReservationId = null,
        CancellationToken cancellationToken = default)
    {
        // Check for concurrent active bookings on the same station and slot at the requested time.
        var filter = Builders<EnergyReservation>.Filter.And(
            Builders<EnergyReservation>.Filter.Eq(r => r.StationId, stationId),
            Builders<EnergyReservation>.Filter.Eq(r => r.SlotId, slotId),
            Builders<EnergyReservation>.Filter.Eq(r => r.ReservationDateTime, reservationDateTime),
            Builders<EnergyReservation>.Filter.Ne(r => r.Status, ReservationStatus.Cancelled));

        if (!string.IsNullOrWhiteSpace(excludeReservationId))
        {
            filter = Builders<EnergyReservation>.Filter.And(
                filter,
                Builders<EnergyReservation>.Filter.Ne(r => r.Id, excludeReservationId));
        }

        var count = await _reservations
            .Find(filter)
            .Limit(1)
            .CountDocumentsAsync(cancellationToken);

        return count > 0;
    }

    public async Task<bool> HasActiveReservationsForStationAsync(
        string stationId,
        CancellationToken cancellationToken = default)
    {
        // Verify whether pending or approved uncompleted reservations are currently assigned to the station.
        var filter = Builders<EnergyReservation>.Filter.And(
            Builders<EnergyReservation>.Filter.Eq(r => r.StationId, stationId),
            Builders<EnergyReservation>.Filter.In(r => r.Status, [ReservationStatus.Pending, ReservationStatus.Approved]));

        var count = await _reservations
            .Find(filter)
            .Limit(1)
            .CountDocumentsAsync(cancellationToken);

        return count > 0;
    }
}
