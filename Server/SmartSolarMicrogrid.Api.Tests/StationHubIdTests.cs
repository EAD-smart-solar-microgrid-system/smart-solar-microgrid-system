using System.Text.RegularExpressions;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Utilities;
using SmartSolarMicrogrid.Api.DTOs.Stations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Services;
using Xunit;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class StationHubIdTests
{
    [Fact]
    public void HubIdGenerator_GeneratesValidFormat()
    {
        var regex = new Regex(@"^HUB-[A-Z0-9]{8}$");
        var generatedIds = new HashSet<string>();

        for (var i = 0; i < 100; i++)
        {
            var hubId = HubIdGenerator.Generate();
            Assert.Matches(regex, hubId);
            Assert.True(HubIdGenerator.IsValid(hubId));
            Assert.DoesNotContain(hubId, generatedIds);
            generatedIds.Add(hubId);
        }
    }

    [Theory]
    [InlineData("HUB-7F3A91C2", true)]
    [InlineData("HUB-00000000", true)]
    [InlineData("HUB-ABCDEF12", true)]
    [InlineData("HUB-7f3a91c2", false)] // Lowercase rejected
    [InlineData("HUB-1234567", false)]   // Too short (7 chars)
    [InlineData("HUB-123456789", false)] // Too long (9 chars)
    [InlineData("hub-7F3A91C2", false)] // Lowercase prefix
    [InlineData("STA-7F3A91C2", false)] // Wrong prefix
    [InlineData("68df912d4a7cdaee91c2b723", false)] // Mongo ObjectId rejected
    [InlineData("", false)]
    [InlineData(null, false)]
    public void HubIdGenerator_ValidatesProperly(string? candidate, bool expected)
    {
        Assert.Equal(expected, HubIdGenerator.IsValid(candidate));
    }

    [Fact]
    public async Task CreateAsync_GeneratesHubIdAndPreservesInternalId()
    {
        var repo = new InMemoryStationRepository();
        var checker = new FakeReservationChecker();
        var service = new StationService(repo, checker);

        var request = CreateSampleRequest("Station Alpha");
        var result = await service.CreateAsync(request);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.Value);
        Assert.Matches(@"^HUB-[A-Z0-9]{8}$", result.Value.HubId);

        // Verify underlying persistence has both internal Id and generated HubId
        var stored = repo.Stations.Single();
        Assert.False(string.IsNullOrWhiteSpace(stored.Id));
        Assert.Equal(result.Value.HubId, stored.HubId);
    }

    [Fact]
    public async Task GetByHubIdAsync_ReturnsExpectedStation()
    {
        var repo = new InMemoryStationRepository();
        var checker = new FakeReservationChecker();
        var service = new StationService(repo, checker);

        var created = (await service.CreateAsync(CreateSampleRequest("Station Beta"))).Value!;

        var result = await service.GetByHubIdAsync(created.HubId);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.Value);
        Assert.Equal(created.HubId, result.Value.HubId);
        Assert.Equal("Station Beta", result.Value.StationName);
    }

    [Fact]
    public async Task GetByHubIdAsync_UnknownHubId_ReturnsNotFound()
    {
        var repo = new InMemoryStationRepository();
        var checker = new FakeReservationChecker();
        var service = new StationService(repo, checker);

        var result = await service.GetByHubIdAsync("HUB-AAAAAAAA");

        Assert.False(result.Succeeded);
        Assert.Equal(StationServiceErrorType.NotFound, result.ErrorType);
    }

    [Fact]
    public async Task GetByHubIdAsync_InvalidFormat_ReturnsValidationError()
    {
        var repo = new InMemoryStationRepository();
        var checker = new FakeReservationChecker();
        var service = new StationService(repo, checker);

        var result = await service.GetByHubIdAsync("68df912d4a7cdaee91c2b723");

        Assert.False(result.Succeeded);
        Assert.Equal(StationServiceErrorType.Validation, result.ErrorType);
    }

    [Fact]
    public async Task UpdateDetailsAsync_UsingHubId_SucceedsAndRetainsHubId()
    {
        var repo = new InMemoryStationRepository();
        var checker = new FakeReservationChecker();
        var service = new StationService(repo, checker);

        var created = (await service.CreateAsync(CreateSampleRequest("Station Gamma"))).Value!;
        var originalHubId = created.HubId;

        var updateRequest = new UpdateStationRequest
        {
            StationName = "Station Gamma Updated",
            Latitude = 7.1234,
            Longitude = 80.5678,
            CapacityKwPerHour = 250,
            BatteryStorageSlotCapacity = 20,
            OperatingSchedule =
            [
                new StationScheduleDto { DayOfWeek = "Monday", OpenTime = "07:00", CloseTime = "21:00" }
            ]
        };

        var updateResult = await service.UpdateDetailsAsync(originalHubId, updateRequest);

        Assert.True(updateResult.Succeeded);
        Assert.NotNull(updateResult.Value);
        Assert.Equal(originalHubId, updateResult.Value.HubId);
        Assert.Equal("Station Gamma Updated", updateResult.Value.StationName);
        Assert.Equal(250, updateResult.Value.CapacityKwPerHour);
    }

    [Fact]
    public async Task UpdateDetailsAsync_AttemptingToMutateHubId_ReturnsValidationFailure()
    {
        var repo = new InMemoryStationRepository();
        var checker = new FakeReservationChecker();
        var service = new StationService(repo, checker);

        var created = (await service.CreateAsync(CreateSampleRequest("Station Delta"))).Value!;

        var updateRequest = new UpdateStationRequest
        {
            HubId = "HUB-DIFFERNT",
            StationName = "Station Delta",
            Latitude = 6.0,
            Longitude = 80.0,
            CapacityKwPerHour = 100,
            BatteryStorageSlotCapacity = 10,
            OperatingSchedule =
            [
                new StationScheduleDto { DayOfWeek = "Monday", OpenTime = "08:00", CloseTime = "18:00" }
            ]
        };

        var updateResult = await service.UpdateDetailsAsync(created.HubId, updateRequest);

        Assert.False(updateResult.Succeeded);
        Assert.Equal(StationServiceErrorType.Validation, updateResult.ErrorType);
        Assert.Contains("immutable", updateResult.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ChangeStatusAsync_UsingHubId_SucceedsAndRetainsHubId()
    {
        var repo = new InMemoryStationRepository();
        var checker = new FakeReservationChecker { HasActive = false };
        var service = new StationService(repo, checker);

        var created = (await service.CreateAsync(CreateSampleRequest("Station Epsilon"))).Value!;
        var originalHubId = created.HubId;

        var statusResult = await service.ChangeStatusAsync(
            originalHubId,
            new UpdateStationStatusRequest { Status = "Inactive" });

        Assert.True(statusResult.Succeeded);
        Assert.NotNull(statusResult.Value);
        Assert.Equal(originalHubId, statusResult.Value.HubId);
        Assert.Equal("Inactive", statusResult.Value.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_DeactivationWithActiveReservations_ReturnsConflict()
    {
        var repo = new InMemoryStationRepository();
        var checker = new FakeReservationChecker { HasActive = true };
        var service = new StationService(repo, checker);

        var created = (await service.CreateAsync(CreateSampleRequest("Station Zeta"))).Value!;

        var statusResult = await service.ChangeStatusAsync(
            created.HubId,
            new UpdateStationStatusRequest { Status = "Inactive" });

        Assert.False(statusResult.Succeeded);
        Assert.Equal(StationServiceErrorType.Conflict, statusResult.ErrorType);
        Assert.Contains("active energy reservations", statusResult.ErrorMessage, StringComparison.OrdinalIgnoreCase);

        // Verify checked reservation with the internal database identifier
        var storedStation = repo.Stations.Single(s => s.HubId == created.HubId);
        Assert.Equal(storedStation.Id, checker.LastCheckedStationId);
    }

    [Fact]
    public void StationResponse_ExposesHubId_AndNotObjectId()
    {
        var properties = typeof(StationResponse).GetProperties();

        Assert.Contains(properties, p => p.Name == "HubId");
        Assert.DoesNotContain(properties, p => p.Name == "Id");
    }

    private static CreateStationRequest CreateSampleRequest(string name) => new()
    {
        StationName = name,
        Latitude = 6.8400,
        Longitude = 80.0000,
        CapacityKwPerHour = 100,
        BatteryStorageSlotCapacity = 10,
        OperatingSchedule =
        [
            new StationScheduleDto { DayOfWeek = "Monday", OpenTime = "08:00", CloseTime = "18:00" },
            new StationScheduleDto { DayOfWeek = "Tuesday", OpenTime = "08:00", CloseTime = "18:00" }
        ]
    };

    private sealed class InMemoryStationRepository : IStationRepository
    {
        public List<SolarStation> Stations { get; } = [];

        public Task<IReadOnlyList<SolarStation>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<SolarStation>>(Stations.ToList());
        }

        public Task<SolarStation?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
        {
            var station = Stations.FirstOrDefault(s => s.Id == id);
            return Task.FromResult(station);
        }

        public Task<SolarStation?> GetByHubIdAsync(string hubId, CancellationToken cancellationToken = default)
        {
            var station = Stations.FirstOrDefault(s => s.HubId == hubId);
            return Task.FromResult(station);
        }

        public Task<SolarStation> CreateAsync(SolarStation station, CancellationToken cancellationToken = default)
        {
            Stations.Add(station);
            return Task.FromResult(station);
        }

        public Task<SolarStation?> UpdateDetailsAsync(SolarStation station, CancellationToken cancellationToken = default)
        {
            var index = Stations.FindIndex(s => s.Id == station.Id);
            if (index == -1) return Task.FromResult<SolarStation?>(null);
            Stations[index] = station;
            return Task.FromResult<SolarStation?>(station);
        }

        public Task<SolarStation?> UpdateStatusAsync(string id, StationStatus status, DateTime updatedAt, CancellationToken cancellationToken = default)
        {
            var station = Stations.FirstOrDefault(s => s.Id == id);
            if (station is null) return Task.FromResult<SolarStation?>(null);
            station.Status = status;
            station.UpdatedAt = updatedAt;
            return Task.FromResult<SolarStation?>(station);
        }

        public Task EnsureIndexesAndBackfillAsync(CancellationToken cancellationToken = default)
        {
            foreach (var station in Stations.Where(s => string.IsNullOrWhiteSpace(s.HubId)))
            {
                station.HubId = HubIdGenerator.Generate();
            }
            return Task.CompletedTask;
        }
    }

    private sealed class FakeReservationChecker : IActiveReservationChecker
    {
        public bool? HasActive { get; set; } = false;
        public string? LastCheckedStationId { get; private set; }

        public Task<bool?> HasActiveReservationsAsync(string stationId, CancellationToken cancellationToken = default)
        {
            LastCheckedStationId = stationId;
            return Task.FromResult(HasActive);
        }
    }
}
