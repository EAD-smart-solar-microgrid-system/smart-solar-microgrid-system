/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UpdateStationRequest.cs
 * Purpose: Define client-controlled station details that can be updated.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public sealed class UpdateStationRequest
{
    public string? StationName { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double CapacityKwPerHour { get; set; }

    public int BatteryStorageSlotCapacity { get; set; }

    public List<StationScheduleDto>? OperatingSchedule { get; set; }
}
