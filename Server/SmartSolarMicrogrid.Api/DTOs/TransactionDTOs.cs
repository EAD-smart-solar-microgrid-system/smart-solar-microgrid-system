/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: TransactionDTOs.cs
 * Purpose: DTOs for grid operator transactions and QR verification.
 */
using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.DTOs;

public record VerifyQrRequest(
    [Required] string QrToken
);

public record TransactionResult(
    bool Success,
    string Message,
    string? ReservationId = null,
    string? ProsumerNic = null,
    string? StationId = null,
    string? SlotId = null,
    DateTime? ReservationDateTime = null,
    string? ReservationType = null,
    string? Status = null
);
