/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: NearbyStationResponse.cs
 * Purpose: Expose a nearby microgrid station with calculated distance for Member 4 maps.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Member4;

public sealed class NearbyStationResponse
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double DistanceKm { get; set; }

    public string Status { get; set; } = string.Empty;

    public double CapacityKwPerHour { get; set; }

    public int BatteryStorageSlotCapacity { get; set; }

    public List<NearbyStationScheduleDto> OperatingSchedule { get; set; } = [];
}
