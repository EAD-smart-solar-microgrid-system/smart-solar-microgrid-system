/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AdminProsumerRepository.cs
 * Purpose: Execute MongoDB operations for administrative prosumer governance against UsersDetail.
 */

using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public sealed class AdminProsumerRepository : IAdminProsumerRepository
{
    private const string CollectionName = "UsersDetail";
    private readonly IMongoCollection<Prosumer> _prosumers;
    private readonly IMongoCollection<BsonDocument> _rawCollection;

    public AdminProsumerRepository(MongoDbContext databaseContext)
    {
        _prosumers = databaseContext.Database.GetCollection<Prosumer>(CollectionName);
        _rawCollection = databaseContext.Database.GetCollection<BsonDocument>(CollectionName);
    }

    private static FilterDefinition<BsonDocument> ExcludeWebUsersFilter =>
        Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Nin("Role", new BsonArray { "Backoffice", "GridOperator" }),
            Builders<BsonDocument>.Filter.Exists("PasswordHash", exists: false)
        );

    public async Task<IReadOnlyList<Prosumer>> GetAllAsync(
        string? adminStatusFilter = null,
        CancellationToken cancellationToken = default)
    {
        var filter = ExcludeWebUsersFilter;

        if (!string.IsNullOrWhiteSpace(adminStatusFilter))
        {
            var normalizedFilter = adminStatusFilter.Trim().ToLowerInvariant();

            FilterDefinition<BsonDocument> statusFilter = normalizedFilter switch
            {
                "pending" => Builders<BsonDocument>.Filter.Or(
                    Builders<BsonDocument>.Filter.Eq("AccountStatus", (int)ProsumerAccountStatus.PendingActivation),
                    Builders<BsonDocument>.Filter.Eq("Status", "Pending")),
                "active" => Builders<BsonDocument>.Filter.Or(
                    Builders<BsonDocument>.Filter.Eq("AccountStatus", (int)ProsumerAccountStatus.Active),
                    Builders<BsonDocument>.Filter.Eq("AccountStatus", (int)ProsumerAccountStatus.DeactivationRequested),
                    Builders<BsonDocument>.Filter.Eq("Status", "Active")),
                "deactivated" => Builders<BsonDocument>.Filter.Or(
                    Builders<BsonDocument>.Filter.Eq("AccountStatus", (int)ProsumerAccountStatus.Deactivated),
                    Builders<BsonDocument>.Filter.Eq("Status", "Deactivated")),
                _ => Builders<BsonDocument>.Filter.Empty
            };

            filter = Builders<BsonDocument>.Filter.And(filter, statusFilter);
        }

        var rawDocs = await _rawCollection
            .Find(filter)
            .ToListAsync(cancellationToken);

        var results = new List<Prosumer>(rawDocs.Count);

        foreach (var doc in rawDocs)
        {
            var prosumer = MapFromBson(doc);
            if (prosumer is not null)
            {
                results.Add(prosumer);
            }
        }

        return results;
    }

    public async Task<Prosumer?> GetByNicAsync(
        string normalizedNic,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<BsonDocument>.Filter.And(
            ExcludeWebUsersFilter,
            Builders<BsonDocument>.Filter.Or(
                Builders<BsonDocument>.Filter.Eq("_id", normalizedNic),
                Builders<BsonDocument>.Filter.Eq("Nic", normalizedNic))
        );

        var doc = await _rawCollection
            .Find(filter)
            .FirstOrDefaultAsync(cancellationToken);

        return doc is null ? null : MapFromBson(doc);
    }

    public async Task<bool> ExistsByNicAsync(
        string normalizedNic,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Eq("_id", normalizedNic),
            Builders<BsonDocument>.Filter.Eq("Nic", normalizedNic)
        );

        var count = await _rawCollection
            .Find(filter)
            .Limit(1)
            .CountDocumentsAsync(cancellationToken);

        return count > 0;
    }

    public async Task<Prosumer> CreateAsync(
        Prosumer prosumer,
        CancellationToken cancellationToken = default)
    {
        // Use Member 4's canonical typed insertion (persisting _id: Nic, PhoneNumber, AccountStatus)
        await _prosumers.InsertOneAsync(prosumer, cancellationToken: cancellationToken);
        return prosumer;
    }

    public async Task<Prosumer?> UpdateDetailsAsync(
        string normalizedNic,
        string fullName,
        string email,
        string? phoneNumber,
        string? address,
        DateTime updatedAt,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<Prosumer>.Filter.Eq(p => p.Nic, normalizedNic);

        var update = Builders<Prosumer>.Update
            .Set(p => p.FullName, fullName)
            .Set(p => p.Email, email)
            .Set(p => p.PhoneNumber, phoneNumber)
            .Set(p => p.Address, address)
            .Set(p => p.UpdatedAt, updatedAt);

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
        ProsumerAccountStatus status,
        DateTime updatedAt,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<Prosumer>.Filter.Eq(p => p.Nic, normalizedNic);

        var update = Builders<Prosumer>.Update
            .Set(p => p.AccountStatus, status)
            .Set(p => p.UpdatedAt, updatedAt);

        return await _prosumers.FindOneAndUpdateAsync(
            filter,
            update,
            new FindOneAndUpdateOptions<Prosumer>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    private static Prosumer? MapFromBson(BsonDocument doc)
    {
        var nic = doc.Contains("Nic") && !doc["Nic"].IsBsonNull
            ? doc["Nic"].AsString
            : (doc["_id"].BsonType == BsonType.String ? doc["_id"].AsString : null);

        if (string.IsNullOrWhiteSpace(nic))
        {
            return null;
        }

        var fullName = doc.Contains("FullName") && !doc["FullName"].IsBsonNull
            ? doc["FullName"].AsString
            : string.Empty;

        var email = doc.Contains("Email") && !doc["Email"].IsBsonNull
            ? doc["Email"].AsString
            : string.Empty;

        // Canonical PhoneNumber with legacy Phone fallback
        string? phone = null;
        if (doc.Contains("PhoneNumber") && !doc["PhoneNumber"].IsBsonNull)
        {
            phone = doc["PhoneNumber"].AsString;
        }
        else if (doc.Contains("Phone") && !doc["Phone"].IsBsonNull)
        {
            phone = doc["Phone"].AsString;
        }

        var address = doc.Contains("Address") && !doc["Address"].IsBsonNull
            ? doc["Address"].AsString
            : null;

        // Canonical AccountStatus with legacy Status fallback
        var accountStatus = ProsumerAccountStatus.PendingActivation;
        if (doc.Contains("AccountStatus") && !doc["AccountStatus"].IsBsonNull)
        {
            if (doc["AccountStatus"].IsInt32)
            {
                accountStatus = (ProsumerAccountStatus)doc["AccountStatus"].AsInt32;
            }
            else if (Enum.TryParse<ProsumerAccountStatus>(doc["AccountStatus"].AsString, true, out var parsed))
            {
                accountStatus = parsed;
            }
        }
        else if (doc.Contains("Status") && !doc["Status"].IsBsonNull)
        {
            var statusStr = doc["Status"].AsString.Trim().ToLowerInvariant();
            accountStatus = statusStr switch
            {
                "active" => ProsumerAccountStatus.Active,
                "deactivated" => ProsumerAccountStatus.Deactivated,
                _ => ProsumerAccountStatus.PendingActivation
            };
        }

        var createdAt = doc.Contains("CreatedAt") && !doc["CreatedAt"].IsBsonNull
            ? doc["CreatedAt"].ToUniversalTime()
            : DateTime.UtcNow;

        var updatedAt = doc.Contains("UpdatedAt") && !doc["UpdatedAt"].IsBsonNull
            ? doc["UpdatedAt"].ToUniversalTime()
            : createdAt;

        return new Prosumer
        {
            Nic = nic,
            FullName = fullName,
            Email = email,
            PhoneNumber = phone,
            Address = address,
            AccountStatus = accountStatus,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }
}
