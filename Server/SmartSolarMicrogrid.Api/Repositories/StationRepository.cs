/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationRepository.cs
 * Purpose: Execute MongoDB persistence operations for solar stations.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public sealed class StationRepository : IStationRepository
{
    private const string CollectionName = "SolarStationInfo";
    private readonly IMongoCollection<SolarStation> _stations;

    public StationRepository(MongoDbContext databaseContext)
    {
        // Bind this repository to the agreed MongoDB collection through the existing context.
        _stations = databaseContext.Database.GetCollection<SolarStation>(CollectionName);
    }

    public async Task<IReadOnlyList<SolarStation>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        // Retrieve every station without applying application business rules.
        return await _stations
            .Find(Builders<SolarStation>.Filter.Empty)
            .ToListAsync(cancellationToken);
    }

    public async Task<SolarStation?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        // Retrieve one station for internal service operations.
        return await _stations
            .Find(station => station.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<SolarStation> CreateAsync(
        SolarStation station,
        CancellationToken cancellationToken = default)
    {
        // Insert the server-prepared station document into MongoDB.
        await _stations.InsertOneAsync(station, cancellationToken: cancellationToken);

        return station;
    }

    public async Task<SolarStation?> UpdateDetailsAsync(
        SolarStation station,
        CancellationToken cancellationToken = default)
    {
        // Replace only the already-loaded station document prepared by the service.
        return await _stations.FindOneAndReplaceAsync(
            existingStation => existingStation.Id == station.Id,
            station,
            new FindOneAndReplaceOptions<SolarStation>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<SolarStation?> UpdateStatusAsync(
        string id,
        StationStatus status,
        DateTime updatedAt,
        CancellationToken cancellationToken = default)
    {
        // Update only status and its server-controlled timestamp.
        var update = Builders<SolarStation>.Update
            .Set(station => station.Status, status)
            .Set(station => station.UpdatedAt, updatedAt);

        return await _stations.FindOneAndUpdateAsync(
            station => station.Id == id,
            update,
            new FindOneAndUpdateOptions<SolarStation>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }
}
