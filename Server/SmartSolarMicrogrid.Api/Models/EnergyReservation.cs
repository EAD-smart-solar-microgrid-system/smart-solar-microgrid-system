/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EnergyReservation.cs
 * Purpose: Represent an energy slot reservation persisted in the EnergyReservation collection.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Models;

[BsonIgnoreExtraElements]
public sealed class EnergyReservation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("ProsumerNic")]
    public string ProsumerNic { get; set; } = string.Empty;

    [BsonElement("StationId")]
    public string StationId { get; set; } = string.Empty;

    [BsonElement("SlotId")]
    public string SlotId { get; set; } = string.Empty;

    [BsonElement("ReservationDateTime")]
    public DateTime ReservationDateTime { get; set; }

    [BsonElement("ReservationType")]
    [BsonRepresentation(BsonType.String)]
    public ReservationType ReservationType { get; set; } = ReservationType.DropOff;

    [BsonElement("Status")]
    [BsonRepresentation(BsonType.String)]
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    [BsonElement("CancellationReason")]
    public string? CancellationReason { get; set; }

    [BsonElement("CancelledAt")]
    public DateTime? CancelledAt { get; set; }

    [BsonElement("QrToken")]
    public string? QrToken { get; set; }

    [BsonElement("QrIssuedAt")]
    public DateTime? QrIssuedAt { get; set; }

    [BsonElement("QrExpiresAt")]
    public DateTime? QrExpiresAt { get; set; }

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
