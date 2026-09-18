/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationScheduleDto.cs
 * Purpose: Define the JSON contract for one station operating period.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public sealed class StationScheduleDto
{
    public string? DayOfWeek { get; set; }

    public string? OpenTime { get; set; }

    public string? CloseTime { get; set; }
}
