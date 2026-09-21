/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: MongoDbHealthController.cs
 * Purpose: Expose a separate development-only MongoDB connectivity probe.
 */

using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using SmartSolarMicrogrid.Api.Configuration;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/health/mongodb")]
public sealed class MongoDbHealthController : ControllerBase
{
    private const string CollectionName = "SolarStationInfo";
    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(3);
    private readonly IMongoDatabase _database;
    private readonly MongoDbSettings _settings;

    public MongoDbHealthController(
        IMongoDatabase database,
        IOptions<MongoDbSettings> settings)
    {
        _database = database;
        _settings = settings.Value;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        using var probeTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        probeTimeout.CancelAfter(ProbeTimeout);

        try
        {
            await _database.RunCommandAsync<BsonDocument>(
                new BsonDocument("ping", 1),
                cancellationToken: probeTimeout.Token);

            return Ok(new
            {
                Status = "Healthy",
                Database = _settings.DatabaseName,
                Collection = CollectionName
            });
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { Status = "Unavailable", Message = "MongoDB did not respond to the ping." });
        }
        catch (MongoException)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { Status = "Unavailable", Message = "MongoDB is unavailable." });
        }
    }
}
