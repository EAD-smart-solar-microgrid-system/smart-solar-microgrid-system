/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: HttpCurrentProsumerAccessor.cs
 * Purpose: Extract the authenticated Prosumer NIC from the current HTTP request claims.
 */

using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class HttpCurrentProsumerAccessor : ICurrentProsumerAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpCurrentProsumerAccessor(IHttpContextAccessor httpContextAccessor)
    {
        // Store HttpContextAccessor to resolve caller claims in scoped requests
        _httpContextAccessor = httpContextAccessor;
    }

    public Task<string?> GetCurrentProsumerNicAsync(CancellationToken cancellationToken = default)
    {
        // Extract the prosumer NIC claim from the authenticated JWT bearer identity
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            return Task.FromResult<string?>(null);
        }

        var nic = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("nic")?.Value;

        return Task.FromResult(nic);
    }
}
