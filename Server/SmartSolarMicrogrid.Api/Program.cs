/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Program.cs
 * Purpose: Configure dependency injection and the ASP.NET Core request pipeline.
 */

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Data;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Services;

var environmentName = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
    ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

if (string.IsNullOrEmpty(environmentName) || string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase))
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

builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection(EmailSettings.SectionName));
builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddSingleton<IMongoClient>(serviceProvider =>
{
    var settings = serviceProvider
        .GetRequiredService<Microsoft.Extensions.Options.IOptions<MongoDbSettings>>()
        .Value;

    if (string.IsNullOrWhiteSpace(settings.ConnectionString))
    {
        return new MongoClient();
    }

    var mongoClientSettings = MongoClientSettings.FromConnectionString(settings.ConnectionString);
    mongoClientSettings.SslSettings = new SslSettings
    {
        EnabledSslProtocols = System.Security.Authentication.SslProtocols.Tls12
    };

    return new MongoClient(mongoClientSettings);
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
builder.Services.AddScoped<IAdminProsumerRepository, AdminProsumerRepository>();
builder.Services.AddScoped<IAdminProsumerService, AdminProsumerService>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<ISlotAvailabilityChecker, EnergyBookingSlotAvailabilityChecker>();
builder.Services.AddScoped<IEnergyBookingSlotRepository, EnergyBookingSlotRepository>();
builder.Services.AddScoped<IEnergyBookingSlotService, EnergyBookingSlotService>();
builder.Services.AddScoped<IReservationMonitoringService, ReservationMonitoringService>();
builder.Services.AddScoped<IMember4DashboardService, Member4DashboardService>();
builder.Services.AddScoped<INearbyStationsService, NearbyStationsService>();
builder.Services.AddScoped<IActiveReservationChecker, ActiveReservationChecker>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentProsumerAccessor, HttpCurrentProsumerAccessor>();

builder.Services.AddScoped<IWebUserRepository, WebUserRepository>();
builder.Services.AddScoped<IWebUserService, WebUserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["Jwt:Key"] ?? "super_secret_key_for_smart_solar_microgrid_12345";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(key)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true
        };
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = _ =>
    {
        // Return the API's small error shape for malformed request bodies.
        return new BadRequestObjectResult(new ErrorResponse("Request body is invalid."));
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Smart Solar Microgrid Trading System API",
        Version = "v1",
        Description = "Authoritative C# Web API for Backoffice, Grid Operators, and Prosumers."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token obtained from /api/auth/login"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

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
app.UseAuthentication();
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

try
{
    using var seedScope = app.Services.CreateScope();
    var userRepo = seedScope.ServiceProvider.GetRequiredService<IWebUserRepository>();
    var existingUsers = await userRepo.GetAllAsync();

    if (!existingUsers.Any(u => u.Role == SmartSolarMicrogrid.Api.Common.Enums.WebUserRole.Backoffice))
    {
        var defaultAdmin = new SmartSolarMicrogrid.Api.Models.WebUser
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Username = "admin",
            PasswordHash = "admin123",
            Role = SmartSolarMicrogrid.Api.Common.Enums.WebUserRole.Backoffice,
            Status = SmartSolarMicrogrid.Api.Common.Enums.WebUserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await userRepo.CreateAsync(defaultAdmin);
        Console.WriteLine("Default Backoffice user seeded: admin / admin123");
    }

    if (!existingUsers.Any(u => u.Role == SmartSolarMicrogrid.Api.Common.Enums.WebUserRole.GridOperator))
    {
        var defaultOperator = new SmartSolarMicrogrid.Api.Models.WebUser
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Username = "operator",
            PasswordHash = "operator123",
            Role = SmartSolarMicrogrid.Api.Common.Enums.WebUserRole.GridOperator,
            Status = SmartSolarMicrogrid.Api.Common.Enums.WebUserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await userRepo.CreateAsync(defaultOperator);
        Console.WriteLine("Default GridOperator user seeded: operator / operator123");
    }
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Initial web user seed check skipped: {ex.Message}");
}

app.Run();
