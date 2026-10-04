/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerStatus.cs
 * Purpose: Define the allowed lifecycle statuses for a solar prosumer account.
 */

namespace SmartSolarMicrogrid.Api.Common.Enums;

public enum ProsumerStatus
{
    Pending,
    Active,
    Deactivated
}
