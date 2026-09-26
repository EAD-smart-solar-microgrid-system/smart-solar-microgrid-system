/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: EnergyBookingSlotRepository.cs
 * Purpose: Execute MongoDB persistence operations for energy booking slots.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public sealed class EnergyBookingSlotRepository : IEnergyBookingSlotRepository
{
    private const string CollectionName = "EnergyBookingSlots";
    private readonly IMongoCollection<EnergyBookingSlot> _slots;

    public EnergyBookingSlotRepository(MongoDbContext databaseContext)
    {
        // Bind this repository to the agreed MongoDB collection through the existing context.
        _slots = databaseContext.Database.GetCollection<EnergyBookingSlot>(CollectionName);
    }

    public async Task<IReadOnlyList<EnergyBookingSlot>> GetByStationIdAsync(
        string stationId,
        CancellationToken cancellationToken = default)
    {
        // Retrieve every slot for one station without applying application business rules.
        return await _slots
            .Find(slot => slot.StationId == stationId)
            .SortBy(slot => slot.SlotStartUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<EnergyBookingSlot?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        // Retrieve one slot for internal service operations.
        return await _slots
            .Find(slot => slot.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<EnergyBookingSlot> CreateAsync(
        EnergyBookingSlot slot,
        CancellationToken cancellationToken = default)
    {
        // Insert the server-prepared slot document into MongoDB.
        await _slots.InsertOneAsync(slot, cancellationToken: cancellationToken);

        return slot;
    }

    public async Task<EnergyBookingSlot?> UpdateAsync(
        EnergyBookingSlot slot,
        CancellationToken cancellationToken = default)
    {
        // Replace only the already-loaded slot document prepared by the service.
        return await _slots.FindOneAndReplaceAsync(
            existingSlot => existingSlot.Id == slot.Id,
            slot,
            new FindOneAndReplaceOptions<EnergyBookingSlot>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<EnergyBookingSlot?> UpdateAvailabilityAsync(
        string id,
        bool isAvailable,
        DateTime updatedAt,
        CancellationToken cancellationToken = default)
    {
        // Update only availability and its server-controlled timestamp.
        var update = Builders<EnergyBookingSlot>.Update
            .Set(slot => slot.IsAvailable, isAvailable)
            .Set(slot => slot.UpdatedAt, updatedAt);

        return await _slots.FindOneAndUpdateAsync(
            slot => slot.Id == id,
            update,
            new FindOneAndUpdateOptions<EnergyBookingSlot>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<bool> DeleteAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        // Remove one energy booking slot document by id.
        var result = await _slots.DeleteOneAsync(slot => slot.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
