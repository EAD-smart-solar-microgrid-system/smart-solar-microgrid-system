/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AuthController.cs
 * Purpose: Controller for authentication operations.
 */
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Authenticate web user credentials and issue signed JWT bearer token
        var response = await _authService.LoginAsync(request);
        if (response == null) return Unauthorized(new { message = "Invalid credentials or deactivated account." });
        return Ok(response);
    }

    [HttpPost("prosumer-login")]
    public async Task<IActionResult> ProsumerLogin(
        [FromBody] ProsumerLoginRequest request,
        CancellationToken cancellationToken)
    {
        // Authenticate solar prosumer by NIC and return JWT token
        if (request == null || string.IsNullOrWhiteSpace(request.Nic))
        {
            return BadRequest(new { message = "NIC is required." });
        }

        var (succeeded, response, errorMessage) = await _authService.ProsumerLoginAsync(request.Nic, cancellationToken);
        if (!succeeded)
        {
            return BadRequest(new { message = errorMessage });
        }

        return Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult GetMe()
    {
        // Extract authenticated user identity claims from current context
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        return Ok(new { Id = userId, Username = username, Role = role });
    }
}
