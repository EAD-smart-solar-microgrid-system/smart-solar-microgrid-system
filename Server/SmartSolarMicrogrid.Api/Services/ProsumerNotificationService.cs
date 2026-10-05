using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class ProsumerNotificationService : IProsumerNotificationService
{
    private readonly IEmailService _emailService;
    private readonly IWebUserRepository _webUserRepository;
    private readonly ILogger<ProsumerNotificationService> _logger;

    public ProsumerNotificationService(
        IEmailService emailService,
        IWebUserRepository webUserRepository,
        ILogger<ProsumerNotificationService> logger)
    {
        _emailService = emailService;
        _webUserRepository = webUserRepository;
        _logger = logger;
    }

    public async Task SendRegistrationNotificationsAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var prosumerSent = await _emailService.SendProsumerRegistrationPendingEmailAsync(
                prosumer.Email, prosumer.FullName, prosumer.Nic);
            var backofficeSent = await NotifyBackofficeAsync(
                email => _emailService.SendBackofficeProsumerRegistrationEmailAsync(
                    email, prosumer.FullName, prosumer.Nic, prosumer.Email),
                cancellationToken);

            _logger.LogInformation(
                "Prosumer registration notifications completed. ProsumerSent={ProsumerSent}, BackofficeSent={BackofficeSent}",
                prosumerSent,
                backofficeSent);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Prosumer registration notifications failed after the account was saved.");
        }
    }

    public async Task SendActivationNotificationsAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var prosumerSent = await _emailService.SendProsumerActivationWelcomeEmailAsync(
                prosumer.Email, prosumer.FullName, prosumer.Nic);
            var backofficeSent = await NotifyBackofficeAsync(
                email => _emailService.SendBackofficeProsumerActivationEmailAsync(
                    email, prosumer.FullName, prosumer.Nic, prosumer.Email),
                cancellationToken);

            _logger.LogInformation(
                "Prosumer activation notifications completed. ProsumerSent={ProsumerSent}, BackofficeSent={BackofficeSent}",
                prosumerSent,
                backofficeSent);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Prosumer activation notifications failed after the account was activated.");
        }
    }

    private async Task<int> NotifyBackofficeAsync(
        Func<string, Task<bool>> send,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var recipients = (await _webUserRepository.GetAllAsync())
            .Where(user =>
                user.Role == WebUserRole.Backoffice &&
                user.Status == WebUserStatus.Active &&
                !string.IsNullOrWhiteSpace(user.Email))
            .Select(user => user.Email.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var sentCount = 0;
        foreach (var recipient in recipients)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (await send(recipient)) sentCount++;
        }

        return sentCount;
    }
}
