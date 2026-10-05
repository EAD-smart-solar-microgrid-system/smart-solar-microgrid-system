using Microsoft.Extensions.Logging.Abstractions;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Services;
using Xunit;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class ProsumerEmailNotificationTests
{
    [Fact]
    public async Task AndroidRegistration_NotifiesProsumerAndOnlyActiveBackoffice()
    {
        var email = new RecordingEmailService();
        var notification = CreateNotificationService(email);
        var service = new ProsumerService(
            new RegistrationProsumerRepository(),
            new EmptyCurrentProsumerAccessor(),
            notification);

        var result = await service.RegisterAsync(new RegisterProsumerRequest
        {
            Nic = "200012345678",
            FullName = "Solar Citizen",
            Email = "prosumer@example.com"
        });

        Assert.True(result.Succeeded);
        Assert.Equal("PendingActivation", result.Value!.AccountStatus);
        Assert.Equal(new[] { "prosumer@example.com" }, email.ProsumerPendingRecipients);
        Assert.Equal(new[] { "admin@example.com" }, email.BackofficeRegistrationRecipients);
    }

    [Fact]
    public async Task InitialBackofficeActivation_NotifiesProsumerAndOnlyActiveBackoffice()
    {
        var prosumer = NewProsumer(ProsumerAccountStatus.PendingActivation);
        var email = new RecordingEmailService();
        var notification = CreateNotificationService(email);
        var service = new AdminProsumerService(
            new ActivationAdminProsumerRepository(prosumer),
            notification);

        var result = await service.ChangeStatusAsync(
            prosumer.Nic,
            new UpdateProsumerStatusRequest { Status = "Active" });

        Assert.True(result.Succeeded);
        Assert.Equal("Active", result.Value!.Status);
        Assert.Equal(new[] { "prosumer@example.com" }, email.ProsumerWelcomeRecipients);
        Assert.Equal(new[] { "admin@example.com" }, email.BackofficeActivationRecipients);
    }

    [Fact]
    public async Task AlreadyActiveProsumer_DoesNotReceiveDuplicateWelcomeEmail()
    {
        var prosumer = NewProsumer(ProsumerAccountStatus.Active);
        var email = new RecordingEmailService();
        var notification = CreateNotificationService(email);
        var service = new AdminProsumerService(
            new ActivationAdminProsumerRepository(prosumer),
            notification);

        var result = await service.ChangeStatusAsync(
            prosumer.Nic,
            new UpdateProsumerStatusRequest { Status = "Active" });

        Assert.True(result.Succeeded);
        Assert.Empty(email.ProsumerWelcomeRecipients);
        Assert.Empty(email.BackofficeActivationRecipients);
    }

    private static ProsumerNotificationService CreateNotificationService(RecordingEmailService email) =>
        new(email, new NotificationWebUserRepository(), NullLogger<ProsumerNotificationService>.Instance);

    private static Prosumer NewProsumer(ProsumerAccountStatus status) => new()
    {
        Nic = "200012345678",
        FullName = "Solar Citizen",
        Email = "prosumer@example.com",
        AccountStatus = status,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    private sealed class RecordingEmailService : IEmailService
    {
        public List<string> ProsumerPendingRecipients { get; } = [];
        public List<string> BackofficeRegistrationRecipients { get; } = [];
        public List<string> ProsumerWelcomeRecipients { get; } = [];
        public List<string> BackofficeActivationRecipients { get; } = [];

        public Task<bool> SendProsumerRegistrationPendingEmailAsync(string toEmail, string fullName, string nic)
        {
            ProsumerPendingRecipients.Add(toEmail);
            return Task.FromResult(true);
        }

        public Task<bool> SendBackofficeProsumerRegistrationEmailAsync(string toEmail, string fullName, string nic, string prosumerEmail)
        {
            BackofficeRegistrationRecipients.Add(toEmail);
            return Task.FromResult(true);
        }

        public Task<bool> SendProsumerActivationWelcomeEmailAsync(string toEmail, string fullName, string nic)
        {
            ProsumerWelcomeRecipients.Add(toEmail);
            return Task.FromResult(true);
        }

        public Task<bool> SendBackofficeProsumerActivationEmailAsync(string toEmail, string fullName, string nic, string prosumerEmail)
        {
            BackofficeActivationRecipients.Add(toEmail);
            return Task.FromResult(true);
        }

        public Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent) => Task.FromResult(true);
        public Task<bool> SendAccountInvitationEmailAsync(string toEmail, string username, string role, string token) => Task.FromResult(true);
        public Task<bool> SendPasswordResetEmailAsync(string toEmail, string username, string token) => Task.FromResult(true);
        public Task<int> SendBroadcastEmailAsync(IEnumerable<string> recipientEmails, string subject, string message) => Task.FromResult(0);
    }

    private sealed class NotificationWebUserRepository : IWebUserRepository
    {
        public Task<List<WebUser>> GetAllAsync() => Task.FromResult(new List<WebUser>
        {
            NewWebUser("active-admin", "admin@example.com", WebUserRole.Backoffice, WebUserStatus.Active),
            NewWebUser("inactive-admin", "inactive@example.com", WebUserRole.Backoffice, WebUserStatus.Deactivated),
            NewWebUser("operator", "operator@example.com", WebUserRole.GridOperator, WebUserStatus.Active)
        });

        private static WebUser NewWebUser(
            string username,
            string email,
            WebUserRole role,
            WebUserStatus status) => new()
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            Username = username,
            Email = email,
            PasswordHash = "unused",
            Role = role,
            Status = status
        };

        public Task<WebUser?> GetByIdAsync(string id) => throw new NotSupportedException();
        public Task<WebUser?> GetByUsernameAsync(string username) => throw new NotSupportedException();
        public Task<WebUser?> GetByEmailAsync(string email) => throw new NotSupportedException();
        public Task<WebUser?> GetByResetTokenAsync(string token) => throw new NotSupportedException();
        public Task<WebUser?> GetByVerificationTokenAsync(string token) => throw new NotSupportedException();
        public Task CreateAsync(WebUser user) => throw new NotSupportedException();
        public Task UpdateAsync(string id, WebUser user) => throw new NotSupportedException();
    }

    private sealed class RegistrationProsumerRepository : IProsumerRepository
    {
        public Task<Prosumer?> GetByNicAsync(string nic, CancellationToken cancellationToken = default) =>
            Task.FromResult<Prosumer?>(null);
        public Task<Prosumer> CreateAsync(Prosumer prosumer, CancellationToken cancellationToken = default) =>
            Task.FromResult(prosumer);
        public Task<Prosumer?> UpdateProfileAsync(Prosumer prosumer, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
        public Task<Prosumer?> UpdateStatusAsync(string nic, ProsumerAccountStatus status, DateTime updatedAt, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }

    private sealed class EmptyCurrentProsumerAccessor : ICurrentProsumerAccessor
    {
        public Task<string?> GetCurrentProsumerNicAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<string?>(null);
    }

    private sealed class ActivationAdminProsumerRepository(Prosumer prosumer) : IAdminProsumerRepository
    {
        public Task<Prosumer?> GetByNicAsync(string normalizedNic, CancellationToken cancellationToken = default) =>
            Task.FromResult<Prosumer?>(prosumer.Nic == normalizedNic ? prosumer : null);

        public Task<Prosumer?> UpdateStatusAsync(string normalizedNic, ProsumerAccountStatus status, DateTime updatedAt, CancellationToken cancellationToken = default)
        {
            prosumer.AccountStatus = status;
            prosumer.UpdatedAt = updatedAt;
            return Task.FromResult<Prosumer?>(prosumer);
        }

        public Task<IReadOnlyList<Prosumer>> GetAllAsync(string? adminStatusFilter = null, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<bool> ExistsByNicAsync(string normalizedNic, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Prosumer> CreateAsync(Prosumer newProsumer, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Prosumer?> UpdateDetailsAsync(string normalizedNic, string fullName, string email, string? phoneNumber, string? address, DateTime updatedAt, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
