/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EmailSettings.cs
 * Purpose: Configuration options for SMTP email delivery.
 */

namespace SmartSolarMicrogrid.Api.Configuration;

public sealed class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string SmtpHost { get; set; } = "smtp.gmail.com";

    public int SmtpPort { get; set; } = 587;

    public string SenderName { get; set; } = "SolarGrid Microgrid System";

    public string SenderEmail { get; set; } = string.Empty;

    public string SmtpUsername { get; set; } = string.Empty;

    public string SmtpPassword { get; set; } = string.Empty;

    public string AppBaseUrl { get; set; } = "http://localhost:5173";

    public bool EnableSsl { get; set; } = true;

    public bool CheckCertificateRevocation { get; set; } = true;
}
