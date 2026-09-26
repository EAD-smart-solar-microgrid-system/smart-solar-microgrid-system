/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AdminUsersController.cs
 * Purpose: Controller for backoffice user management.
 */
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Services;
using Microsoft.AspNetCore.Authorization;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Backoffice")]
public class AdminUsersController : ControllerBase
{
    private readonly IWebUserService _userService;

    public AdminUsersController(IWebUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        // Retrieve all registered backoffice and grid operator user profiles
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateWebUserRequest request)
    {
        // Register a new web user account with specified administrative or operational role
        var user = await _userService.CreateUserAsync(request);
        if (user == null) return BadRequest(new { message = "Username already exists." });
        return Created($"/api/admin/users/{user.Id}", user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateWebUserRequest request)
    {
        // Update user account credentials and role assignments
        var success = await _userService.UpdateUserAsync(id, request);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UpdateWebUserStatusRequest request)
    {
        // Modify user account lifecycle status (Active / Deactivated)
        var success = await _userService.UpdateUserStatusAsync(id, request);
        if (!success) return NotFound();
        return NoContent();
    }
}
