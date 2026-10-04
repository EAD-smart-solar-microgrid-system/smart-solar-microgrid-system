/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationSchedule.cs
 * Purpose: Represent one normal same-day operating period stored in MongoDB.
 */

namespace SmartSolarMicrogrid.Api.Models;

public sealed class StationSchedule
{
    public string DayOfWeek { get; set; } = string.Empty;

    public string OpenTime { get; set; } = string.Empty;

    public string CloseTime { get; set; } = string.Empty;
}
