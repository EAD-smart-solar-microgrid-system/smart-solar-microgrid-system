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
    private readonly IWebUserService _userService;

    public AuthController(IAuthService authService, IWebUserService userService)
    {
        // Store the authentication and web-user services used by login and account flows.
        _authService = authService;
        _userService = userService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Authenticate web user credentials and issue signed JWT bearer token
        var response = await _authService.LoginAsync(request);
        if (response == null)
        {
            return Unauthorized(new
            {
                message = "Invalid username/email or password, or the account setup has not been completed."
            });
        }
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

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        // Initiate password reset email workflow with 15-minute secure token
        if (request == null || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var sent = await _userService.ForgotPasswordAsync(request.Email.Trim());
        // For security, always return success message so email enumeration is mitigated
        return Ok(new { message = "If an account with that email exists, password reset instructions have been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        // Complete password reset workflow using token and new password
        if (request == null || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Token and NewPassword are required." });
        }

        var (success, message) = await _userService.ResetPasswordAsync(request.Token.Trim(), request.NewPassword);
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message });
    }

    [HttpPost("complete-registration")]
    public async Task<IActionResult> CompleteRegistration([FromBody] CompleteRegistrationRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Token and NewPassword are required." });
        }

        var (success, message) = await _userService.CompleteRegistrationAsync(
            request.Token.Trim(), request.NewPassword);
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message });
    }
}
