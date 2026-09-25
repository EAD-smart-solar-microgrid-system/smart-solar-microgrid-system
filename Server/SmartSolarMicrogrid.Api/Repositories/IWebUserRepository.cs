/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IWebUserRepository.cs
 * Purpose: Interface for WebUser repository operations.
 */
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public interface IWebUserRepository
{
    Task<List<WebUser>> GetAllAsync();
    Task<WebUser?> GetByIdAsync(string id);
    Task<WebUser?> GetByUsernameAsync(string username);
    Task CreateAsync(WebUser user);
    Task UpdateAsync(string id, WebUser user);
}
