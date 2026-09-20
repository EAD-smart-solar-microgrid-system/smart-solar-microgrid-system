/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Prosumer.cs
 * Purpose: Represent a solar prosumer account persisted in the shared UsersDetail collection.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Models;

[BsonIgnoreExtraElements]
public sealed class Prosumer
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("Nic")]
    public string Nic { get; set; } = string.Empty;

    [BsonElement("FullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("Email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("Phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("Address")]
    public string Address { get; set; } = string.Empty;

    [BsonElement("Role")]
    public string Role { get; set; } = "Solar Prosumer";

    [BsonElement("Status")]
    [BsonRepresentation(BsonType.String)]
    public ProsumerStatus Status { get; set; } = ProsumerStatus.Pending;

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
