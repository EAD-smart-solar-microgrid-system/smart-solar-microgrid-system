/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumersController.cs
 * Purpose: Expose public REST endpoints for administrative prosumer management and lifecycle governance.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/admin/prosumers")]
public sealed class ProsumersController : ControllerBase
{
    private readonly IProsumerService _prosumerService;

    public ProsumersController(IProsumerService prosumerService)
    {
        // Store the prosumer service that enforces prosumer validation and lifecycle rules.
        _prosumerService = prosumerService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProsumerResponse>>> GetAll(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        // Retrieve prosumers, optionally filtering by Pending, Active, or Deactivated status.
        var result = await _prosumerService.GetAllAsync(status, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value!);
    }

    [HttpPost]
    public async Task<ActionResult<ProsumerResponse>> Create(
        [FromBody] CreateProsumerRequest? request,
        CancellationToken cancellationToken)
    {
        // Validate request body and register a new prosumer profile.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _prosumerService.CreateAsync(request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPut("{nic}")]
    public async Task<ActionResult<ProsumerResponse>> Update(
        string nic,
        [FromBody] UpdateProsumerRequest? request,
        CancellationToken cancellationToken)
    {
        // Update contact and address details of an existing prosumer while keeping NIC immutable.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _prosumerService.UpdateDetailsAsync(nic, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPatch("{nic}/status")]
    public async Task<ActionResult<ProsumerResponse>> UpdateStatus(
        string nic,
        [FromBody] UpdateProsumerStatusRequest? request,
        CancellationToken cancellationToken)
    {
        // Change the prosumer lifecycle status between Pending, Active, and Deactivated.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _prosumerService.ChangeStatusAsync(nic, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    private ActionResult CreateErrorResult<T>(ProsumerServiceResult<T> result)
    {
        // Map service error types into standard API ErrorResponse models.
        var message = result.ErrorMessage ?? "The prosumer request could not be completed.";

        return result.ErrorType switch
        {
            ProsumerServiceErrorType.Validation => BadRequest(new ErrorResponse(message)),
            ProsumerServiceErrorType.NotFound => NotFound(new ErrorResponse(message)),
            ProsumerServiceErrorType.Conflict => Conflict(new ErrorResponse(message)),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ErrorResponse("The prosumer request could not be completed."))
        };
    }
}
