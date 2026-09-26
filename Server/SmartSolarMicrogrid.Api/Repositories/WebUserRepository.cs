/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: WebUserRepository.cs
 * Purpose: Implementation for WebUser repository operations using MongoDB.
 */
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class WebUserRepository : IWebUserRepository
{
    private readonly IMongoCollection<WebUser> _collection;

    public WebUserRepository(MongoDbContext dbContext)
    {
        _collection = dbContext.Database.GetCollection<WebUser>("UsersDetail");
    }

    public async Task<List<WebUser>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    public async Task<WebUser?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<WebUser?> GetByUsernameAsync(string username) =>
        await _collection.Find(x => x.Username == username).FirstOrDefaultAsync();

    public async Task CreateAsync(WebUser user) =>
        await _collection.InsertOneAsync(user);

    public async Task UpdateAsync(string id, WebUser user) =>
        await _collection.ReplaceOneAsync(x => x.Id == id, user);
}
