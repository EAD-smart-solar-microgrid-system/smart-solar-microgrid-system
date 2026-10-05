using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Services;
using Xunit;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class AuthenticationFlowTests
{
    [Fact]
    public async Task CreateUser_CreatesExpiringInvitationWithoutAnAdministratorChosenPassword()
    {
        var repository = new FakeWebUserRepository();
        var email = new RecordingEmailService();
        var service = CreateWebUserService(repository, email);

        var result = await service.CreateUserAsync(new CreateWebUserRequest(
            "NewOperator",
            WebUserRole.GridOperator,
            "operator@example.com"));

        Assert.NotNull(result);
        Assert.True(result!.InvitationEmailSent);
        Assert.False(result.IsEmailVerified);
        Assert.NotNull(repository.User);
        Assert.False(repository.User!.IsEmailVerified);
        Assert.NotNull(repository.User.EmailVerificationToken);
        Assert.True(repository.User.EmailVerificationExpiry > DateTime.UtcNow);
        Assert.Equal("NewOperator", email.InvitedUsername);
        Assert.Equal("Grid Operator", email.InvitedRole);
        Assert.Equal(repository.User.EmailVerificationToken, email.InvitationToken);
    }

    [Fact]
    public async Task CompleteRegistration_VerifiesUserAndStoresUsableBcryptPassword()
    {
        var setupToken = new string('A', 64);
        var user = NewUser();
        user.EmailVerificationToken = setupToken;
        user.EmailVerificationExpiry = DateTime.UtcNow.AddMinutes(10);
        var repository = new FakeWebUserRepository(user);
        var service = CreateWebUserService(repository);

        var result = await service.CompleteRegistrationAsync(setupToken, "NewPassword123");

        Assert.True(result.Success);
        Assert.True(user.IsEmailVerified);
        Assert.Null(user.EmailVerificationToken);
        Assert.Null(user.EmailVerificationExpiry);
        Assert.True(PasswordHasher.Verify("NewPassword123", user.PasswordHash));
        Assert.StartsWith("$2", user.PasswordHash);
    }

    [Fact]
    public async Task ResetPassword_VerifiesMailboxOwnerAndStoresUsablePasswordHash()
    {
        var resetToken = new string('B', 64);
        var user = NewUser();
        user.EmailVerificationToken = "old-setup-token";
        user.EmailVerificationExpiry = DateTime.UtcNow.AddMinutes(10);
        user.PasswordResetToken = resetToken;
        user.PasswordResetExpiry = DateTime.UtcNow.AddMinutes(10);
        var repository = new FakeWebUserRepository(user);
        var service = CreateWebUserService(repository);

        var result = await service.ResetPasswordAsync(resetToken, "ResetPassword123");

        Assert.True(result.Success);
        Assert.True(user.IsEmailVerified);
        Assert.Null(user.EmailVerificationToken);
        Assert.Null(user.EmailVerificationExpiry);
        Assert.Null(user.PasswordResetToken);
        Assert.True(PasswordHasher.Verify("ResetPassword123", user.PasswordHash));
    }

    [Fact]
    public async Task Login_AcceptsRegisteredEmailWithSurroundingWhitespace()
    {
        var user = NewUser();
        user.IsEmailVerified = true;
        user.PasswordHash = PasswordHasher.Hash("StrongPassword123");
        var repository = new FakeWebUserRepository(user);
        var service = CreateAuthService(repository);

        var response = await service.LoginAsync(
            new LoginRequest("  USER@EXAMPLE.COM  ", "StrongPassword123"));

        Assert.NotNull(response);
        Assert.Equal(user.Username, response!.Username);
    }

    [Fact]
    public async Task Login_RejectsNewInvitationUntilAccountSetupCompletes()
    {
        var user = NewUser();
        user.EmailVerificationToken = "setup-token";
        user.EmailVerificationExpiry = DateTime.UtcNow.AddMinutes(10);
        var repository = new FakeWebUserRepository(user);
        var service = CreateAuthService(repository);

        var response = await service.LoginAsync(new LoginRequest(user.Username, "InitialPassword123"));

        Assert.Null(response);
    }

    [Fact]
    public async Task Login_PreservesPasswordWhitespace()
    {
        var user = NewUser();
        user.IsEmailVerified = true;
        user.PasswordHash = PasswordHasher.Hash(" Password123 ");
        var service = CreateAuthService(new FakeWebUserRepository(user));

        var response = await service.LoginAsync(new LoginRequest(user.Username, " Password123 "));

        Assert.NotNull(response);
    }

    private static WebUserService CreateWebUserService(
        FakeWebUserRepository repository,
        RecordingEmailService? email = null) =>
        new(
            repository,
            new StubAdminProsumerRepository(),
            email ?? new RecordingEmailService(),
            NullLogger<WebUserService>.Instance);

    private static AuthService CreateAuthService(FakeWebUserRepository repository)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test_key_long_enough_for_hmac_sha256_signing"
            })
            .Build();
        return new AuthService(repository, new StubProsumerRepository(), configuration);
    }

    private static WebUser NewUser() => new()
    {
        Id = "507f1f77bcf86cd799439011",
        Username = "TestAdmin",
        Email = "user@example.com",
        PasswordHash = PasswordHasher.Hash("InitialPassword123"),
        Role = WebUserRole.Backoffice,
        Status = WebUserStatus.Active,
        IsEmailVerified = false,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    private sealed class FakeWebUserRepository(WebUser? initialUser = null) : IWebUserRepository
    {
        public WebUser? User { get; private set; } = initialUser;

        public Task<List<WebUser>> GetAllAsync() =>
            Task.FromResult(User is null ? new List<WebUser>() : new List<WebUser> { User });
        public Task<WebUser?> GetByIdAsync(string id) =>
            Task.FromResult(User?.Id == id ? User : null);
        public Task<WebUser?> GetByUsernameAsync(string username) => Task.FromResult<WebUser?>(
            string.Equals(User?.Username, username.Trim(), StringComparison.OrdinalIgnoreCase) ? User : null);
        public Task<WebUser?> GetByEmailAsync(string email) => Task.FromResult<WebUser?>(
            string.Equals(User?.Email, email.Trim(), StringComparison.OrdinalIgnoreCase) ? User : null);
        public Task<WebUser?> GetByResetTokenAsync(string token) =>
            Task.FromResult(User?.PasswordResetToken == token ? User : null);
        public Task<WebUser?> GetByVerificationTokenAsync(string token) =>
            Task.FromResult(User?.EmailVerificationToken == token ? User : null);
        public Task CreateAsync(WebUser user)
        {
            User = user;
            return Task.CompletedTask;
        }
        public Task UpdateAsync(string id, WebUser user)
        {
            User = user;
            return Task.CompletedTask;
        }
    }

    private sealed class RecordingEmailService : IEmailService
    {
        public string? InvitedUsername { get; private set; }
        public string? InvitedRole { get; private set; }
        public string? InvitationToken { get; private set; }

        public Task<bool> SendAccountInvitationEmailAsync(string toEmail, string username, string role, string token)
        {
            InvitedUsername = username;
            InvitedRole = role;
            InvitationToken = token;
            return Task.FromResult(true);
        }

        public Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent) => Task.FromResult(true);
        public Task<bool> SendPasswordResetEmailAsync(string toEmail, string username, string token) => Task.FromResult(true);
        public Task<bool> SendProsumerRegistrationPendingEmailAsync(string toEmail, string fullName, string nic) => Task.FromResult(true);
        public Task<bool> SendBackofficeProsumerRegistrationEmailAsync(string toEmail, string fullName, string nic, string prosumerEmail) => Task.FromResult(true);
        public Task<bool> SendProsumerActivationWelcomeEmailAsync(string toEmail, string fullName, string nic) => Task.FromResult(true);
        public Task<bool> SendBackofficeProsumerActivationEmailAsync(string toEmail, string fullName, string nic, string prosumerEmail) => Task.FromResult(true);
        public Task<int> SendBroadcastEmailAsync(IEnumerable<string> recipientEmails, string subject, string message) => Task.FromResult(0);
    }

    private sealed class StubProsumerRepository : IProsumerRepository
    {
        public Task<Prosumer?> GetByNicAsync(string nic, CancellationToken cancellationToken = default) => Task.FromResult<Prosumer?>(null);
        public Task<Prosumer> CreateAsync(Prosumer prosumer, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Prosumer?> UpdateProfileAsync(Prosumer prosumer, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Prosumer?> UpdateStatusAsync(string nic, ProsumerAccountStatus status, DateTime updatedAt, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }

    private sealed class StubAdminProsumerRepository : IAdminProsumerRepository
    {
        public Task<IReadOnlyList<Prosumer>> GetAllAsync(string? adminStatusFilter = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Prosumer>>(Array.Empty<Prosumer>());
        public Task<Prosumer?> GetByNicAsync(string normalizedNic, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<bool> ExistsByNicAsync(string normalizedNic, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Prosumer> CreateAsync(Prosumer prosumer, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Prosumer?> UpdateDetailsAsync(string normalizedNic, string fullName, string email, string? phoneNumber, string? address, DateTime updatedAt, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Prosumer?> UpdateStatusAsync(string normalizedNic, ProsumerAccountStatus status, DateTime updatedAt, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
