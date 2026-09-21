/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerRepository.cs
 * Purpose: Execute MongoDB persistence operations for solar prosumers in the shared UsersDetail collection.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public sealed class ProsumerRepository : IProsumerRepository
{
    private const string CollectionName = "UsersDetail";
    private static readonly string[] ProsumerRoles = ["Solar Prosumer", "Prosumer"];
    private readonly IMongoCollection<Prosumer> _prosumers;

    public ProsumerRepository(MongoDbContext databaseContext)
    {
        // Bind this repository to the shared UsersDetail collection through the database context.
        _prosumers = databaseContext.Database.GetCollection<Prosumer>(CollectionName);
    }

    private static FilterDefinition<Prosumer> BaseProsumerFilter =>
        Builders<Prosumer>.Filter.In(prosumer => prosumer.Role, ProsumerRoles);

    public async Task<IReadOnlyList<Prosumer>> GetAllAsync(
        ProsumerStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        // Query only prosumer documents, optionally filtering by lifecycle status.
        var filter = BaseProsumerFilter;

        if (status.HasValue)
        {
            var statusFilter = Builders<Prosumer>.Filter.Eq(prosumer => prosumer.Status, status.Value);
            filter = Builders<Prosumer>.Filter.And(filter, statusFilter);
        }

        return await _prosumers
            .Find(filter)
            .ToListAsync(cancellationToken);
    }

    public async Task<Prosumer?> GetByNicAsync(
        string normalizedNic,
        CancellationToken cancellationToken = default)
    {
        // Retrieve a single prosumer by normalized NIC while excluding administrative users.
        var filter = Builders<Prosumer>.Filter.And(
            BaseProsumerFilter,
            Builders<Prosumer>.Filter.Eq(prosumer => prosumer.Nic, normalizedNic));

        return await _prosumers
            .Find(filter)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> ExistsByNicAsync(
        string normalizedNic,
        CancellationToken cancellationToken = default)
    {
        // Check whether a user or prosumer record already claims this National Identity Card.
        var filter = Builders<Prosumer>.Filter.Eq(prosumer => prosumer.Nic, normalizedNic);

        var count = await _prosumers
            .Find(filter)
            .Limit(1)
            .CountDocumentsAsync(cancellationToken);

        return count > 0;
    }

    public async Task<Prosumer> CreateAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default)
    {
        // Ensure prosumer discriminator is applied before persisting to the shared collection.
        prosumer.Role = "Solar Prosumer";
        await _prosumers.InsertOneAsync(prosumer, cancellationToken: cancellationToken);

        return prosumer;
    }

    public async Task<Prosumer?> UpdateDetailsAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default)
    {
        // Update prosumer details safely scoped to the prosumer discriminator.
        var filter = Builders<Prosumer>.Filter.And(
            BaseProsumerFilter,
            Builders<Prosumer>.Filter.Eq(existing => existing.Nic, prosumer.Nic));

        var update = Builders<Prosumer>.Update
            .Set(existing => existing.FullName, prosumer.FullName)
            .Set(existing => existing.Email, prosumer.Email)
            .Set(existing => existing.Phone, prosumer.Phone)
            .Set(existing => existing.Address, prosumer.Address)
            .Set(existing => existing.UpdatedAt, prosumer.UpdatedAt);

        return await _prosumers.FindOneAndUpdateAsync(
            filter,
            update,
            new FindOneAndUpdateOptions<Prosumer>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<Prosumer?> UpdateStatusAsync(
        string normalizedNic,
        ProsumerStatus status,
        DateTime updatedAt,
        CancellationToken cancellationToken = default)
    {
        // Update prosumer lifecycle status without modifying Member 1 administrative credentials.
        var filter = Builders<Prosumer>.Filter.And(
            BaseProsumerFilter,
            Builders<Prosumer>.Filter.Eq(existing => existing.Nic, normalizedNic));

        var update = Builders<Prosumer>.Update
            .Set(existing => existing.Status, status)
            .Set(existing => existing.UpdatedAt, updatedAt);

        return await _prosumers.FindOneAndUpdateAsync(
            filter,
            update,
            new FindOneAndUpdateOptions<Prosumer>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }
}
