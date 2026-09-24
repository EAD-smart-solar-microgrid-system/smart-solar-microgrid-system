/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ITransactionService.cs
 * Purpose: Interface for Grid Operator transaction logic.
 */
using SmartSolarMicrogrid.Api.DTOs;

namespace SmartSolarMicrogrid.Api.Services;

public interface ITransactionService
{
    Task<TransactionResult> VerifyQrAsync(VerifyQrRequest request);
    Task<TransactionResult> CompleteTransactionAsync(string reservationId);
}
