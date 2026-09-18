/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: SolarStation.cs
 * Purpose: Represent a microgrid node persisted in the SolarStationInfo collection.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Models;

[BsonIgnoreExtraElements]
public sealed class SolarStation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("StationName")]
    public string StationName { get; set; } = string.Empty;

    [BsonElement("Latitude")]
    public double Latitude { get; set; }

    [BsonElement("Longitude")]
    public double Longitude { get; set; }

    [BsonElement("CapacityKwPerHour")]
    public double CapacityKwPerHour { get; set; }

    [BsonElement("BatteryStorageSlotCapacity")]
    public int BatteryStorageSlotCapacity { get; set; }

    [BsonElement("OperatingSchedule")]
    public List<StationSchedule> OperatingSchedule { get; set; } = [];

    [BsonElement("Status")]
    public StationStatus Status { get; set; } = StationStatus.Active;

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
