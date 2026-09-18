/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: MongoDbContext.cs
 * Purpose: Expose the configured MongoDB database to repositories through dependency injection.
 */

using MongoDB.Driver;

namespace SmartSolarMicrogrid.Api.Data;

public sealed class MongoDbContext
{
    public MongoDbContext(IMongoDatabase database)
    {
        // Keep the MongoDB database abstraction available for future repositories.
        Database = database;
    }

    public IMongoDatabase Database { get; }
}
