/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IWebUserService.cs
 * Purpose: Interface for web user management business logic.
 */
using SmartSolarMicrogrid.Api.DTOs;

namespace SmartSolarMicrogrid.Api.Services;

public interface IWebUserService
{
    Task<List<WebUserDto>> GetAllUsersAsync();
    Task<WebUserDto?> GetUserByIdAsync(string id);
    Task<WebUserDto?> CreateUserAsync(CreateWebUserRequest request);
    Task<bool> UpdateUserAsync(string id, UpdateWebUserRequest request);
    Task<bool> UpdateUserStatusAsync(string id, UpdateWebUserStatusRequest request);
}
