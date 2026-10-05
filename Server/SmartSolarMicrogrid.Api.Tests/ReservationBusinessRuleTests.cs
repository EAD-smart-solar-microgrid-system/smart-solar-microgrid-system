/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationBusinessRuleTests.cs
 * Purpose: Member 2 reservation and QR business rule unit tests.
 */

using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Reservations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Services;
using Xunit;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class ReservationBusinessRuleTests
{
    private static readonly DateTime FixedNow = new(2026, 10, 5, 12, 0, 0, DateTimeKind.Utc);
    private const string DefaultNic = "123456789V";
    private const string DefaultStationId = "60f1b2b3c4d5e6f7a8b9c0d1";
    private const string DefaultSlotId = "SLOT-01";

    private readonly FakeReservationRepository _reservationRepo = new();
    private readonly FakeStationRepository _stationRepo = new();
    private readonly FakeProsumerRepository _prosumerRepo = new();
    private readonly FakeSlotAvailabilityChecker _slotChecker = new();
    private readonly FakeProsumerAccessor _prosumerAccessor = new(DefaultNic);
    private readonly IHttpContextAccessor _httpContextAccessor = CreateHttpContextAccessor(DefaultNic, "Prosumer");

    private ReservationService CreateService(DateTime? now = null)
    {
        // Build a reservation service wired to test doubles and optional clock.
        var clock = now ?? FixedNow;
        return new ReservationService(
            _reservationRepo,
            _stationRepo,
            _prosumerRepo,
            _slotChecker,
            _prosumerAccessor,
            _httpContextAccessor,
            () => clock);
    }

    private TransactionService CreateTransactionService()
    {
        // Build a transaction service backed by the test reservation repository.
        return new TransactionService(_reservationRepo);
    }

    private EnergyReservation SeedReservation(
        string id,
        ReservationStatus status,
        DateTime reservationDateTime,
        DateTime? createdAt = null,
        string? qrToken = null)
    {
        // Insert a reservation fixture into the in-memory repository.
        var res = new EnergyReservation
        {
            Id = id,
            ProsumerNic = DefaultNic,
            StationId = DefaultStationId,
            SlotId = DefaultSlotId,
            ReservationDateTime = reservationDateTime,
            ReservationType = ReservationType.Charging,
            Status = status,
            CreatedAt = createdAt ?? FixedNow.AddDays(-1),
            UpdatedAt = createdAt ?? FixedNow.AddDays(-1),
            QrToken = qrToken,
            QrIssuedAt = qrToken != null ? FixedNow.AddHours(-1) : null,
            QrExpiresAt = qrToken != null ? reservationDateTime.AddHours(4) : null
        };
        _reservationRepo.Reservations.Add(res);
        return res;
    }

    // ==========================================
    // TEST 1: Pending + >12h edit -> success, remains Pending
    // ==========================================
    [Fact]
    public async Task Test01_Pending_GreaterThan12hEdit_Success_RemainsPending()
    {
        // Update a pending reservation more than 12 hours ahead and expect it to remain pending.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c001";
        SeedReservation(id, ReservationStatus.Pending, FixedNow.AddHours(24));

        var updateReq = new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(30),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        };

        var result = await service.UpdateAsync(id, updateReq);

        Assert.True(result.Succeeded);
        Assert.Equal("Pending", result.Value!.Status);
        var stored = await _reservationRepo.GetByIdAsync(id);
        Assert.Equal(ReservationStatus.Pending, stored!.Status);
    }

    // ==========================================
    // TEST 2: Approved + >12h edit -> success, becomes Pending
    // ==========================================
    [Fact]
    public async Task Test02_Approved_GreaterThan12hEdit_Success_BecomesPending()
    {
        // Update an approved reservation more than 12 hours ahead and expect it to become pending.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c002";
        SeedReservation(id, ReservationStatus.Approved, FixedNow.AddHours(24), qrToken: "sample-qr-token-123");

        var updateReq = new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(36),
            SlotId = DefaultSlotId,
            ReservationType = "DropOff"
        };

        var result = await service.UpdateAsync(id, updateReq);

        Assert.True(result.Succeeded);
        Assert.Equal("Pending", result.Value!.Status);
        var stored = await _reservationRepo.GetByIdAsync(id);
        Assert.Equal(ReservationStatus.Pending, stored!.Status);
    }

    // ==========================================
    // TEST 3: Approved edit clears approval metadata
    // ==========================================
    [Fact]
    public async Task Test03_ApprovedEdit_ClearsApprovalMetadataAndQr()
    {
        // Update an approved reservation and expect approval metadata and QR fields to be cleared.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c003";
        SeedReservation(id, ReservationStatus.Approved, FixedNow.AddHours(20), qrToken: "old-qr-token-xyz");

        var updateReq = new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(25),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        };

        var result = await service.UpdateAsync(id, updateReq);

        Assert.True(result.Succeeded);
        Assert.Null(result.Value!.QrToken);

        var stored = await _reservationRepo.GetByIdAsync(id);
        Assert.Equal(ReservationStatus.Pending, stored!.Status);
        Assert.Null(stored.QrToken);
        Assert.Null(stored.QrIssuedAt);
        Assert.Null(stored.QrExpiresAt);
    }

    // ==========================================
    // TEST 4: Approved edit invalidates old QR
    // ==========================================
    [Fact]
    public async Task Test04_ApprovedEdit_InvalidatesOldQr_CannotVerify()
    {
        // Update an approved reservation and expect the previously issued QR token to fail verification.
        var service = CreateService();
        var txService = CreateTransactionService();
        var id = "60f1b2b3c4d5e6f7a8b9c004";
        var oldQr = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        SeedReservation(id, ReservationStatus.Approved, FixedNow.AddHours(24), qrToken: oldQr);

        // Before edit: old QR verifies successfully
        var preCheck = await txService.VerifyQrAsync(new VerifyQrRequest(oldQr));
        Assert.True(preCheck.Success);

        // Prosumer modifies reservation
        var updateReq = new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(30),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        };
        var updateResult = await service.UpdateAsync(id, updateReq);
        Assert.True(updateResult.Succeeded);

        // After edit: old QR fails verification
        var postCheck = await txService.VerifyQrAsync(new VerifyQrRequest(oldQr));
        Assert.False(postCheck.Success);
    }

    // ==========================================
    // TEST 5: Modified Pending reservation requests QR -> rejected
    // ==========================================
    [Fact]
    public async Task Test05_ModifiedPendingReservation_RequestsQr_Rejected()
    {
        // Edit an approved reservation and expect QR generation to be rejected while pending re-approval.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c005";
        SeedReservation(id, ReservationStatus.Approved, FixedNow.AddHours(24), qrToken: "old-qr-555");

        var updateReq = new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(30),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        };
        await service.UpdateAsync(id, updateReq);

        var qrResult = await service.GenerateQrTokenAsync(id);

        Assert.False(qrResult.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, qrResult.ErrorType);
        Assert.Contains("pending administrative approval", qrResult.ErrorMessage);
    }

    // ==========================================
    // TEST 6: Grid Operator re-approves modified reservation -> Approved
    // ==========================================
    [Fact]
    public async Task Test06_GridOperator_ReApprovesModifiedReservation_Approved()
    {
        // Re-approve a modified pending reservation and expect approved status.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c006";
        SeedReservation(id, ReservationStatus.Approved, FixedNow.AddHours(24), qrToken: "old-qr-666");

        var updateReq = new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(30),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        };
        await service.UpdateAsync(id, updateReq);

        var approveResult = await service.ApproveAsync(id);

        Assert.True(approveResult.Succeeded);
        Assert.Equal("Approved", approveResult.Value!.Status);
        var stored = await _reservationRepo.GetByIdAsync(id);
        Assert.Equal(ReservationStatus.Approved, stored!.Status);
    }

    // ==========================================
    // TEST 7: New QR after re-approval -> allowed
    // ==========================================
    [Fact]
    public async Task Test07_NewQrAfterReApproval_Allowed()
    {
        // Re-approve after edit, generate a new QR token, and verify it succeeds while the old token differs.
        var service = CreateService();
        var txService = CreateTransactionService();
        var id = "60f1b2b3c4d5e6f7a8b9c007";
        var oldQr = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abc007";
        SeedReservation(id, ReservationStatus.Approved, FixedNow.AddHours(24), qrToken: oldQr);

        // Edit
        await service.UpdateAsync(id, new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(30),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        });

        // Re-approve
        await service.ApproveAsync(id);

        // Generate new QR
        var newQrResult = await service.GenerateQrTokenAsync(id);
        Assert.True(newQrResult.Succeeded);
        Assert.NotNull(newQrResult.Value!.QrToken);
        Assert.NotEqual(oldQr, newQrResult.Value.QrToken);

        // New QR verifies successfully
        var verifyResult = await txService.VerifyQrAsync(new VerifyQrRequest(newQrResult.Value.QrToken));
        Assert.True(verifyResult.Success);
    }

    // ==========================================
    // TEST 8: Modify >12h -> allowed
    // ==========================================
    [Fact]
    public async Task Test08_Modify_GreaterThan12h_Allowed()
    {
        // Update a reservation with more than 12 hours remaining and expect success.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c008";
        SeedReservation(id, ReservationStatus.Pending, FixedNow.AddHours(14));

        var result = await service.UpdateAsync(id, new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(20),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        });

        Assert.True(result.Succeeded);
    }

    // ==========================================
    // TEST 9: Modify exactly 12h -> allowed
    // ==========================================
    [Fact]
    public async Task Test09_Modify_Exactly12h_Allowed()
    {
        // Update a reservation at exactly 12 hours remaining and expect success.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c009";
        SeedReservation(id, ReservationStatus.Pending, FixedNow.AddHours(12));

        var result = await service.UpdateAsync(id, new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(20),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        });

        Assert.True(result.Succeeded);
    }

    // ==========================================
    // TEST 10: Modify just below 12h -> rejected
    // ==========================================
    [Fact]
    public async Task Test10_Modify_JustBelow12h_Rejected()
    {
        // Update a reservation just under 12 hours remaining and expect validation failure.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c010";
        // 11 hours 59 minutes (just below 12 hours)
        SeedReservation(id, ReservationStatus.Pending, FixedNow.AddHours(12).AddMinutes(-1));

        var result = await service.UpdateAsync(id, new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(20),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        });

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("at least 12 hours advance notice", result.ErrorMessage);
    }

    // ==========================================
    // TEST 11: Created with <12h notice, then modified with <12h remaining -> rejected (NO short-notice exception)
    // ==========================================
    [Fact]
    public async Task Test11_CreatedWithShortNotice_ModifiedUnder12h_Rejected_NoException()
    {
        // Update a short-notice reservation with under 12 hours left and expect rejection without exception.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c011";
        // Created at FixedNow - 2h for a slot at FixedNow + 4h (window 6h < 12h)
        // At FixedNow, remaining is 4h (<12h)
        SeedReservation(
            id,
            ReservationStatus.Pending,
            reservationDateTime: FixedNow.AddHours(4),
            createdAt: FixedNow.AddHours(-2));

        var result = await service.UpdateAsync(id, new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(24),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        });

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("at least 12 hours advance notice", result.ErrorMessage);
    }

    // ==========================================
    // TEST 12: Recently created reservation with <12h remaining -> rejected (NO grace-period exception)
    // ==========================================
    [Fact]
    public async Task Test12_RecentlyCreated_Under12hRemaining_Rejected_NoGracePeriodException()
    {
        // Update a recently created reservation with under 12 hours remaining and expect rejection.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c012";
        // Created 10 minutes ago, slot is 6 hours away
        SeedReservation(
            id,
            ReservationStatus.Pending,
            reservationDateTime: FixedNow.AddHours(6),
            createdAt: FixedNow.AddMinutes(-10));

        var result = await service.UpdateAsync(id, new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(24),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        });

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("at least 12 hours advance notice", result.ErrorMessage);
    }

    // ==========================================
    // TEST 13: Cancel >12h -> allowed
    // ==========================================
    [Fact]
    public async Task Test13_Cancel_GreaterThan12h_Allowed()
    {
        // Cancel a reservation with more than 12 hours remaining and expect success.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c013";
        SeedReservation(id, ReservationStatus.Pending, FixedNow.AddHours(14));

        var result = await service.CancelAsync(id, new CancelReservationRequest { Reason = "User request" });

        Assert.True(result.Succeeded);
        Assert.Equal("Cancelled", result.Value!.Status);
    }

    // ==========================================
    // TEST 14: Cancel exactly 12h -> allowed
    // ==========================================
    [Fact]
    public async Task Test14_Cancel_Exactly12h_Allowed()
    {
        // Cancel a reservation at exactly 12 hours remaining and expect success.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c014";
        SeedReservation(id, ReservationStatus.Pending, FixedNow.AddHours(12));

        var result = await service.CancelAsync(id, new CancelReservationRequest { Reason = "User request" });

        Assert.True(result.Succeeded);
        Assert.Equal("Cancelled", result.Value!.Status);
    }

    // ==========================================
    // TEST 15: Cancel just below 12h -> rejected
    // ==========================================
    [Fact]
    public async Task Test15_Cancel_JustBelow12h_Rejected()
    {
        // Cancel a reservation just under 12 hours remaining and expect validation failure.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c015";
        SeedReservation(id, ReservationStatus.Pending, FixedNow.AddHours(12).AddMinutes(-1));

        var result = await service.CancelAsync(id, new CancelReservationRequest { Reason = "User request" });

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("at least 12 hours advance notice", result.ErrorMessage);
    }

    // ==========================================
    // TEST 16: Approved cancellation >=12h -> Cancelled and old QR invalid
    // ==========================================
    [Fact]
    public async Task Test16_ApprovedCancellation_GreaterOrEqual12h_CancelledAndOldQrInvalid()
    {
        // Cancel an approved reservation and expect cancellation plus invalidation of the existing QR token.
        var service = CreateService();
        var txService = CreateTransactionService();
        var id = "60f1b2b3c4d5e6f7a8b9c016";
        var oldQr = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abc016";
        SeedReservation(id, ReservationStatus.Approved, FixedNow.AddHours(24), qrToken: oldQr);

        // Pre-cancel verification succeeds
        var preCheck = await txService.VerifyQrAsync(new VerifyQrRequest(oldQr));
        Assert.True(preCheck.Success);

        // Cancel
        var cancelResult = await service.CancelAsync(id, new CancelReservationRequest { Reason = "Change of plans" });
        Assert.True(cancelResult.Succeeded);
        Assert.Equal("Cancelled", cancelResult.Value!.Status);

        // Post-cancel verification fails
        var postCheck = await txService.VerifyQrAsync(new VerifyQrRequest(oldQr));
        Assert.False(postCheck.Success);
    }

    // ==========================================
    // TEST 17: Cancelled modification -> rejected
    // ==========================================
    [Fact]
    public async Task Test17_CancelledModification_Rejected()
    {
        // Attempt to modify a cancelled reservation and expect validation failure.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c017";
        SeedReservation(id, ReservationStatus.Cancelled, FixedNow.AddHours(24));

        var result = await service.UpdateAsync(id, new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(30),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        });

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("Cancelled reservations cannot be modified", result.ErrorMessage);
    }

    // ==========================================
    // TEST 18: Completed modification -> rejected
    // ==========================================
    [Fact]
    public async Task Test18_CompletedModification_Rejected()
    {
        // Attempt to modify a completed reservation and expect validation failure.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c018";
        SeedReservation(id, ReservationStatus.Completed, FixedNow.AddHours(24));

        var result = await service.UpdateAsync(id, new UpdateReservationRequest
        {
            ReservationDateTime = FixedNow.AddHours(30),
            SlotId = DefaultSlotId,
            ReservationType = "Charging"
        });

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("Completed reservations cannot be modified", result.ErrorMessage);
    }

    // ==========================================
    // TEST 19: Completed cancellation -> rejected
    // ==========================================
    [Fact]
    public async Task Test19_CompletedCancellation_Rejected()
    {
        // Attempt to cancel a completed reservation and expect validation failure.
        var service = CreateService();
        var id = "60f1b2b3c4d5e6f7a8b9c019";
        SeedReservation(id, ReservationStatus.Completed, FixedNow.AddHours(24));

        var result = await service.CancelAsync(id, new CancelReservationRequest { Reason = "Try cancel completed" });

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("Completed reservations cannot be cancelled", result.ErrorMessage);
    }

    // ==========================================
    // TEST 20: 7-day creation rule: past -> rejected
    // ==========================================
    [Fact]
    public async Task Test20_Create_PastDateTime_Rejected()
    {
        // Attempt to create a reservation in the past and expect validation failure.
        var service = CreateService();
        var req = new CreateReservationRequest
        {
            ProsumerNic = DefaultNic,
            StationId = DefaultStationId,
            SlotId = DefaultSlotId,
            ReservationDateTime = FixedNow.AddMinutes(-5),
            ReservationType = "Charging"
        };

        var result = await service.CreateAsync(req);

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("must be in the future", result.ErrorMessage);
    }

    // ==========================================
    // TEST 21: 7-day creation rule: inside 7 days -> allowed
    // ==========================================
    [Fact]
    public async Task Test21_Create_Inside7Days_Allowed()
    {
        // Create a reservation within the 7-day window and expect success.
        var service = CreateService();
        var req = new CreateReservationRequest
        {
            ProsumerNic = DefaultNic,
            StationId = DefaultStationId,
            SlotId = DefaultSlotId,
            ReservationDateTime = FixedNow.AddDays(3),
            ReservationType = "Charging"
        };

        var result = await service.CreateAsync(req);

        Assert.True(result.Succeeded);
        Assert.Equal("Pending", result.Value!.Status);
    }

    // ==========================================
    // TEST 22: 7-day creation rule: exact 7-day boundary -> allowed
    // ==========================================
    [Fact]
    public async Task Test22_Create_Exact7DayBoundary_Allowed()
    {
        // Create a reservation on the exact 7-day boundary and expect success.
        var service = CreateService();
        var req = new CreateReservationRequest
        {
            ProsumerNic = DefaultNic,
            StationId = DefaultStationId,
            SlotId = DefaultSlotId,
            ReservationDateTime = FixedNow.AddDays(7),
            ReservationType = "Charging"
        };

        var result = await service.CreateAsync(req);

        Assert.True(result.Succeeded);
        Assert.Equal("Pending", result.Value!.Status);
    }

    // ==========================================
    // TEST 23: 7-day creation rule: over 7 days -> rejected
    // ==========================================
    [Fact]
    public async Task Test23_Create_Over7Days_Rejected()
    {
        // Attempt to create a reservation beyond the 7-day window and expect validation failure.
        var service = CreateService();
        var req = new CreateReservationRequest
        {
            ProsumerNic = DefaultNic,
            StationId = DefaultStationId,
            SlotId = DefaultSlotId,
            ReservationDateTime = FixedNow.AddDays(7).AddMinutes(1),
            ReservationType = "Charging"
        };

        var result = await service.CreateAsync(req);

        Assert.False(result.Succeeded);
        Assert.Equal(ReservationServiceErrorType.Validation, result.ErrorType);
        Assert.Contains("rolling 7-day forward window", result.ErrorMessage);
    }

    // ==========================================
    // Test Doubles / Mocks
    // ==========================================
    private static IHttpContextAccessor CreateHttpContextAccessor(string nic, string role)
    {
        // Create an HTTP context accessor with the given NIC and role claims.
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, nic),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        return new HttpContextAccessor { HttpContext = httpContext };
    }

    private sealed class FakeReservationRepository : IReservationRepository
    {
        public List<EnergyReservation> Reservations { get; } = [];

        public Task<EnergyReservation?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
        {
            // Look up a reservation by identifier.
            var res = Reservations.FirstOrDefault(r => r.Id == id);
            return Task.FromResult(res);
        }

        public Task<EnergyReservation?> GetByQrTokenAsync(string qrToken, CancellationToken cancellationToken = default)
        {
            // Look up a reservation by QR token.
            var res = Reservations.FirstOrDefault(r => r.QrToken != null && r.QrToken == qrToken);
            return Task.FromResult(res);
        }

        public Task<EnergyReservation> CreateAsync(EnergyReservation reservation, CancellationToken cancellationToken = default)
        {
            // Add a reservation to the in-memory collection.
            Reservations.Add(reservation);
            return Task.FromResult(reservation);
        }

        public Task<EnergyReservation?> UpdateAsync(EnergyReservation reservation, CancellationToken cancellationToken = default)
        {
            // Replace a reservation entry when the identifier matches.
            var idx = Reservations.FindIndex(r => r.Id == reservation.Id);
            if (idx == -1) return Task.FromResult<EnergyReservation?>(null);
            Reservations[idx] = reservation;
            return Task.FromResult<EnergyReservation?>(reservation);
        }

        public Task<EnergyReservation?> UpdateStatusAsync(
            string id,
            ReservationStatus status,
            string? cancellationReason,
            DateTime? cancelledAt,
            DateTime updatedAt,
            CancellationToken cancellationToken = default)
        {
            // Update reservation status and clear QR data when cancelled.
            var res = Reservations.FirstOrDefault(r => r.Id == id);
            if (res is null) return Task.FromResult<EnergyReservation?>(null);

            res.Status = status;
            res.CancellationReason = cancellationReason;
            res.CancelledAt = cancelledAt;
            res.UpdatedAt = updatedAt;

            if (status == ReservationStatus.Cancelled)
            {
                res.QrToken = null;
                res.QrIssuedAt = null;
                res.QrExpiresAt = null;
            }

            return Task.FromResult<EnergyReservation?>(res);
        }

        public Task<EnergyReservation?> ApproveIfPendingAsync(string id, DateTime updatedAt, CancellationToken cancellationToken = default)
        {
            // Approve the reservation when it is still pending.
            var res = Reservations.FirstOrDefault(r => r.Id == id && r.Status == ReservationStatus.Pending);
            if (res is null) return Task.FromResult<EnergyReservation?>(null);

            res.Status = ReservationStatus.Approved;
            res.UpdatedAt = updatedAt;
            return Task.FromResult<EnergyReservation?>(res);
        }

        public Task<EnergyReservation?> SaveQrTokenAsync(
            string id,
            string qrToken,
            DateTime issuedAt,
            DateTime expiresAt,
            DateTime updatedAt,
            CancellationToken cancellationToken = default)
        {
            // Persist QR token metadata on the matching reservation.
            var res = Reservations.FirstOrDefault(r => r.Id == id);
            if (res is null) return Task.FromResult<EnergyReservation?>(null);

            res.QrToken = qrToken;
            res.QrIssuedAt = issuedAt;
            res.QrExpiresAt = expiresAt;
            res.UpdatedAt = updatedAt;
            return Task.FromResult<EnergyReservation?>(res);
        }

        public Task<bool> HasConflictingReservationAsync(
            string stationId,
            string slotId,
            DateTime reservationDateTime,
            string? excludeReservationId = null,
            CancellationToken cancellationToken = default)
        {
            // Report whether an active reservation conflicts on station, slot, and time.
            var exists = Reservations.Any(r =>
                r.StationId == stationId &&
                r.SlotId == slotId &&
                r.ReservationDateTime == reservationDateTime &&
                r.Status != ReservationStatus.Cancelled &&
                (excludeReservationId == null || r.Id != excludeReservationId));
            return Task.FromResult(exists);
        }

        public Task<bool> HasActiveReservationsForStationAsync(string stationId, CancellationToken cancellationToken = default)
        {
            // Report whether the station has pending or approved reservations.
            var exists = Reservations.Any(r =>
                r.StationId == stationId &&
                (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Approved));
            return Task.FromResult(exists);
        }

        public Task<List<EnergyReservation>> GetByProsumerNicAsync(string prosumerNic, CancellationToken cancellationToken = default)
        {
            // Return all reservations for the given prosumer NIC.
            var list = Reservations.Where(r => r.ProsumerNic == prosumerNic).ToList();
            return Task.FromResult(list);
        }
    }

    private sealed class FakeStationRepository : IStationRepository
    {
        public List<SolarStation> Stations { get; } =
        [
            new SolarStation
            {
                Id = DefaultStationId,
                HubId = "HUB-0001",
                StationName = "Main Grid Station",
                Status = StationStatus.Active
            }
        ];

        public Task<IReadOnlyList<SolarStation>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SolarStation>>(Stations.ToList());

        public Task<SolarStation?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Stations.FirstOrDefault(s => s.Id == id));

        public Task<SolarStation?> GetByHubIdAsync(string hubId, CancellationToken cancellationToken = default) =>
            Task.FromResult(Stations.FirstOrDefault(s => s.HubId == hubId));

        public Task<SolarStation> CreateAsync(SolarStation station, CancellationToken cancellationToken = default)
        {
            // Add a station to the in-memory collection.
            Stations.Add(station);
            return Task.FromResult(station);
        }

        public Task<SolarStation?> UpdateDetailsAsync(SolarStation station, CancellationToken cancellationToken = default) =>
            Task.FromResult(Stations.FirstOrDefault(s => s.Id == station.Id));

        public Task<SolarStation?> UpdateStatusAsync(string id, StationStatus status, DateTime updatedAt, CancellationToken cancellationToken = default)
        {
            // Update station status when the station exists.
            var st = Stations.FirstOrDefault(s => s.Id == id);
            if (st != null)
            {
                st.Status = status;
                st.UpdatedAt = updatedAt;
            }
            return Task.FromResult(st);
        }

        public Task EnsureIndexesAndBackfillAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeProsumerRepository : IProsumerRepository
    {
        public List<Prosumer> Prosumers { get; } =
        [
            new Prosumer
            {
                Nic = DefaultNic,
                AccountStatus = ProsumerAccountStatus.Active
            }
        ];

        public Task<Prosumer?> GetByNicAsync(string nic, CancellationToken cancellationToken = default) =>
            Task.FromResult(Prosumers.FirstOrDefault(p => p.Nic.Equals(nic, StringComparison.OrdinalIgnoreCase)));

        public Task<Prosumer> CreateAsync(Prosumer prosumer, CancellationToken cancellationToken = default)
        {
            // Add a prosumer to the in-memory collection.
            Prosumers.Add(prosumer);
            return Task.FromResult(prosumer);
        }

        public Task<Prosumer?> UpdateProfileAsync(Prosumer prosumer, CancellationToken cancellationToken = default) =>
            Task.FromResult(Prosumers.FirstOrDefault(p => p.Nic.Equals(prosumer.Nic, StringComparison.OrdinalIgnoreCase)));

        public Task<Prosumer?> UpdateStatusAsync(string nic, ProsumerAccountStatus status, DateTime updatedAt, CancellationToken cancellationToken = default)
        {
            // Update prosumer account status when the NIC matches.
            var p = Prosumers.FirstOrDefault(x => x.Nic.Equals(nic, StringComparison.OrdinalIgnoreCase));
            if (p != null) p.AccountStatus = status;
            return Task.FromResult(p);
        }

        public Task<IReadOnlyList<Prosumer>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Prosumer>>(Prosumers);
    }

    private sealed class FakeSlotAvailabilityChecker : ISlotAvailabilityChecker
    {
        public Task<SlotAvailabilityStatus> CheckSlotAvailabilityAsync(
            string stationId,
            string slotId,
            DateTime reservationDateTime,
            CancellationToken cancellationToken = default)
        {
            // Always report the slot as available for test scenarios.
            return Task.FromResult(SlotAvailabilityStatus.Available);
        }
    }

    private sealed class FakeProsumerAccessor(string nic) : ICurrentProsumerAccessor
    {
        public Task<string?> GetCurrentProsumerNicAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<string?>(nic);
    }
}
