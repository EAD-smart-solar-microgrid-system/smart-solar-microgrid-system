/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: SlotAvailabilityStatus.cs
 * Purpose: Distinguish Member 4 slot-check outcomes for reservation validation.
 */

namespace SmartSolarMicrogrid.Api.Services;

public enum SlotAvailabilityStatus
{
    Available,
    Unavailable,
    NotFound,
    ServiceUnavailable
}
