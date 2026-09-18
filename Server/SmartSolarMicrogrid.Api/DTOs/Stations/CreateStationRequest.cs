/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: CreateStationRequest.cs
 * Purpose: Define client-controlled data required to create a solar station.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public sealed class CreateStationRequest
{
    public string? StationName { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double CapacityKwPerHour { get; set; }

    public int BatteryStorageSlotCapacity { get; set; }

    public List<StationScheduleDto>? OperatingSchedule { get; set; }
}
