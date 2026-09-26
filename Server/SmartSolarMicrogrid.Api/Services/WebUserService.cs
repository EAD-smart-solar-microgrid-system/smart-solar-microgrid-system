/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: WebUserService.cs
 * Purpose: Implementation of web user management business logic.
 */
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Services;

public class WebUserService : IWebUserService
{
    private readonly IWebUserRepository _repo;

    public WebUserService(IWebUserRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<WebUserDto>> GetAllUsersAsync()
    {
        var users = await _repo.GetAllAsync();
        return users.Select(u => new WebUserDto(u.Id, u.Username, u.Role, u.Status)).ToList();
    }

    public async Task<WebUserDto?> GetUserByIdAsync(string id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return null;
        return new WebUserDto(user.Id, user.Username, user.Role, user.Status);
    }

    public async Task<WebUserDto?> CreateUserAsync(CreateWebUserRequest request)
    {
        var existing = await _repo.GetByUsernameAsync(request.Username);
        if (existing != null) return null; // Username taken

        var user = new WebUser
        {
            Username = request.Username,
            PasswordHash = request.Password, // Simple hash for demo
            Role = request.Role,
            Status = WebUserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repo.CreateAsync(user);
        return new WebUserDto(user.Id, user.Username, user.Role, user.Status);
    }

    public async Task<bool> UpdateUserAsync(string id, UpdateWebUserRequest request)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return false;

        user.Username = request.Username;
        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(id, user);
        return true;
    }

    public async Task<bool> UpdateUserStatusAsync(string id, UpdateWebUserStatusRequest request)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return false;

        user.Status = request.Status;
        user.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(id, user);
        return true;
    }
}
