/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IAuthService.cs
 * Purpose: Interface for authentication business logic.
 */
using SmartSolarMicrogrid.Api.DTOs;

namespace SmartSolarMicrogrid.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);

    Task<(bool Succeeded, ProsumerLoginResponse? Response, string? ErrorMessage)> ProsumerLoginAsync(
        string nic,
        CancellationToken cancellationToken = default);
}
