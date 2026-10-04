/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: NearbyStationScheduleDto.cs
 * Purpose: Represent one operating-schedule entry in the Member 4 nearby-stations response.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Member4;

public sealed class NearbyStationScheduleDto
{
    public string DayOfWeek { get; set; } = string.Empty;

    public string OpenTime { get; set; } = string.Empty;

    public string CloseTime { get; set; } = string.Empty;
}
