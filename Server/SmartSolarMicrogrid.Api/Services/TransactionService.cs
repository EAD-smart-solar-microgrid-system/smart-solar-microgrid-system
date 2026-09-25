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
        // Look up the reservation by the QR token issued by Member 2 booking workflows.
        var reservation = await _reservationRepo.GetByQrTokenAsync(request.QrToken);

        if (reservation == null)
        {
            return new TransactionResult(false, "Invalid QR Token");
        }

        if (reservation.Status != ReservationStatus.Approved)
        {
            return new TransactionResult(false, $"Reservation is in {reservation.Status} state, expected Approved.");
        }

        return new TransactionResult(true, "QR Verified", reservation.Id, reservation.ProsumerNic, reservation.StationId);
    }

    public async Task<TransactionResult> CompleteTransactionAsync(string reservationId)
    {
        var reservation = await _reservationRepo.GetByIdAsync(reservationId);
        if (reservation == null)
        {
            return new TransactionResult(false, "Reservation not found");
        }

        if (reservation.Status != ReservationStatus.Approved)
        {
            return new TransactionResult(false, $"Cannot complete reservation in {reservation.Status} state.");
        }

        reservation.Status = ReservationStatus.Completed;
        reservation.UpdatedAt = DateTime.UtcNow;

        await _reservationRepo.UpdateAsync(reservation);

        return new TransactionResult(true, "Transaction Completed", reservation.Id);
    }
}
