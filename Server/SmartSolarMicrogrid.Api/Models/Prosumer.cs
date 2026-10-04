/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Prosumer.cs
 * Purpose: Represent a Prosumer profile persisted in the UsersDetail collection.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Models;

[BsonIgnoreExtraElements]
public sealed class Prosumer
{
    [BsonId]
    public string Nic { get; set; } = string.Empty;

    [BsonElement("FullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("Email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("PhoneNumber")]
    public string? PhoneNumber { get; set; }

    [BsonElement("Address")]
    public string? Address { get; set; }

    [BsonElement("AccountStatus")]
    public ProsumerAccountStatus AccountStatus { get; set; } = ProsumerAccountStatus.PendingActivation;

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
