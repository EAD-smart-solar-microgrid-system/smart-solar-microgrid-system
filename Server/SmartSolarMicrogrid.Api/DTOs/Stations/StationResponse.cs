/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationResponse.cs
 * Purpose: Define the public response contract for a solar station.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public sealed class StationResponse
{
    public string Id { get; set; } = string.Empty;

    public string StationName { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double CapacityKwPerHour { get; set; }

    public int BatteryStorageSlotCapacity { get; set; }

    public List<StationScheduleDto> OperatingSchedule { get; set; } = [];

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
