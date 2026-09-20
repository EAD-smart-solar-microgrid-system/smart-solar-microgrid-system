/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationStatus.cs
 * Purpose: Define the allowed lifecycle statuses for an energy slot reservation.
 */

namespace SmartSolarMicrogrid.Api.Common.Enums;

public enum ReservationStatus
{
    Pending,
    Approved,
    Cancelled,
    Completed
}
