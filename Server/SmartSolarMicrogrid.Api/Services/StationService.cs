/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationService.cs
 * Purpose: Apply station validation, lifecycle rules, and DTO/model mapping.
 */

using System.Globalization;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs.Stations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class StationService : IStationService
{
    private readonly IActiveReservationChecker _activeReservationChecker;
    private readonly IStationRepository _stationRepository;

    public StationService(
        IStationRepository stationRepository,
        IActiveReservationChecker activeReservationChecker)
    {
        // Store the repository and narrow reservation dependency used by station rules.
        _stationRepository = stationRepository;
        _activeReservationChecker = activeReservationChecker;
    }

    public async Task<StationServiceResult<IReadOnlyList<StationResponse>>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        // Retrieve stations through the repository and map them to public response DTOs.
        var stations = await _stationRepository.GetAllAsync(cancellationToken);
        var responses = stations.Select(MapToResponse).ToList();

        return StationServiceResult<IReadOnlyList<StationResponse>>.Success(responses);
    }

    public async Task<StationServiceResult<StationResponse>> CreateAsync(
        CreateStationRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate client data before creating server-controlled station fields.
        var validationMessage = ValidateStationInput(
            request.StationName,
            request.Latitude,
            request.Longitude,
            request.CapacityKwPerHour,
            request.BatteryStorageSlotCapacity,
            request.OperatingSchedule);

        if (validationMessage is not null)
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.Validation,
                validationMessage);
        }

        var now = DateTime.UtcNow;
        var station = new SolarStation
        {
            Id = ObjectId.GenerateNewId().ToString(),
            StationName = request.StationName!.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CapacityKwPerHour = request.CapacityKwPerHour,
            BatteryStorageSlotCapacity = request.BatteryStorageSlotCapacity,
            OperatingSchedule = MapToModels(request.OperatingSchedule!),
            Status = StationStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        };

        var createdStation = await _stationRepository.CreateAsync(station, cancellationToken);

        return StationServiceResult<StationResponse>.Success(MapToResponse(createdStation));
    }

    public async Task<StationServiceResult<StationResponse>> UpdateDetailsAsync(
        string id,
        UpdateStationRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate the identifier and editable station fields before loading the station.
        if (!ObjectId.TryParse(id, out _))
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.Validation,
                "The station id must be a valid MongoDB ObjectId.");
        }

        var validationMessage = ValidateStationInput(
            request.StationName,
            request.Latitude,
            request.Longitude,
            request.CapacityKwPerHour,
            request.BatteryStorageSlotCapacity,
            request.OperatingSchedule);

        if (validationMessage is not null)
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.Validation,
                validationMessage);
        }

        var existingStation = await _stationRepository.GetByIdAsync(id, cancellationToken);

        if (existingStation is null)
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested station was not found.");
        }

        existingStation.StationName = request.StationName!.Trim();
        existingStation.Latitude = request.Latitude;
        existingStation.Longitude = request.Longitude;
        existingStation.CapacityKwPerHour = request.CapacityKwPerHour;
        existingStation.BatteryStorageSlotCapacity = request.BatteryStorageSlotCapacity;
        existingStation.OperatingSchedule = MapToModels(request.OperatingSchedule!);
        existingStation.UpdatedAt = DateTime.UtcNow;

        var updatedStation = await _stationRepository.UpdateDetailsAsync(
            existingStation,
            cancellationToken);

        if (updatedStation is null)
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested station was not found.");
        }

        return StationServiceResult<StationResponse>.Success(MapToResponse(updatedStation));
    }

    public async Task<StationServiceResult<StationResponse>> ChangeStatusAsync(
        string id,
        UpdateStationStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate the station, requested enum value, and deactivation dependency before writing.
        if (!ObjectId.TryParse(id, out _))
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.Validation,
                "The station id must be a valid MongoDB ObjectId.");
        }

        var existingStation = await _stationRepository.GetByIdAsync(id, cancellationToken);

        if (existingStation is null)
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested station was not found.");
        }

        if (!Enum.TryParse<StationStatus>(request.Status, true, out var requestedStatus)
            || !Enum.IsDefined(requestedStatus))
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.Validation,
                "Status must be Active or Inactive.");
        }

        if (existingStation.Status == requestedStatus)
        {
            return StationServiceResult<StationResponse>.Success(MapToResponse(existingStation));
        }

        if (requestedStatus == StationStatus.Inactive)
        {
            var hasActiveReservations = await _activeReservationChecker
                .HasActiveReservationsAsync(existingStation.Id, cancellationToken);

            if (!hasActiveReservations.HasValue)
            {
                return StationServiceResult<StationResponse>.Failure(
                    StationServiceErrorType.DependencyUnavailable,
                    "Station deactivation is unavailable because active reservation verification is not connected.");
            }

            if (hasActiveReservations.Value)
            {
                return StationServiceResult<StationResponse>.Failure(
                    StationServiceErrorType.Conflict,
                    "The station cannot be deactivated while active energy reservations exist.");
            }
        }

        var updatedStation = await _stationRepository.UpdateStatusAsync(
            existingStation.Id,
            requestedStatus,
            DateTime.UtcNow,
            cancellationToken);

        if (updatedStation is null)
        {
            return StationServiceResult<StationResponse>.Failure(
                StationServiceErrorType.NotFound,
                "The requested station was not found.");
        }

        return StationServiceResult<StationResponse>.Success(MapToResponse(updatedStation));
    }

    private static string? ValidateStationInput(
        string? stationName,
        double latitude,
        double longitude,
        double capacityKwPerHour,
        int batteryStorageSlotCapacity,
        IReadOnlyList<StationScheduleDto>? operatingSchedule)
    {
        // Apply the complete station input validation required by the assignment.
        if (string.IsNullOrWhiteSpace(stationName))
        {
            return "StationName is required.";
        }

        if (!double.IsFinite(latitude) || latitude is < -90 or > 90)
        {
            return "Latitude must be between -90 and 90.";
        }

        if (!double.IsFinite(longitude) || longitude is < -180 or > 180)
        {
            return "Longitude must be between -180 and 180.";
        }

        if (!double.IsFinite(capacityKwPerHour) || capacityKwPerHour <= 0)
        {
            return "CapacityKwPerHour must be greater than 0.";
        }

        if (batteryStorageSlotCapacity < 0)
        {
            return "BatteryStorageSlotCapacity must be zero or greater.";
        }

        return ValidateSchedule(operatingSchedule);
    }

    private static string? ValidateSchedule(
        IReadOnlyList<StationScheduleDto>? operatingSchedule)
    {
        // Validate each simple same-day schedule entry using strict HH:mm values.
        if (operatingSchedule is null || operatingSchedule.Count == 0)
        {
            return "OperatingSchedule must contain at least one entry.";
        }

        foreach (var entry in operatingSchedule)
        {
            if (entry is null)
            {
                return "OperatingSchedule contains a malformed entry.";
            }

            if (!Enum.TryParse<DayOfWeek>(entry.DayOfWeek, true, out var day)
                || !Enum.IsDefined(day))
            {
                return "OperatingSchedule contains an invalid DayOfWeek.";
            }

            if (!TimeOnly.TryParseExact(
                    entry.OpenTime,
                    "HH:mm",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var openTime)
                || !TimeOnly.TryParseExact(
                    entry.CloseTime,
                    "HH:mm",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var closeTime))
            {
                return "OperatingSchedule times must use HH:mm format.";
            }

            if (closeTime <= openTime)
            {
                return "OperatingSchedule CloseTime must be later than OpenTime.";
            }
        }

        return null;
    }

    private static List<StationSchedule> MapToModels(
        IReadOnlyList<StationScheduleDto> schedules)
    {
        // Map validated schedule DTOs to MongoDB model objects.
        return schedules
            .Select(schedule => new StationSchedule
            {
                DayOfWeek = schedule.DayOfWeek!,
                OpenTime = schedule.OpenTime!,
                CloseTime = schedule.CloseTime!
            })
            .ToList();
    }

    private static StationResponse MapToResponse(SolarStation station)
    {
        // Map a MongoDB model to a response without exposing the model directly.
        return new StationResponse
        {
            Id = station.Id,
            StationName = station.StationName,
            Latitude = station.Latitude,
            Longitude = station.Longitude,
            CapacityKwPerHour = station.CapacityKwPerHour,
            BatteryStorageSlotCapacity = station.BatteryStorageSlotCapacity,
            OperatingSchedule = station.OperatingSchedule
                .Select(schedule => new StationScheduleDto
                {
                    DayOfWeek = schedule.DayOfWeek,
                    OpenTime = schedule.OpenTime,
                    CloseTime = schedule.CloseTime
                })
                .ToList(),
            Status = station.Status.ToString(),
            CreatedAt = station.CreatedAt,
            UpdatedAt = station.UpdatedAt
        };
    }
}
