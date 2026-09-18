/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Program.cs
 * Purpose: Configure dependency injection and the ASP.NET Core request pipeline.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.Services;

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

builder.Services.AddControllers();
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

app.Run();
