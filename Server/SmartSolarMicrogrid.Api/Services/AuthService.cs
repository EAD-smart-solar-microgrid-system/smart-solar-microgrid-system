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
    private readonly IProsumerRepository _prosumerRepo;
    private readonly IConfiguration _config;

    public AuthService(
        IWebUserRepository repo,
        IProsumerRepository prosumerRepo,
        IConfiguration config)
    {
        // Store user repositories and JWT configuration for authentication flows.
        _repo = repo;
        _prosumerRepo = prosumerRepo;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // Authenticate credentials against active user database and generate signed JWT token
        var user = await _repo.GetByUsernameAsync(request.Username);
        if (user == null || user.Status != WebUserStatus.Active) return null;

        if (!PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        // Upgrade legacy plaintext password hashes after a successful login.
        if (PasswordHasher.NeedsRehash(user.PasswordHash))
        {
            user.PasswordHash = PasswordHasher.Hash(request.Password);
            user.UpdatedAt = DateTime.UtcNow;
            await _repo.UpdateAsync(user.Id, user);
        }

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

    public async Task<(bool Succeeded, ProsumerLoginResponse? Response, string? ErrorMessage)> ProsumerLoginAsync(
        string nic,
        CancellationToken cancellationToken = default)
    {
        // Authenticate prosumer identity by normalized NIC and verify account status rules
        var normalizedNic = nic?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(normalizedNic))
        {
            return (false, null, "NIC is required.");
        }

        var prosumer = await _prosumerRepo.GetByNicAsync(normalizedNic, cancellationToken);
        if (prosumer == null)
        {
            return (false, null, "No registered Prosumer account found for this NIC. Please register first.");
        }

        if (prosumer.AccountStatus == ProsumerAccountStatus.PendingActivation)
        {
            return (false, null, "Your account is currently Pending Activation by Backoffice. You cannot log in until approved.");
        }

        if (prosumer.AccountStatus == ProsumerAccountStatus.Deactivated ||
            prosumer.AccountStatus == ProsumerAccountStatus.DeactivationRequested)
        {
            return (false, null, $"Your account status is {prosumer.AccountStatus}. Please contact Backoffice administration.");
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"] ?? "super_secret_key_for_smart_solar_microgrid_12345");

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, prosumer.Nic),
                new Claim(ClaimTypes.Name, prosumer.FullName),
                new Claim(ClaimTypes.Role, "Prosumer"),
                new Claim("nic", prosumer.Nic),
                new Claim("email", prosumer.Email)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwtString = tokenHandler.WriteToken(token);

        var response = new ProsumerLoginResponse(
            Token: jwtString,
            Nic: prosumer.Nic,
            FullName: prosumer.FullName,
            Email: prosumer.Email,
            AccountStatus: prosumer.AccountStatus.ToString()
        );

        return (true, response, null);
    }
}
