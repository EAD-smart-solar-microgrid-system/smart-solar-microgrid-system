/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Member4DashboardController.cs
 * Purpose: Expose the Member 4 read-only prosumer dashboard endpoint.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Member4;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/member4/dashboard")]
public sealed class Member4DashboardController : ControllerBase
{
    private readonly IMember4DashboardService _dashboardService;

    public Member4DashboardController(IMember4DashboardService dashboardService)
    {
        // Store the Member 4 dashboard service that owns read-only summary aggregation.
        _dashboardService = dashboardService;
    }

    [HttpGet("prosumer/{prosumerId}")]
    public async Task<ActionResult<ProsumerDashboardResponse>> GetProsumerDashboard(
        string prosumerId,
        CancellationToken cancellationToken)
    {
        // Return pending, approved-future, and recent booking metrics for one prosumer.
        var result = await _dashboardService.GetProsumerDashboardAsync(prosumerId, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    private ActionResult CreateErrorResult<T>(Member4DashboardServiceResult<T> result)
    {
        // Map expected Member 4 dashboard outcomes into standard HTTP responses.
        var message = result.ErrorMessage ?? "The dashboard request could not be completed.";

        return result.ErrorType switch
        {
            Member4DashboardServiceErrorType.Validation => BadRequest(new ErrorResponse(message)),
            Member4DashboardServiceErrorType.NotFound => NotFound(new ErrorResponse(message)),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ErrorResponse("The dashboard request could not be completed."))
        };
    }
}
