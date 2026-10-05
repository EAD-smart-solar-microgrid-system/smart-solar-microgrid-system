using System.Threading;
using System.Threading.Tasks;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs.Prosumers;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Services;
using Xunit;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class ProsumerValidationTests
{
    // ==========================================
    // STEP 3 & STEP 14: Backend NIC Validation
    // ==========================================

    [Theory]
    [InlineData("123456789V", true)]
    [InlineData("123456789X", true)]
    [InlineData("123456789v", true)]
    [InlineData("123456789x", true)]
    [InlineData("200012345678", true)]
    [InlineData("  123456789V  ", true)]
    [InlineData("12345", false)]
    [InlineData("123456789A", false)]
    [InlineData("20001234567", false)]
    [InlineData("ABC123456789", false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData(null, false)]
    public void IsValidNic_ValidatesCorrectly(string? nic, bool expected)
    {
        var result = ProsumerService.IsValidNic(nic);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void NormalizeNic_TrimsAndConvertsToUppercase()
    {
        Assert.Equal("123456789V", ProsumerService.NormalizeNic(" 123456789v "));
        Assert.Equal("123456789X", ProsumerService.NormalizeNic("123456789x"));
        Assert.Equal("200012345678", ProsumerService.NormalizeNic(" 200012345678 "));
        Assert.Equal(string.Empty, ProsumerService.NormalizeNic("   "));
        Assert.Equal(string.Empty, ProsumerService.NormalizeNic(null));
    }

    // ==========================================
    // STEP 5 & STEP 14: Backend Full Name Validation
    // ==========================================

    [Theory]
    [InlineData("John Silva", true)]
    [InlineData("Anne-Marie Silva", true)]
    [InlineData("O'Connor", true)]
    [InlineData("A. Silva", true)]
    [InlineData("නිමල් පෙරේරා", true)]
    [InlineData("", false)]
    [InlineData(" ", false)]
    [InlineData("   ", false)]
    [InlineData(null, false)]
    [InlineData("a", false)]
    [InlineData("1", false)]
    [InlineData("ag6568", false)]
    [InlineData("John123", false)]
    [InlineData("123456", false)]
    [InlineData("@@@", false)]
    [InlineData("John@Silva", false)]
    public void IsValidFullName_ValidatesCorrectly(string? name, bool expected)
    {
        var result = ProsumerService.IsValidFullName(name);
        Assert.Equal(expected, result);
    }

    // ==========================================
    // STEP 12 & STEP 14: RegisterAsync Authoritative Validation
    // ==========================================

    [Fact]
    public async Task RegisterAsync_BlankNic_ReturnsValidationError()
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "   ",
            FullName = "Sunil Perera",
            Email = "sunil@solar.lk"
        };

        var result = await service.RegisterAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("Nic is required.", result.ErrorMessage);
    }

    [Fact]
    public async Task RegisterAsync_MalformedNic_ReturnsValidationError()
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "12345",
            FullName = "Sunil Perera",
            Email = "sunil@solar.lk"
        };

        var result = await service.RegisterAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("Enter a valid NIC number.", result.ErrorMessage);
    }

    [Fact]
    public async Task RegisterAsync_BlankFullName_ReturnsValidationError()
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "123456789V",
            FullName = "   ",
            Email = "sunil@solar.lk"
        };

        var result = await service.RegisterAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("FullName is required.", result.ErrorMessage);
    }

    [Fact]
    public async Task RegisterAsync_ShortFullName_ReturnsValidationError()
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "123456789V",
            FullName = "A",
            Email = "sunil@solar.lk"
        };

        var result = await service.RegisterAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("FullName must be at least 2 characters.", result.ErrorMessage);
    }

    [Theory]
    [InlineData("ag6568")]
    [InlineData("John123")]
    [InlineData("123456")]
    [InlineData("@@@")]
    [InlineData("John@Silva")]
    public async Task RegisterAsync_InvalidFullNameCharacters_ReturnsValidationError(string invalidName)
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "123456789V",
            FullName = invalidName,
            Email = "sunil@solar.lk"
        };

        var result = await service.RegisterAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("FullName contains invalid characters.", result.ErrorMessage);
    }

    [Theory]
    [InlineData("John Silva")]
    [InlineData("Anne-Marie Silva")]
    [InlineData("O'Connor")]
    [InlineData("A. Silva")]
    [InlineData("නිමල් පෙරේරා")]
    public async Task RegisterAsync_ValidFullName_Succeeds(string validName)
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "123456789V",
            FullName = validName,
            Email = "sunil@solar.lk"
        };

        var result = await service.RegisterAsync(request);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.Value);
        Assert.Equal(validName, result.Value!.FullName);
    }

    [Fact]
    public async Task RegisterAsync_InvalidEmail_ReturnsValidationError()
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "123456789V",
            FullName = "Sunil Perera",
            Email = "not-an-email"
        };

        var result = await service.RegisterAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("Email must be a valid email address.", result.ErrorMessage);
    }

    [Fact]
    public async Task RegisterAsync_InvalidPhone_ReturnsValidationError()
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "123456789V",
            FullName = "Sunil Perera",
            Email = "sunil@solar.lk",
            PhoneNumber = "invalid-phone"
        };

        var result = await service.RegisterAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("Phone number must be a valid Sri Lankan phone number (e.g. 07XXXXXXXX or +947XXXXXXXX).", result.ErrorMessage);
    }

    [Fact]
    public async Task RegisterAsync_AddressTooLong_ReturnsValidationError()
    {
        var service = CreateService();
        var request = new RegisterProsumerRequest
        {
            Nic = "123456789V",
            FullName = "Sunil Perera",
            Email = "sunil@solar.lk",
            Address = new string('A', 251)
        };

        var result = await service.RegisterAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("Address cannot exceed 250 characters.", result.ErrorMessage);
    }

    // ==========================================
    // STEP 12 & STEP 14: UpdateCurrentAsync Validation
    // ==========================================

    [Theory]
    [InlineData("a", "FullName must be at least 2 characters.")]
    [InlineData("ag6568", "FullName contains invalid characters.")]
    [InlineData("123456", "FullName contains invalid characters.")]
    [InlineData("@@@", "FullName contains invalid characters.")]
    public async Task UpdateCurrentAsync_InvalidFullName_ReturnsValidationError(string invalidName, string expectedError)
    {
        var service = CreateService(authenticatedNic: "123456789V");
        var request = new UpdateProsumerProfileRequest
        {
            FullName = invalidName,
            Email = "sunil@solar.lk"
        };

        var result = await service.UpdateCurrentAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal(expectedError, result.ErrorMessage);
    }

    [Theory]
    [InlineData("John Silva")]
    [InlineData("නිමල් පෙරේරා")]
    public async Task UpdateCurrentAsync_ValidFullName_Succeeds(string validName)
    {
        var existing = new Prosumer
        {
            Nic = "123456789V",
            FullName = "Original Name",
            Email = "original@solar.lk",
            AccountStatus = ProsumerAccountStatus.Active
        };
        var service = CreateService(authenticatedNic: "123456789V", existing: existing);
        var request = new UpdateProsumerProfileRequest
        {
            FullName = validName,
            Email = "sunil@solar.lk"
        };

        var result = await service.UpdateCurrentAsync(request);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.Value);
        Assert.Equal(validName, result.Value!.FullName);
    }

    [Fact]
    public async Task UpdateCurrentAsync_InvalidPhone_ReturnsValidationError()
    {
        var service = CreateService(authenticatedNic: "123456789V");
        var request = new UpdateProsumerProfileRequest
        {
            FullName = "Sunil Perera",
            Email = "sunil@solar.lk",
            PhoneNumber = "07123" // Invalid length
        };

        var result = await service.UpdateCurrentAsync(request);

        Assert.False(result.Succeeded);
        Assert.Equal(ProsumerServiceErrorType.Validation, result.ErrorType);
        Assert.Equal("Phone number must be a valid Sri Lankan phone number (e.g. 07XXXXXXXX or +947XXXXXXXX).", result.ErrorMessage);
    }

    private static ProsumerService CreateService(string? authenticatedNic = null, Prosumer? existing = null)
    {
        var repo = new FakeProsumerRepository(existing);
        var accessor = new FakeCurrentProsumerAccessor(authenticatedNic);
        return new ProsumerService(repo, accessor, new NoOpProsumerNotificationService());
    }

    private sealed class FakeProsumerRepository : IProsumerRepository
    {
        private readonly Prosumer? _existing;
        public FakeProsumerRepository(Prosumer? existing = null) => _existing = existing;

        public Task<Prosumer?> GetByNicAsync(string nic, CancellationToken cancellationToken = default)
            => Task.FromResult(_existing);

        public Task<Prosumer> CreateAsync(Prosumer prosumer, CancellationToken cancellationToken = default)
            => Task.FromResult(prosumer);

        public Task<Prosumer?> UpdateProfileAsync(Prosumer prosumer, CancellationToken cancellationToken = default)
            => Task.FromResult<Prosumer?>(prosumer);

        public Task<Prosumer?> UpdateStatusAsync(string nic, ProsumerAccountStatus status, DateTime updatedAt, CancellationToken cancellationToken = default)
            => Task.FromResult<Prosumer?>(null);
    }

    private sealed class FakeCurrentProsumerAccessor : ICurrentProsumerAccessor
    {
        private readonly string? _nic;
        public FakeCurrentProsumerAccessor(string? nic) => _nic = nic;

        public Task<string?> GetCurrentProsumerNicAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(_nic);
    }

    private sealed class NoOpProsumerNotificationService : IProsumerNotificationService
    {
        public Task SendRegistrationNotificationsAsync(Prosumer prosumer, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task SendActivationNotificationsAsync(Prosumer prosumer, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
