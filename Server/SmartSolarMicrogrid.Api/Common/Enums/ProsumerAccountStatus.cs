/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerAccountStatus.cs
 * Purpose: Define the lifecycle states for a Prosumer account.
 */

namespace SmartSolarMicrogrid.Api.Common.Enums;

public enum ProsumerAccountStatus
{
    PendingActivation,
    Active,
    DeactivationRequested,
    Deactivated
}
