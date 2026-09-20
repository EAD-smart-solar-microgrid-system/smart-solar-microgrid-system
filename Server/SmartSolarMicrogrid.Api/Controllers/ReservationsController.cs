/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationsController.cs
 * Purpose: Expose public command endpoints for energy slot booking, modification, cancellation, and QR token generation.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Reservations;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/reservations")]
public sealed class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        // Store the reservation service that owns scheduling windows, notice checks, and QR generation.
        _reservationService = reservationService;
    }

    [HttpPost]
    public async Task<ActionResult<ReservationResponse>> Create(
        [FromBody] CreateReservationRequest? request,
        CancellationToken cancellationToken)
    {
        // Enforce input presence and create a scheduled energy slot reservation.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _reservationService.CreateAsync(request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ReservationResponse>> Update(
        string id,
        [FromBody] UpdateReservationRequest? request,
        CancellationToken cancellationToken)
    {
        // Modify the scheduled time or slot of an existing reservation subject to the 12-hour notice policy.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _reservationService.UpdateAsync(id, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ReservationResponse>> Cancel(
        string id,
        [FromBody] CancelReservationRequest? request,
        CancellationToken cancellationToken)
    {
        // Cancel a scheduled reservation subject to the 12-hour notice rule.
        var result = await _reservationService.CancelAsync(id, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPost("{id}/qr-token")]
    public async Task<ActionResult<QrTokenResponse>> GenerateQrToken(
        string id,
        CancellationToken cancellationToken)
    {
        // Issue a cryptographically secure opaque token for mobile QR rendering and operator verification.
        var result = await _reservationService.GenerateQrTokenAsync(id, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    private ActionResult CreateErrorResult<T>(ReservationServiceResult<T> result)
    {
        // Map expected reservation service outcomes into standard HTTP responses.
        var message = result.ErrorMessage ?? "The reservation request could not be completed.";

        return result.ErrorType switch
        {
            ReservationServiceErrorType.Validation => BadRequest(new ErrorResponse(message)),
            ReservationServiceErrorType.NotFound => NotFound(new ErrorResponse(message)),
            ReservationServiceErrorType.Conflict => Conflict(new ErrorResponse(message)),
            ReservationServiceErrorType.DependencyUnavailable => StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new ErrorResponse(message)),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ErrorResponse("The reservation request could not be completed."))
        };
    }
}
