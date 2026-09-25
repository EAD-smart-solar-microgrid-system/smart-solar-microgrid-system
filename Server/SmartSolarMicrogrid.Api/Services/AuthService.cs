/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AuthService.cs
 * Purpose: Implementation of authentication business logic.
 */
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Services;

public class AuthService : IAuthService
{
    private readonly IWebUserRepository _repo;
    private readonly IConfiguration _config;

    public AuthService(IWebUserRepository repo, IConfiguration config)
    {
        _repo = repo;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _repo.GetByUsernameAsync(request.Username);
        if (user == null || user.Status != WebUserStatus.Active) return null;
        
        // In a real app, use BCrypt. Here we just do a plain string check for simplicity of the assignment.
        if (user.PasswordHash != request.Password) return null;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"] ?? "super_secret_key_for_smart_solar_microgrid_12345");
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return new LoginResponse(tokenHandler.WriteToken(token), user.Username, user.Role);
    }
}
