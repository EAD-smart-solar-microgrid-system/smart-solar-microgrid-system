/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: WebUser.cs
 * Purpose: Represent a Web User profile persisted in the UsersDetail collection.
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Models;

[BsonIgnoreExtraElements]
public sealed class WebUser
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("Username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("PasswordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("Role")]
    [BsonRepresentation(BsonType.String)]
    public WebUserRole Role { get; set; } = WebUserRole.GridOperator;

    [BsonElement("Status")]
    [BsonRepresentation(BsonType.String)]
    public WebUserStatus Status { get; set; } = WebUserStatus.Active;

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
