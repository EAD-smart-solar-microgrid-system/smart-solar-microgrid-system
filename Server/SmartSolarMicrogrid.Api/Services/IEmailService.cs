/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IEmailService.cs
 * Purpose: Contract for transactional and broadcast email operations.
 */

namespace SmartSolarMicrogrid.Api.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent);
    Task<bool> SendCredentialsEmailAsync(string toEmail, string username, string tempPassword, string role);
    Task<bool> SendVerificationEmailAsync(string toEmail, string username, string token);
    Task<bool> SendAccountInvitationEmailAsync(string toEmail, string username, string role, string token);
    Task<bool> SendPasswordResetEmailAsync(string toEmail, string username, string token);
    Task<bool> SendProsumerRegistrationPendingEmailAsync(string toEmail, string fullName, string nic);
    Task<bool> SendBackofficeProsumerRegistrationEmailAsync(string toEmail, string fullName, string nic, string prosumerEmail);
    Task<bool> SendProsumerActivationWelcomeEmailAsync(string toEmail, string fullName, string nic);
    Task<bool> SendBackofficeProsumerActivationEmailAsync(string toEmail, string fullName, string nic, string prosumerEmail);
    Task<int> SendBroadcastEmailAsync(IEnumerable<string> recipientEmails, string subject, string message);
}
