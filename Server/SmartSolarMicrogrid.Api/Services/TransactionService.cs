/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: TransactionService.cs
 * Purpose: Implementation of Grid Operator transaction logic.
 */
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Services;

public class TransactionService : ITransactionService
{
    private readonly IReservationRepository _reservationRepo;

    public TransactionService(IReservationRepository reservationRepo)
    {
        _reservationRepo = reservationRepo;
    }

    public async Task<TransactionResult> VerifyQrAsync(VerifyQrRequest request)
    {
        var rawToken = request.QrToken?.Trim() ?? string.Empty;
        var token = rawToken;

        // In case the full QR text payload or JSON was submitted directly
        var hexMatch = System.Text.RegularExpressions.Regex.Match(rawToken, @"\b([0-9a-fA-F]{64})\b");
        if (hexMatch.Success)
        {
            token = hexMatch.Groups[1].Value;
        }

        // Look up the reservation by the QR token issued by Member 2 booking workflows
        var reservation = await _reservationRepo.GetByQrTokenAsync(token);

        if (reservation == null)
        {
            return new TransactionResult(false, "Invalid QR Token");
        }

        if (reservation.Status != ReservationStatus.Approved)
        {
            return new TransactionResult(false, $"Reservation is in {reservation.Status} state, expected Approved.");
        }

        // Validate whether the QR token has expired against the authoritative post-slot window
        if (reservation.QrExpiresAt.HasValue && reservation.QrExpiresAt.Value < DateTime.UtcNow)
        {
            return new TransactionResult(false, "QR Token has expired. Please request a new token from the prosumer application.");
        }

        var bookingId = reservation.Id.Length >= 6
            ? $"BK-{reservation.Id[^6..].ToUpperInvariant()}"
            : $"BK-{reservation.Id.ToUpperInvariant()}";

        return new TransactionResult(
            Success: true,
            Message: "QR Verified",
            ReservationId: reservation.Id,
            BookingId: bookingId,
            ProsumerNic: reservation.ProsumerNic,
            StationId: reservation.StationId,
            SlotId: reservation.SlotId,
            ReservationDateTime: reservation.ReservationDateTime,
            ReservationType: reservation.ReservationType.ToString(),
            Status: reservation.Status.ToString()
        );
    }

    public async Task<TransactionResult> CompleteTransactionAsync(string reservationId)
    {
        // Validate reservation existence by identifier
        var reservation = await _reservationRepo.GetByIdAsync(reservationId);
        if (reservation == null)
        {
            return new TransactionResult(false, "Reservation not found");
        }

        if (reservation.Status != ReservationStatus.Approved)
        {
            return new TransactionResult(false, $"Cannot complete reservation in {reservation.Status} state.");
        }

        // Transition reservation status to Completed and record update timestamp
        reservation.Status = ReservationStatus.Completed;
        reservation.UpdatedAt = DateTime.UtcNow;

        await _reservationRepo.UpdateAsync(reservation);

        return new TransactionResult(
            Success: true,
            Message: "Transaction Completed",
            ReservationId: reservation.Id,
            ProsumerNic: reservation.ProsumerNic,
            StationId: reservation.StationId,
            SlotId: reservation.SlotId,
            ReservationDateTime: reservation.ReservationDateTime,
            ReservationType: reservation.ReservationType.ToString(),
            Status: reservation.Status.ToString()
        );
    }
}
