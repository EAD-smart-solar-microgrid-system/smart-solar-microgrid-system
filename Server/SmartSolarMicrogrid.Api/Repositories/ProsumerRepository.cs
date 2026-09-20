/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerRepository.cs
 * Purpose: Execute MongoDB persistence operations for Prosumer profiles.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public sealed class ProsumerRepository : IProsumerRepository
{
    private const string CollectionName = "UsersDetail";
    private readonly IMongoCollection<Prosumer> _prosumers;

    public ProsumerRepository(MongoDbContext databaseContext)
    {
        // Bind the repository to the agreed UsersDetail collection through the shared context.
        _prosumers = databaseContext.Database.GetCollection<Prosumer>(CollectionName);
    }

    public async Task<Prosumer?> GetByNicAsync(
        string nic,
        CancellationToken cancellationToken = default)
    {
        // Find one Prosumer by the NIC-backed MongoDB identifier.
        return await _prosumers
            .Find(prosumer => prosumer.Nic == nic)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Prosumer> CreateAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default)
    {
        // Insert the server-prepared Prosumer document into UsersDetail.
        await _prosumers.InsertOneAsync(prosumer, cancellationToken: cancellationToken);

        return prosumer;
    }

    public async Task<Prosumer?> UpdateProfileAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default)
    {
        // Replace the existing profile while preserving the NIC-backed identifier.
        return await _prosumers.FindOneAndReplaceAsync(
            existingProsumer => existingProsumer.Nic == prosumer.Nic,
            prosumer,
            new FindOneAndReplaceOptions<Prosumer>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<Prosumer?> UpdateStatusAsync(
        string nic,
        ProsumerAccountStatus status,
        DateTime updatedAt,
        CancellationToken cancellationToken = default)
    {
        // Update only account status and the server-controlled update timestamp.
        var update = Builders<Prosumer>.Update
            .Set(prosumer => prosumer.AccountStatus, status)
            .Set(prosumer => prosumer.UpdatedAt, updatedAt);

        return await _prosumers.FindOneAndUpdateAsync(
            prosumer => prosumer.Nic == nic,
            update,
            new FindOneAndUpdateOptions<Prosumer>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }
}
