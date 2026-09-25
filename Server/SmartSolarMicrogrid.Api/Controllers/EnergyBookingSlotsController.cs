/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EnergyBookingSlotsController.cs
 * Purpose: Expose slot-scoped REST endpoints for energy booking slot updates.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/slots")]
public sealed class EnergyBookingSlotsController : ControllerBase
{
    private readonly IEnergyBookingSlotService _slotService;

    public EnergyBookingSlotsController(IEnergyBookingSlotService slotService)
    {
        // Store the service that owns slot validation and persistence rules.
        _slotService = slotService;
    }

    [HttpPut("{slotId}")]
    public async Task<ActionResult<EnergyBookingSlotResponse>> Update(
        string slotId,
        [FromBody] UpdateEnergyBookingSlotRequest? request,
        CancellationToken cancellationToken)
    {
        // Reject an absent body before asking the service to update slot details.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _slotService.UpdateAsync(slotId, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPatch("{slotId}/availability")]
    public async Task<ActionResult<EnergyBookingSlotResponse>> UpdateAvailability(
        string slotId,
        [FromBody] UpdateSlotAvailabilityRequest? request,
        CancellationToken cancellationToken)
    {
        // Reject an absent body before passing availability changes to the service.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _slotService.UpdateAvailabilityAsync(slotId, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpDelete("{slotId}")]
    public async Task<IActionResult> Delete(
        string slotId,
        CancellationToken cancellationToken)
    {
        // Remove one energy booking slot after service validation.
        var result = await _slotService.DeleteAsync(slotId, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return NoContent();
    }

    private ActionResult CreateErrorResult<T>(StationServiceResult<T> result)
    {
        // Translate expected service outcomes into simple public HTTP error responses.
        var message = result.ErrorMessage ?? "The energy booking slot request could not be completed.";

        switch (result.ErrorType)
        {
            case StationServiceErrorType.Validation:
                return BadRequest(new ErrorResponse(message));
            case StationServiceErrorType.NotFound:
                return NotFound(new ErrorResponse(message));
            case StationServiceErrorType.Conflict:
                return Conflict(new ErrorResponse(message));
            case StationServiceErrorType.DependencyUnavailable:
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new ErrorResponse(message));
            default:
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new ErrorResponse("The energy booking slot request could not be completed."));
        }
    }
}
