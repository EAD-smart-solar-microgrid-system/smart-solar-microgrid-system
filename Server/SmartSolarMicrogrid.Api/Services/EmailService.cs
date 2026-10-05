/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EmailService.cs
 * Purpose: Implementation of email sending via MailKit with HTML formatting and dev fallback.
 */

using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using SmartSolarMicrogrid.Api.Configuration;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> options, ILogger<EmailService> logger)
    {
        // Store SMTP configuration and logging for outbound email delivery.
        _settings = options.Value;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        // Validate recipient and send via SMTP, simulating delivery when credentials are absent.
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("Email sending skipped: recipient email is empty.");
            return false;
        }

        // If SMTP password is not configured yet (local dev without live credentials),
        // log the email content clearly to console so workflows proceed without 500 errors.
        if (string.IsNullOrWhiteSpace(_settings.SmtpPassword))
        {
            _logger.LogInformation("================== [DEV EMAIL SIMULATION] ==================");
            _logger.LogInformation("TO: {To}", toEmail);
            _logger.LogInformation("SUBJECT: {Subject}", subject);
            _logger.LogInformation("HTML BODY: {Body}", htmlContent);
            _logger.LogInformation("============================================================");
            return true;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
            message.To.Add(new MailboxAddress("", toEmail.Trim()));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlContent
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            client.Timeout = 10000;

            var secureSocketOption = _settings.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, secureSocketOption);

            if (!string.IsNullOrWhiteSpace(_settings.SmtpUsername) && !string.IsNullOrWhiteSpace(_settings.SmtpPassword))
            {
                await client.AuthenticateAsync(_settings.SmtpUsername, _settings.SmtpPassword);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email successfully sent to {To} with subject '{Subject}'", toEmail, subject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}. Subject: {Subject}", toEmail, subject);
            return false;
        }
    }

    public async Task<bool> SendCredentialsEmailAsync(string toEmail, string username, string tempPassword, string role)
    {
        // Compose the HTML credentials email and dispatch it to the new staff user.
        var loginUrl = $"{_settings.AppBaseUrl}/login";
        var html = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;"">
    <div style=""background: #0f172a; padding: 24px 32px; text-align: center;"">
        <h1 style=""color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800;"">⚡ SolarGrid Microgrid System</h1>
        <p style=""color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;"">Enterprise Energy Governance Portal</p>
    </div>
    <div style=""padding: 32px; color: #1e293b;"">
        <h2 style=""font-size: 18px; margin-top: 0; color: #0f172a;"">Welcome to the Platform, {username}!</h2>
        <p style=""font-size: 14px; line-height: 1.6; color: #475569;"">
            A staff account has been provisioned for you with administrative authority on the Smart Solar Microgrid Trading System.
        </p>

        <div style=""background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;"">
            <table style=""width: 100%; border-collapse: collapse; font-size: 14px;"">
                <tr>
                    <td style=""padding: 8px 0; color: #64748b; font-weight: bold; width: 140px;"">Assigned Role:</td>
                    <td style=""padding: 8px 0; color: #0f172a; font-weight: 700;"">{role}</td>
                </tr>
                <tr>
                    <td style=""padding: 8px 0; color: #64748b; font-weight: bold;"">Username:</td>
                    <td style=""padding: 8px 0; color: #0f172a; font-family: monospace; font-size: 15px;""><strong>{username}</strong></td>
                </tr>
                <tr>
                    <td style=""padding: 8px 0; color: #64748b; font-weight: bold;"">Temporary Password:</td>
                    <td style=""padding: 8px 0; color: #d97706; font-family: monospace; font-size: 15px; font-weight: bold;"">{tempPassword}</td>
                </tr>
            </table>
        </div>

        <p style=""font-size: 14px; color: #475569; margin-bottom: 24px;"">
            Please log in and update your credentials upon initial access.
        </p>

        <div style=""text-align: center; margin: 30px 0;"">
            <a href=""{loginUrl}"" style=""background: #f59e0b; color: #020617; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 14px;"">
                Log In to SolarGrid Portal →
            </a>
        </div>
    </div>
    <div style=""background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 12px; color: #94a3b8; text-align: center;"">
        Automated credential delivery from Smart Solar Microgrid System. Do not reply to this email.
    </div>
</div>";

        return await SendEmailAsync(toEmail, $"Your SolarGrid Credentials ({username})", html);
    }

    public async Task<bool> SendVerificationEmailAsync(string toEmail, string username, string token)
    {
        // Compose the HTML verification email with a signed token link.
        var verifyUrl = $"{_settings.AppBaseUrl}/verify-email?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(toEmail)}";
        var html = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;"">
    <div style=""background: #0f172a; padding: 24px 32px; text-align: center;"">
        <h1 style=""color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800;"">⚡ SolarGrid Microgrid System</h1>
    </div>
    <div style=""padding: 32px; color: #1e293b;"">
        <h2 style=""font-size: 18px; margin-top: 0; color: #0f172a;"">Verify Your Email Address</h2>
        <p style=""font-size: 14px; line-height: 1.6; color: #475569;"">
            Hi {username}, please verify your email address to complete your account setup and receive notifications.
        </p>
        <div style=""text-align: center; margin: 30px 0;"">
            <a href=""{verifyUrl}"" style=""background: #0f172a; color: #ffffff; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 14px;"">
                Verify Email Address →
            </a>
        </div>
        <p style=""font-size: 12px; color: #94a3b8;"">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href=""{verifyUrl}"" style=""color: #d97706;"">{verifyUrl}</a>
        </p>
    </div>
</div>";

        return await SendEmailAsync(toEmail, "Verify Your SolarGrid Account Email", html);
    }

    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string username, string token)
    {
        // Compose the HTML password reset email with a time-limited token link.
        var resetUrl = $"{_settings.AppBaseUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(toEmail)}";
        var html = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;"">
    <div style=""background: #0f172a; padding: 24px 32px; text-align: center;"">
        <h1 style=""color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800;"">⚡ SolarGrid Security</h1>
    </div>
    <div style=""padding: 32px; color: #1e293b;"">
        <h2 style=""font-size: 18px; margin-top: 0; color: #0f172a;"">Password Reset Request</h2>
        <p style=""font-size: 14px; line-height: 1.6; color: #475569;"">
            Hi {username}, we received a request to reset your password for the SolarGrid Microgrid Trading Platform.
        </p>
        <div style=""text-align: center; margin: 30px 0;"">
            <a href=""{resetUrl}"" style=""background: #d97706; color: #ffffff; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 14px;"">
                Reset My Password →
            </a>
        </div>
        <p style=""font-size: 13px; color: #64748b;"">
            This password reset link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
        </p>
    </div>
</div>";

        return await SendEmailAsync(toEmail, "SolarGrid Password Reset Request", html);
    }

    public async Task<int> SendBroadcastEmailAsync(IEnumerable<string> recipientEmails, string subject, string message)
    {
        // Deduplicate recipients and send the announcement HTML to each address.
        var distinctEmails = recipientEmails
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var successCount = 0;
        foreach (var email in distinctEmails)
        {
            var html = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;"">
    <div style=""background: #0f172a; padding: 24px 32px; text-align: center;"">
        <h1 style=""color: #f59e0b; margin: 0; font-size: 22px; font-weight: 800;"">⚡ SolarGrid Microgrid Announcement</h1>
    </div>
    <div style=""padding: 32px; color: #1e293b; font-size: 14px; line-height: 1.6;"">
        <h3 style=""color: #0f172a; margin-top: 0;"">{subject}</h3>
        <div style=""color: #334155; white-space: pre-wrap;"">{message}</div>
    </div>
    <div style=""background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 12px; color: #94a3b8; text-align: center;"">
        Sent by SolarGrid System Governance to all registered platform users.
    </div>
</div>";

            var sent = await SendEmailAsync(email, subject, html);
            if (sent) successCount++;
        }

        return successCount;
    }
}
