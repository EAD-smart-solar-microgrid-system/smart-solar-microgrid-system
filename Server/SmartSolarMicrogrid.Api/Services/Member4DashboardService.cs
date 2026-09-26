/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Member4DashboardService.cs
 * Purpose: Build a read-only prosumer dashboard from EnergyReservation documents.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.DTOs.Member4;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class Member4DashboardService : IMember4DashboardService
{
    private const string CollectionName = "EnergyReservation";
    private const int RecentBookingLimit = 10;

    private readonly IMongoCollection<EnergyReservation> _reservations;
    private readonly IProsumerRepository _prosumerRepository;

    public Member4DashboardService(
        MongoDbContext databaseContext,
        IProsumerRepository prosumerRepository)
    {
        // Bind a read-only reservation collection and reuse the prosumer repository for NIC lookup.
        _reservations = databaseContext.Database.GetCollection<EnergyReservation>(CollectionName);
        _prosumerRepository = prosumerRepository;
    }

    public async Task<Member4DashboardServiceResult<ProsumerDashboardResponse>> GetProsumerDashboardAsync(
        string prosumerId,
        CancellationToken cancellationToken = default)
    {
        // Validate the prosumer identifier before issuing dashboard read queries.
        var normalizedNic = string.IsNullOrWhiteSpace(prosumerId)
            ? null
            : prosumerId.Trim().ToUpperInvariant();

        if (normalizedNic is null)
        {
            return Member4DashboardServiceResult<ProsumerDashboardResponse>.Failure(
                Member4DashboardServiceErrorType.Validation,
                "The prosumer id is required.");
        }

        var prosumer = await _prosumerRepository.GetByNicAsync(normalizedNic, cancellationToken);
        if (prosumer is null)
        {
            return Member4DashboardServiceResult<ProsumerDashboardResponse>.Failure(
                Member4DashboardServiceErrorType.NotFound,
                "The requested prosumer profile was not found.");
        }

        var filter = Builders<EnergyReservation>.Filter.Eq(
            reservation => reservation.ProsumerNic,
            normalizedNic);

        var reservations = await _reservations
            .Find(filter)
            .SortByDescending(reservation => reservation.ReservationDateTime)
            .ToListAsync(cancellationToken);

        var nowUtc = DateTime.UtcNow;
        var pendingCount = reservations.Count(reservation => reservation.Status == ReservationStatus.Pending);
        var approvedFutureCount = reservations.Count(reservation =>
            reservation.Status == ReservationStatus.Approved
            && NormalizeToUtc(reservation.ReservationDateTime) > nowUtc);

        var response = new ProsumerDashboardResponse
        {
            ProsumerId = normalizedNic,
            PendingReservationCount = pendingCount,
            ApprovedFutureReservationCount = approvedFutureCount,
            RecentBookings = reservations
                .Take(RecentBookingLimit)
                .Select(MapBooking)
                .ToList()
        };

        return Member4DashboardServiceResult<ProsumerDashboardResponse>.Success(response);
    }

    private static DashboardBookingItemResponse MapBooking(EnergyReservation reservation)
    {
        // Map a reservation document into a compact dashboard booking row.
        return new DashboardBookingItemResponse
        {
            Id = reservation.Id,
            StationId = reservation.StationId,
            SlotId = reservation.SlotId,
            ReservationDateTime = reservation.ReservationDateTime,
            Status = reservation.Status.ToString(),
            ReservationType = reservation.ReservationType.ToString(),
            CreatedAt = reservation.CreatedAt
        };
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        // Normalize unspecified timestamps as UTC for future-reservation comparisons.
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            _ => value.ToUniversalTime()
        };
    }
}
