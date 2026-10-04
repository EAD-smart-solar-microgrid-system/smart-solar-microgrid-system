/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IMember4DashboardService.cs
 * Purpose: Define the Member 4 read-only prosumer dashboard service contract.
 */

using SmartSolarMicrogrid.Api.DTOs.Member4;

namespace SmartSolarMicrogrid.Api.Services;

public interface IMember4DashboardService
{
    Task<Member4DashboardServiceResult<ProsumerDashboardResponse>> GetProsumerDashboardAsync(
        string prosumerId,
        CancellationToken cancellationToken = default);
}
