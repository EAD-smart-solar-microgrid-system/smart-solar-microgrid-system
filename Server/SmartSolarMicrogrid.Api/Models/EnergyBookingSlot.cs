/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EnergyBookingSlot.cs
 * Purpose: Represent a bookable energy time window persisted in the EnergyBookingSlots collection.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

[BsonIgnoreExtraElements]
public sealed class EnergyBookingSlot
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("StationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string StationId { get; set; } = string.Empty;

    [BsonElement("SlotStartUtc")]
    public DateTime SlotStartUtc { get; set; }

    [BsonElement("SlotEndUtc")]
    public DateTime SlotEndUtc { get; set; }

    [BsonElement("CapacityKw")]
    public double CapacityKw { get; set; }

    [BsonElement("IsAvailable")]
    public bool IsAvailable { get; set; } = true;

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
