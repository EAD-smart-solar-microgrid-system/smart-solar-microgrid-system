/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumersController.cs
 * Purpose: Expose Prosumer registration and authenticated self-service routes.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/prosumers")]
public sealed class ProsumersController : ControllerBase
{
    private readonly IProsumerService _prosumerService;

    public ProsumersController(IProsumerService prosumerService)
    {
        // Store the service that owns Prosumer validation and account-state rules.
        _prosumerService = prosumerService;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(ProsumerResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProsumerResponse>> Register(
        [FromBody] RegisterProsumerRequest? request,
        CancellationToken cancellationToken)
    {
        // Register a public Prosumer profile without accepting client-controlled status or timestamps.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _prosumerService.RegisterAsync(request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(ProsumerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProsumerResponse>> GetCurrent(
        CancellationToken cancellationToken)
    {
        // Return the profile resolved from the authenticated identity abstraction.
        var result = await _prosumerService.GetCurrentAsync(cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPut("me")]
    [ProducesResponseType(typeof(ProsumerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProsumerResponse>> UpdateCurrent(
        [FromBody] UpdateProsumerProfileRequest? request,
        CancellationToken cancellationToken)
    {
        // Update only editable fields for the authenticated Prosumer profile.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _prosumerService.UpdateCurrentAsync(request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPost("me/deactivation-request")]
    [ProducesResponseType(typeof(ProsumerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProsumerResponse>> RequestDeactivation(
        CancellationToken cancellationToken)
    {
        // Request a state transition without deleting or directly deactivating the profile.
        var result = await _prosumerService.RequestDeactivationAsync(cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    private ActionResult CreateErrorResult<T>(ProsumerServiceResult<T> result)
    {
        // Translate expected service outcomes into consistent public HTTP responses.
        var message = result.ErrorMessage ?? "The Prosumer request could not be completed.";

        switch (result.ErrorType)
        {
            case ProsumerServiceErrorType.Validation:
                return BadRequest(new ErrorResponse(message));
            case ProsumerServiceErrorType.Unauthorized:
                return Unauthorized(new ErrorResponse(message));
            case ProsumerServiceErrorType.NotFound:
                return NotFound(new ErrorResponse(message));
            case ProsumerServiceErrorType.Conflict:
                return Conflict(new ErrorResponse(message));
            default:
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new ErrorResponse("The Prosumer request could not be completed."));
        }
    }
}
