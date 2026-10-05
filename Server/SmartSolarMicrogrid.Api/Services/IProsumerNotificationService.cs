using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public interface IProsumerNotificationService
{
    Task SendRegistrationNotificationsAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default);

    Task SendActivationNotificationsAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default);
}
