/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: MongoDbSettings.cs
 * Purpose: Represent MongoDB settings loaded from application configuration.
 */

namespace SmartSolarMicrogrid.Api.Configuration;

public sealed class MongoDbSettings
{
    public const string SectionName = "MongoDb";

    public string ConnectionString { get; set; } = string.Empty;

    public string DatabaseName { get; set; } = string.Empty;
}
