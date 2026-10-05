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
    Task<(bool Success, bool Conflict)> UpdateUserAsync(string id, UpdateWebUserRequest request);
    Task<bool> UpdateUserStatusAsync(string id, UpdateWebUserStatusRequest request);
    Task<bool> ForgotPasswordAsync(string email);
    Task<(bool Success, string Message)> ResetPasswordAsync(string token, string newPassword);
    Task<(bool Success, string Message)> CompleteRegistrationAsync(string token, string newPassword);
    Task<int> BroadcastEmailAsync(string subject, string message, string? targetRole);
}
