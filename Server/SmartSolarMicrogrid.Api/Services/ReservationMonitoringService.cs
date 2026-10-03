/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationMonitoringService.cs
 * Purpose: Apply Member 4 read-only filter validation and reservation monitoring queries.
 */

using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Utilities;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.DTOs.ReservationMonitoring;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class ReservationMonitoringService : IReservationMonitoringService
{
    private const string CollectionName = "EnergyReservation";
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly IMongoCollection<EnergyReservation> _reservations;
    private readonly IReservationRepository _reservationRepository;
    private readonly IStationRepository _stationRepository;

    public ReservationMonitoringService(
        MongoDbContext databaseContext,
        IReservationRepository reservationRepository,
        IStationRepository stationRepository)
    {
        // Bind a read-only collection handle and repositories for station and reservation lookups.
        _reservations = databaseContext.Database.GetCollection<EnergyReservation>(CollectionName);
        _reservationRepository = reservationRepository;
        _stationRepository = stationRepository;
    }

    public async Task<ReservationMonitoringServiceResult<ReservationMonitoringListResponse>> SearchAsync(
        ReservationMonitoringQuery query,
        CancellationToken cancellationToken = default)
    {
        // Normalize and validate monitoring filters before composing the MongoDB read query.
        query ??= new ReservationMonitoringQuery();

        var validationError = ValidateQuery(query, out var page, out var pageSize, out var statusFilter);
        if (validationError is not null)
        {
            return ReservationMonitoringServiceResult<ReservationMonitoringListResponse>.Failure(
                ReservationMonitoringServiceErrorType.Validation,
                validationError);
        }

        string? resolvedStationId = null;
        if (!string.IsNullOrWhiteSpace(query.StationId))
        {
            var trimmedStationId = query.StationId.Trim();
            if (HubIdGenerator.IsValid(trimmedStationId))
            {
                var station = await _stationRepository.GetByHubIdAsync(trimmedStationId, cancellationToken);
                if (station is null)
                {
                    return ReservationMonitoringServiceResult<ReservationMonitoringListResponse>.Success(
                        new ReservationMonitoringListResponse
                        {
                            Items = [],
                            TotalCount = 0,
                            Page = page,
                            PageSize = pageSize
                        });
                }
                resolvedStationId = station.Id;
            }
            else
            {
                resolvedStationId = trimmedStationId;
            }
        }

        var filter = BuildFilter(query, statusFilter, resolvedStationId);
        var totalCount = (int)await _reservations.CountDocumentsAsync(filter, cancellationToken: cancellationToken);
        var skip = (page - 1) * pageSize;

        var reservations = await _reservations
            .Find(filter)
            .SortByDescending(reservation => reservation.ReservationDateTime)
            .Skip(skip)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        var response = new ReservationMonitoringListResponse
        {
            Items = reservations.Select(MapToItem).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return ReservationMonitoringServiceResult<ReservationMonitoringListResponse>.Success(response);
    }

    public async Task<ReservationMonitoringServiceResult<ReservationMonitoringItemResponse>> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        // Validate the reservation identifier before performing a read-only repository lookup.
        if (string.IsNullOrWhiteSpace(id) || !ObjectId.TryParse(id.Trim(), out _))
        {
            return ReservationMonitoringServiceResult<ReservationMonitoringItemResponse>.Failure(
                ReservationMonitoringServiceErrorType.Validation,
                "The reservation id must be a valid MongoDB ObjectId.");
        }

        var reservation = await _reservationRepository.GetByIdAsync(id.Trim(), cancellationToken);
        if (reservation is null)
        {
            return ReservationMonitoringServiceResult<ReservationMonitoringItemResponse>.Failure(
                ReservationMonitoringServiceErrorType.NotFound,
                "The requested reservation was not found.");
        }

        return ReservationMonitoringServiceResult<ReservationMonitoringItemResponse>.Success(
            MapToItem(reservation));
    }

    private static string? ValidateQuery(
        ReservationMonitoringQuery query,
        out int page,
        out int pageSize,
        out ReservationStatus? statusFilter)
    {
        page = query.Page <= 0 ? DefaultPage : query.Page;
        pageSize = query.PageSize <= 0 ? DefaultPageSize : query.PageSize;
        statusFilter = null;

        if (page < 1)
        {
            return "Page must be greater than or equal to 1.";
        }

        if (pageSize < 1 || pageSize > MaxPageSize)
        {
            return $"PageSize must be between 1 and {MaxPageSize}.";
        }

        if (!string.IsNullOrWhiteSpace(query.StationId)
            && !ObjectId.TryParse(query.StationId.Trim(), out _)
            && !HubIdGenerator.IsValid(query.StationId.Trim()))
        {
            return "The station id must be a valid HubId or MongoDB ObjectId.";
        }

        if (!string.IsNullOrWhiteSpace(query.ProsumerId)
            && string.IsNullOrWhiteSpace(query.ProsumerId.Trim()))
        {
            return "The prosumer id must not be empty.";
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (!Enum.TryParse<ReservationStatus>(query.Status.Trim(), true, out var parsedStatus)
                || !Enum.IsDefined(parsedStatus))
            {
                return "Status must be one of Pending, Approved, Cancelled, or Completed.";
            }

            statusFilter = parsedStatus;
        }

        if (query.StartDate.HasValue && query.EndDate.HasValue)
        {
            var startUtc = NormalizeToUtc(query.StartDate.Value);
            var endUtc = NormalizeToUtc(query.EndDate.Value);
            if (endUtc < startUtc)
            {
                return "EndDate must be greater than or equal to StartDate.";
            }
        }

        return null;
    }

    private static FilterDefinition<EnergyReservation> BuildFilter(
        ReservationMonitoringQuery query,
        ReservationStatus? statusFilter,
        string? resolvedStationId)
    {
        // Compose optional equality, date-range, and free-text search filters for monitoring.
        var filters = new List<FilterDefinition<EnergyReservation>>();

        if (!string.IsNullOrWhiteSpace(resolvedStationId))
        {
            filters.Add(Builders<EnergyReservation>.Filter.Eq(
                reservation => reservation.StationId,
                resolvedStationId));
        }

        if (!string.IsNullOrWhiteSpace(query.ProsumerId))
        {
            filters.Add(Builders<EnergyReservation>.Filter.Eq(
                reservation => reservation.ProsumerNic,
                query.ProsumerId.Trim().ToUpperInvariant()));
        }

        if (statusFilter.HasValue)
        {
            filters.Add(Builders<EnergyReservation>.Filter.Eq(
                reservation => reservation.Status,
                statusFilter.Value));
        }

        if (query.StartDate.HasValue)
        {
            filters.Add(Builders<EnergyReservation>.Filter.Gte(
                reservation => reservation.ReservationDateTime,
                NormalizeToUtc(query.StartDate.Value)));
        }

        if (query.EndDate.HasValue)
        {
            filters.Add(Builders<EnergyReservation>.Filter.Lte(
                reservation => reservation.ReservationDateTime,
                NormalizeToUtc(query.EndDate.Value)));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            var searchFilters = new List<FilterDefinition<EnergyReservation>>
            {
                Builders<EnergyReservation>.Filter.Regex(
                    reservation => reservation.StationId,
                    new BsonRegularExpression(EscapeRegex(search), "i")),
                Builders<EnergyReservation>.Filter.Regex(
                    reservation => reservation.SlotId,
                    new BsonRegularExpression(EscapeRegex(search), "i")),
                Builders<EnergyReservation>.Filter.Regex(
                    reservation => reservation.ProsumerNic,
                    new BsonRegularExpression(EscapeRegex(search), "i"))
            };

            if (ObjectId.TryParse(search, out _))
            {
                searchFilters.Add(Builders<EnergyReservation>.Filter.Eq(
                    reservation => reservation.Id,
                    search));
            }

            if (Enum.TryParse<ReservationStatus>(search, true, out var statusMatch)
                && Enum.IsDefined(statusMatch))
            {
                searchFilters.Add(Builders<EnergyReservation>.Filter.Eq(
                    reservation => reservation.Status,
                    statusMatch));
            }

            if (Enum.TryParse<ReservationType>(search, true, out var typeMatch)
                && Enum.IsDefined(typeMatch))
            {
                searchFilters.Add(Builders<EnergyReservation>.Filter.Eq(
                    reservation => reservation.ReservationType,
                    typeMatch));
            }

            filters.Add(Builders<EnergyReservation>.Filter.Or(searchFilters));
        }

        return filters.Count == 0
            ? Builders<EnergyReservation>.Filter.Empty
            : Builders<EnergyReservation>.Filter.And(filters);
    }

    private static ReservationMonitoringItemResponse MapToItem(EnergyReservation reservation)
    {
        // Map persisted reservation fields into the Member 4 monitoring response shape.
        return new ReservationMonitoringItemResponse
        {
            Id = reservation.Id,
            StationId = reservation.StationId,
            SlotId = reservation.SlotId,
            ProsumerId = reservation.ProsumerNic,
            ReservationDateTime = reservation.ReservationDateTime,
            Status = reservation.Status.ToString(),
            ReservationType = reservation.ReservationType.ToString(),
            CreatedAt = reservation.CreatedAt,
            UpdatedAt = reservation.UpdatedAt
        };
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        // Normalize unspecified timestamps as UTC for consistent date-range filtering.
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            _ => value.ToUniversalTime()
        };
    }

    private static string EscapeRegex(string value)
    {
        // Escape free-text search input so it is treated as a literal MongoDB regex fragment.
        return System.Text.RegularExpressions.Regex.Escape(value);
    }
}
