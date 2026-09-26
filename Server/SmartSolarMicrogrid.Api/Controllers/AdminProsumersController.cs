/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AdminProsumersController.cs
 * Purpose: Expose public REST endpoints for administrative prosumer management and lifecycle governance.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/admin/prosumers")]
public sealed class AdminProsumersController : ControllerBase
{
    private readonly IAdminProsumerService _adminProsumerService;

    public AdminProsumersController(IAdminProsumerService adminProsumerService)
    {
        _adminProsumerService = adminProsumerService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminProsumerResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<AdminProsumerResponse>>> GetAll(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var result = await _adminProsumerService.GetAllAsync(status, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value!);
    }

    [HttpGet("{nic}")]
    [ProducesResponseType(typeof(AdminProsumerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminProsumerResponse>> GetByNic(
        string nic,
        CancellationToken cancellationToken)
    {
        var result = await _adminProsumerService.GetByNicAsync(nic, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminProsumerResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminProsumerResponse>> Create(
        [FromBody] CreateProsumerRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _adminProsumerService.CreateAsync(request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPut("{nic}")]
    [ProducesResponseType(typeof(AdminProsumerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminProsumerResponse>> Update(
        string nic,
        [FromBody] UpdateProsumerRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _adminProsumerService.UpdateDetailsAsync(nic, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPatch("{nic}/status")]
    [ProducesResponseType(typeof(AdminProsumerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminProsumerResponse>> UpdateStatus(
        string nic,
        [FromBody] UpdateProsumerStatusRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _adminProsumerService.ChangeStatusAsync(nic, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    private ActionResult CreateErrorResult<T>(AdminProsumerServiceResult<T> result)
    {
        var message = result.ErrorMessage ?? "The prosumer request could not be completed.";

        return result.ErrorType switch
        {
            AdminProsumerErrorType.Validation => BadRequest(new ErrorResponse(message)),
            AdminProsumerErrorType.NotFound => NotFound(new ErrorResponse(message)),
            AdminProsumerErrorType.Conflict => Conflict(new ErrorResponse(message)),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ErrorResponse("The prosumer request could not be completed."))
        };
    }
}
