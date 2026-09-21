/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: NearbyStationsService.cs
 * Purpose: Locate nearby microgrid stations from stored coordinates for Member 4 maps.
 */

using SmartSolarMicrogrid.Api.DTOs.Member4;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class NearbyStationsService : INearbyStationsService
{
    private const double EarthRadiusKm = 6371.0;
    private const double MinLatitude = -90.0;
    private const double MaxLatitude = 90.0;
    private const double MinLongitude = -180.0;
    private const double MaxLongitude = 180.0;
    private const double MinRadiusKm = 0.1;
    private const double MaxRadiusKm = 500.0;

    private readonly IStationRepository _stationRepository;

    public NearbyStationsService(IStationRepository stationRepository)
    {
        // Reuse the existing station repository for read-only coordinate queries.
        _stationRepository = stationRepository;
    }

    public async Task<Member4DashboardServiceResult<IReadOnlyList<NearbyStationResponse>>> GetNearbyAsync(
        double latitude,
        double longitude,
        double radiusKm,
        CancellationToken cancellationToken = default)
    {
        // Reject invalid geographic inputs before reading station coordinates.
        var validationError = ValidateCoordinates(latitude, longitude, radiusKm);
        if (validationError is not null)
        {
            return Member4DashboardServiceResult<IReadOnlyList<NearbyStationResponse>>.Failure(
                Member4DashboardServiceErrorType.Validation,
                validationError);
        }

        var stations = await _stationRepository.GetAllAsync(cancellationToken);

        var nearby = stations
            .Select(station =>
            {
                var distanceKm = CalculateHaversineDistanceKm(
                    latitude,
                    longitude,
                    station.Latitude,
                    station.Longitude);

                return MapNearbyStation(station, distanceKm);
            })
            .Where(station => station.DistanceKm <= radiusKm)
            .OrderBy(station => station.DistanceKm)
            .ToList();

        return Member4DashboardServiceResult<IReadOnlyList<NearbyStationResponse>>.Success(nearby);
    }

    private static string? ValidateCoordinates(double latitude, double longitude, double radiusKm)
    {
        // Enforce finite latitude, longitude, and radius values within accepted map ranges.
        if (!double.IsFinite(latitude) || latitude < MinLatitude || latitude > MaxLatitude)
        {
            return "Latitude must be a finite value between -90 and 90.";
        }

        if (!double.IsFinite(longitude) || longitude < MinLongitude || longitude > MaxLongitude)
        {
            return "Longitude must be a finite value between -180 and 180.";
        }

        if (!double.IsFinite(radiusKm) || radiusKm < MinRadiusKm || radiusKm > MaxRadiusKm)
        {
            return $"RadiusKm must be a finite value between {MinRadiusKm} and {MaxRadiusKm}.";
        }

        return null;
    }

    private static double CalculateHaversineDistanceKm(
        double latitude1,
        double longitude1,
        double latitude2,
        double longitude2)
    {
        // Compute great-circle distance in kilometres using the haversine formula.
        var lat1Rad = DegreesToRadians(latitude1);
        var lat2Rad = DegreesToRadians(latitude2);
        var deltaLat = DegreesToRadians(latitude2 - latitude1);
        var deltaLon = DegreesToRadians(longitude2 - longitude1);

        var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2)
            + Math.Cos(lat1Rad) * Math.Cos(lat2Rad)
            * Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        // Convert geographic degrees to radians for trigonometric distance calculations.
        return degrees * (Math.PI / 180.0);
    }

    private static NearbyStationResponse MapNearbyStation(SolarStation station, double distanceKm)
    {
        // Map a stored station and calculated distance into the Member 4 nearby-stations response.
        return new NearbyStationResponse
        {
            Id = station.Id,
            Name = station.StationName,
            Latitude = station.Latitude,
            Longitude = station.Longitude,
            DistanceKm = Math.Round(distanceKm, 3),
            Status = station.Status.ToString(),
            CapacityKwPerHour = station.CapacityKwPerHour,
            BatteryStorageSlotCapacity = station.BatteryStorageSlotCapacity,
            OperatingSchedule = station.OperatingSchedule
                .Select(schedule => new NearbyStationScheduleDto
                {
                    DayOfWeek = schedule.DayOfWeek,
                    OpenTime = schedule.OpenTime,
                    CloseTime = schedule.CloseTime
                })
                .ToList()
        };
    }
}
