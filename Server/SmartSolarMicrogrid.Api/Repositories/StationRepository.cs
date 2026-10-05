/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationRepository.cs
 * Purpose: Execute MongoDB persistence operations for solar stations.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Utilities;
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
        // Retrieve every station and safely backfill any legacy station lacking a HubId.
        var stations = await _stations
            .Find(Builders<SolarStation>.Filter.Empty)
            .ToListAsync(cancellationToken);

        foreach (var station in stations)
        {
            if (string.IsNullOrWhiteSpace(station.HubId))
            {
                await EnsureHubIdPersistedAsync(station, cancellationToken);
            }
        }

        return stations;
    }

    public async Task<SolarStation?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        // Retrieve one station for internal service operations.
        var station = await _stations
            .Find(s => s.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (station is not null && string.IsNullOrWhiteSpace(station.HubId))
        {
            await EnsureHubIdPersistedAsync(station, cancellationToken);
        }

        return station;
    }

    public async Task<SolarStation?> GetByHubIdAsync(
        string hubId,
        CancellationToken cancellationToken = default)
    {
        // Retrieve one station by its authoritative public HubId.
        return await _stations
            .Find(s => s.HubId == hubId)
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

    public async Task EnsureIndexesAndBackfillAsync(CancellationToken cancellationToken = default)
    {
        // 1. Backfill any existing station documents lacking HubId before index enforcement.
        var missingFilter = Builders<SolarStation>.Filter.Or(
            Builders<SolarStation>.Filter.Eq(s => s.HubId, null),
            Builders<SolarStation>.Filter.Eq(s => s.HubId, string.Empty),
            Builders<SolarStation>.Filter.Exists(s => s.HubId, false));

        var unassigned = await _stations.Find(missingFilter).ToListAsync(cancellationToken);
        foreach (var station in unassigned)
        {
            await EnsureHubIdPersistedAsync(station, cancellationToken);
        }

        // 2. Ensure unique index on hubId.
        try
        {
            var indexKeys = Builders<SolarStation>.IndexKeys.Ascending(s => s.HubId);
            var indexModel = new CreateIndexModel<SolarStation>(
                indexKeys,
                new CreateIndexOptions
                {
                    Unique = true,
                    Name = "UX_SolarStationInfo_hubId"
                });

            await _stations.Indexes.CreateOneAsync(indexModel, cancellationToken: cancellationToken);
        }
        catch (MongoCommandException ex) when (ex.CodeName == "IndexOptionsConflict" || ex.Code == 85)
        {
            // Index already created previously with compatible unique criteria.
        }
    }

    private async Task<string> EnsureHubIdPersistedAsync(
        SolarStation station,
        CancellationToken cancellationToken)
    {
        // Generate and persist a unique HubId when the station lacks one
        if (!string.IsNullOrWhiteSpace(station.HubId))
        {
            return station.HubId;
        }

        string candidate;
        do
        {
            candidate = HubIdGenerator.Generate();
        }
        while (await _stations.Find(s => s.HubId == candidate).AnyAsync(cancellationToken));

        await _stations.UpdateOneAsync(
            s => s.Id == station.Id,
            Builders<SolarStation>.Update.Set(s => s.HubId, candidate),
            cancellationToken: cancellationToken);

        station.HubId = candidate;
        return candidate;
    }
}
