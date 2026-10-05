/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: WebUserRepository.cs
 * Purpose: Implementation for WebUser repository operations using MongoDB against UsersDetail collection.
 */
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class WebUserRepository : IWebUserRepository
{
    private readonly IMongoCollection<WebUser> _collection;

    // Filter to isolate WebUser documents from Prosumer records sharing the UsersDetail collection
    private static FilterDefinition<WebUser> WebUserFilter =>
        Builders<WebUser>.Filter.And(
            Builders<WebUser>.Filter.Exists("PasswordHash", true),
            Builders<WebUser>.Filter.Or(
                Builders<WebUser>.Filter.In("Role", new[] { "Backoffice", "GridOperator" }),
                Builders<WebUser>.Filter.In("Role", new[] { 0, 1 })
            )
        );

    public WebUserRepository(MongoDbContext dbContext)
    {
        // Obtain the shared UsersDetail collection for web user accounts
        _collection = dbContext.Database.GetCollection<WebUser>("UsersDetail");
    }

    public async Task<List<WebUser>> GetAllAsync()
    {
        // Retrieve all web users while excluding non-web user (prosumer) documents
        return await _collection.Find(WebUserFilter).ToListAsync();
    }

    public async Task<WebUser?> GetByIdAsync(string id)
    {
        // Validate ObjectId format to avoid format exceptions when querying
        if (!ObjectId.TryParse(id, out _))
        {
            return null;
        }

        // Fetch a web user matching the given identifier
        var filter = Builders<WebUser>.Filter.And(
            Builders<WebUser>.Filter.Eq(x => x.Id, id),
            WebUserFilter
        );
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<WebUser?> GetByUsernameAsync(string username)
    {
        if (string.IsNullOrWhiteSpace(username)) return null;

        // Usernames are treated case-insensitively at account creation and login.
        var filter = Builders<WebUser>.Filter.And(
            Builders<WebUser>.Filter.Regex(
                x => x.Username,
                new BsonRegularExpression(
                    $"^{System.Text.RegularExpressions.Regex.Escape(username.Trim())}$",
                    "i")),
            WebUserFilter
        );
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<WebUser?> GetByEmailAsync(string email)
    {
        // Fetch a web user matching the given email
        if (string.IsNullOrWhiteSpace(email)) return null;
        var filter = Builders<WebUser>.Filter.And(
            Builders<WebUser>.Filter.Regex(x => x.Email, new BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(email.Trim())}$", "i")),
            WebUserFilter
        );
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<WebUser?> GetByResetTokenAsync(string token)
    {
        // Fetch a web user matching the given password reset token
        if (string.IsNullOrWhiteSpace(token)) return null;
        var filter = Builders<WebUser>.Filter.And(
            Builders<WebUser>.Filter.Eq(x => x.PasswordResetToken, token),
            WebUserFilter
        );
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<WebUser?> GetByVerificationTokenAsync(string token)
    {
        // Fetch a web user matching the given email verification token
        if (string.IsNullOrWhiteSpace(token)) return null;
        var filter = Builders<WebUser>.Filter.And(
            Builders<WebUser>.Filter.Eq(x => x.EmailVerificationToken, token),
            WebUserFilter
        );
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task CreateAsync(WebUser user)
    {
        // Ensure new web user has a valid unique ObjectId identifier
        if (string.IsNullOrWhiteSpace(user.Id))
        {
            user.Id = ObjectId.GenerateNewId().ToString();
        }

        // Insert new web user document into the collection
        await _collection.InsertOneAsync(user);
    }

    public async Task UpdateAsync(string id, WebUser user)
    {
        // Update existing web user document by identifier
        user.Id = id;
        var filter = Builders<WebUser>.Filter.And(
            Builders<WebUser>.Filter.Eq(x => x.Id, id),
            WebUserFilter
        );
        await _collection.ReplaceOneAsync(filter, user);
    }
}
