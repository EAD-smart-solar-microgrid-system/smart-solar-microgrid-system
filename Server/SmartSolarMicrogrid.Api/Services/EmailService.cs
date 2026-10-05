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
        _settings = options.Value;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("Email sending skipped: recipient email is empty.");
            return false;
        }

        // Never claim delivery or log sensitive account links when SMTP is unavailable.
        if (string.IsNullOrWhiteSpace(_settings.SmtpPassword) ||
            string.IsNullOrWhiteSpace(_settings.SenderEmail) ||
            string.IsNullOrWhiteSpace(_settings.SmtpUsername))
        {
            _logger.LogWarning("Email not sent: SMTP credentials are not fully configured.");
            return false;
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
            client.CheckCertificateRevocation = _settings.CheckCertificateRevocation;

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

    public async Task<bool> SendAccountInvitationEmailAsync(string toEmail, string username, string role, string token)
    {
        var safeEmail = System.Net.WebUtility.HtmlEncode(toEmail);
        var safeUsername = System.Net.WebUtility.HtmlEncode(username);
        var safeRole = System.Net.WebUtility.HtmlEncode(role);
        var setupUrl = $"{_settings.AppBaseUrl}/verify-email?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(toEmail)}";
        var html = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;"">
    <div style=""background: #0f172a; padding: 24px 32px; text-align: center;"">
        <h1 style=""color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800;"">⚡ SolarGrid Microgrid System</h1>
        <p style=""color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;"">Enterprise Energy Governance Portal</p>
    </div>
    <div style=""padding: 32px; color: #1e293b;"">
        <h2 style=""font-size: 18px; margin-top: 0; color: #0f172a;"">Complete Your Account Setup</h2>
        <p style=""font-size: 14px; line-height: 1.6; color: #475569;"">
            Hi {safeUsername}, an account has been created for you on the Smart Solar Microgrid Trading System.
        </p>

        <div style=""background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;"">
            <table style=""width: 100%; border-collapse: collapse; font-size: 14px;"">
                <tr>
                    <td style=""padding: 8px 0; color: #64748b; font-weight: bold; width: 140px;"">Assigned Role:</td>
                    <td style=""padding: 8px 0; color: #0f172a; font-weight: 700;"">{safeRole}</td>
                </tr>
                <tr>
                    <td style=""padding: 8px 0; color: #64748b; font-weight: bold;"">Username:</td>
                    <td style=""padding: 8px 0; color: #0f172a; font-family: monospace; font-size: 15px;""><strong>{safeUsername}</strong></td>
                </tr>
                <tr>
                    <td style=""padding: 8px 0; color: #64748b; font-weight: bold;"">Account Email:</td>
                    <td style=""padding: 8px 0; color: #0f172a; font-size: 14px;"">{safeEmail}</td>
                </tr>
            </table>
        </div>

        <p style=""font-size: 14px; color: #475569; margin-bottom: 24px;"">
            Use the secure one-time link below to verify your email and create your own password. This link expires in 24 hours.
        </p>

        <div style=""text-align: center; margin: 30px 0;"">
            <a href=""{setupUrl}"" style=""background: #f59e0b; color: #020617; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 14px;"">
                Verify Email &amp; Create Password →
            </a>
        </div>
        <p style=""font-size: 12px; color: #94a3b8; word-break: break-all;"">
            If the button does not work, copy and paste this link into your browser:<br/>
            <a href=""{setupUrl}"" style=""color: #d97706;"">{setupUrl}</a>
        </p>
    </div>
    <div style=""background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 12px; color: #94a3b8; text-align: center;"">
        If you were not expecting this invitation, you can safely ignore this email.
    </div>
</div>";

        return await SendEmailAsync(toEmail, $"Set Up Your SolarGrid Account ({username})", html);
    }

    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string username, string token)
    {
        var safeUsername = System.Net.WebUtility.HtmlEncode(username);
        var resetUrl = $"{_settings.AppBaseUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(toEmail)}";
        var html = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;"">
    <div style=""background: #0f172a; padding: 24px 32px; text-align: center;"">
        <h1 style=""color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800;"">⚡ SolarGrid Security</h1>
    </div>
    <div style=""padding: 32px; color: #1e293b;"">
        <h2 style=""font-size: 18px; margin-top: 0; color: #0f172a;"">Password Reset Request</h2>
        <p style=""font-size: 14px; line-height: 1.6; color: #475569;"">
            Hi {safeUsername}, we received a request to reset your password for the SolarGrid Microgrid Trading Platform.
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

    public Task<bool> SendProsumerRegistrationPendingEmailAsync(
        string toEmail,
        string fullName,
        string nic)
    {
        var html = BuildProsumerLifecycleEmail(
            "Registration Received",
            fullName,
            nic,
            "Your SolarGrid Prosumer registration was received successfully.",
            "Your account is currently pending Backoffice approval. You will receive another email when your account is activated.",
            "Pending Approval",
            "#d97706");

        return SendEmailAsync(toEmail, "SolarGrid Registration Received - Pending Approval", html);
    }

    public Task<bool> SendBackofficeProsumerRegistrationEmailAsync(
        string toEmail,
        string fullName,
        string nic,
        string prosumerEmail)
    {
        var safeProsumerEmail = System.Net.WebUtility.HtmlEncode(prosumerEmail);
        var html = BuildProsumerLifecycleEmail(
            "New Prosumer Registration",
            fullName,
            nic,
            $"A new Solar Prosumer registered with the email address <strong>{safeProsumerEmail}</strong>.",
            "Review the Prosumer in Backoffice Prosumer Management and activate the account after completing the required checks.",
            "Action Required",
            "#2563eb");

        return SendEmailAsync(toEmail, $"New Solar Prosumer Registration - {nic}", html);
    }

    public Task<bool> SendProsumerActivationWelcomeEmailAsync(
        string toEmail,
        string fullName,
        string nic)
    {
        var html = BuildProsumerLifecycleEmail(
            "Welcome to SolarGrid",
            fullName,
            nic,
            "Your SolarGrid Prosumer account has been approved and activated by Backoffice.",
            "You can now sign in to the Android application using your registered NIC and access Prosumer services.",
            "Account Active",
            "#059669");

        return SendEmailAsync(toEmail, "Welcome to SolarGrid - Your Prosumer Account Is Active", html);
    }

    public Task<bool> SendBackofficeProsumerActivationEmailAsync(
        string toEmail,
        string fullName,
        string nic,
        string prosumerEmail)
    {
        var safeProsumerEmail = System.Net.WebUtility.HtmlEncode(prosumerEmail);
        var html = BuildProsumerLifecycleEmail(
            "Prosumer Account Activated",
            fullName,
            nic,
            $"The Prosumer account for <strong>{safeProsumerEmail}</strong> has been activated successfully.",
            "The Prosumer has been sent a welcome email and can now sign in to the Android application.",
            "Activation Complete",
            "#059669");

        return SendEmailAsync(toEmail, $"Solar Prosumer Activated - {nic}", html);
    }

    public async Task<int> SendBroadcastEmailAsync(IEnumerable<string> recipientEmails, string subject, string message)
    {
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

    private static string BuildProsumerLifecycleEmail(
        string heading,
        string fullName,
        string nic,
        string primaryMessage,
        string secondaryMessage,
        string statusLabel,
        string statusColor)
    {
        var safeHeading = System.Net.WebUtility.HtmlEncode(heading);
        var safeFullName = System.Net.WebUtility.HtmlEncode(fullName);
        var safeNic = System.Net.WebUtility.HtmlEncode(nic);
        var safeStatus = System.Net.WebUtility.HtmlEncode(statusLabel);

        return $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;"">
    <div style=""background: #0f172a; padding: 24px 32px; text-align: center;"">
        <h1 style=""color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800;"">⚡ SolarGrid Microgrid System</h1>
    </div>
    <div style=""padding: 32px; color: #1e293b;"">
        <h2 style=""font-size: 20px; margin-top: 0; color: #0f172a;"">{safeHeading}</h2>
        <p style=""font-size: 14px; line-height: 1.6; color: #475569;"">Hello {safeFullName},</p>
        <p style=""font-size: 14px; line-height: 1.6; color: #475569;"">{primaryMessage}</p>
        <div style=""background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 22px 0;"">
            <p style=""margin: 0 0 8px; font-size: 13px; color: #64748b;""><strong>Prosumer NIC:</strong> {safeNic}</p>
            <p style=""margin: 0; font-size: 13px; color: {statusColor};""><strong>Status:</strong> {safeStatus}</p>
        </div>
        <p style=""font-size: 14px; line-height: 1.6; color: #475569;"">{secondaryMessage}</p>
    </div>
    <div style=""background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 12px; color: #94a3b8; text-align: center;"">
        Automated notification from Smart Solar Microgrid System. Do not reply to this email.
    </div>
</div>";
    }
}
