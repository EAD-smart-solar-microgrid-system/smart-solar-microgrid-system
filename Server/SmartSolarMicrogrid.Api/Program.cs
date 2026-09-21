/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Program.cs
 * Purpose: Configure dependency injection and the ASP.NET Core request pipeline.
 */

using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Services;

var environmentName = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
    ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

if (string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase))
{
    // Load local development values before ASP.NET Core builds IConfiguration.
    var directory = new DirectoryInfo(AppContext.BaseDirectory);

    while (directory is not null)
    {
        var envFilePath = Path.Combine(directory.FullName, ".env");

        if (File.Exists(envFilePath))
        {
            DotNetEnv.Env.NoClobber().Load(envFilePath);
            break;
        }

        directory = directory.Parent;
    }
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection(MongoDbSettings.SectionName));

builder.Services.AddSingleton<IMongoClient>(serviceProvider =>
{
    var settings = serviceProvider
        .GetRequiredService<Microsoft.Extensions.Options.IOptions<MongoDbSettings>>()
        .Value;

    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddSingleton<IMongoDatabase>(serviceProvider =>
{
    var settings = serviceProvider
        .GetRequiredService<Microsoft.Extensions.Options.IOptions<MongoDbSettings>>()
        .Value;
    var client = serviceProvider.GetRequiredService<IMongoClient>();

    return client.GetDatabase(settings.DatabaseName);
});

builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<IHealthService, HealthService>();
builder.Services.AddScoped<IStationRepository, StationRepository>();
builder.Services.AddScoped<IStationService, StationService>();
builder.Services.AddScoped<IProsumerRepository, ProsumerRepository>();
builder.Services.AddScoped<IProsumerService, ProsumerService>();
builder.Services.AddSingleton<IActiveReservationChecker, UnavailableActiveReservationChecker>();
builder.Services.AddSingleton<ICurrentProsumerAccessor, UnavailableCurrentProsumerAccessor>();

builder.Services.AddControllers();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = _ =>
    {
        // Return the API's small error shape for malformed request bodies.
        return new BadRequestObjectResult(new ErrorResponse("Request body is invalid."));
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentCorsPolicy", policy =>
    {
        var developmentOrigins = builder.Configuration
            .GetSection("Cors:DevelopmentOrigins")
            .Get<string[]>() ?? [];

        policy
            .WithOrigins(developmentOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        // Prevent unexpected database or server details from reaching API clients.
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(
            new ErrorResponse("An unexpected server error occurred."));
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("DevelopmentCorsPolicy");
app.UseAuthorization();
app.MapControllers();

try
{
    var database = app.Services.GetRequiredService<IMongoDatabase>();
    using var connectionCheckTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));

    await database.RunCommandAsync<BsonDocument>(
        new BsonDocument("ping", 1),
        cancellationToken: connectionCheckTimeout.Token);

    var databaseName = app.Services
        .GetRequiredService<Microsoft.Extensions.Options.IOptions<MongoDbSettings>>()
        .Value
        .DatabaseName;

    Console.WriteLine(
        $"MongoDB connected successfully. Database: {databaseName}.");
}
catch (OperationCanceledException)
{
    Console.Error.WriteLine(
        "MongoDB connection failed: the startup connection check timed out.");
}
catch (MongoException)
{
    Console.Error.WriteLine(
        "MongoDB connection failed. Check Atlas Network Access, credentials, cluster status, and URI encoding.");
}
catch (Exception)
{
    Console.Error.WriteLine(
        "MongoDB connection failed during startup verification.");
}

app.Run();
