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
        // Simple logic: In a real system, the QR token might be an encrypted JWT.
        // Here we assume the QR token is saved directly in the reservation (Member 2).
        var allReservations = await _reservationRepo.GetAllAsync();
        var reservation = allReservations.FirstOrDefault(r => r.QrToken == request.QrToken);
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

        await _reservationRepo.UpdateAsync(reservationId, reservation);
        await _reservationRepo.UpdateAsync(reservation);

        return new TransactionResult(true, "Transaction Completed", reservation.Id);
    }
}
