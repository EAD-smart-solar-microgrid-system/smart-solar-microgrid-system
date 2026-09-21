/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationServiceResult.cs
 * Purpose: Carry reservation command outcomes to controllers without using exceptions for expected errors.
 */

namespace SmartSolarMicrogrid.Api.Services;

public enum ReservationServiceErrorType
{
    Validation,
    NotFound,
    Conflict,
    DependencyUnavailable
}

public sealed class ReservationServiceResult<T>
{
    private ReservationServiceResult(
        bool succeeded,
        T? value,
        ReservationServiceErrorType? errorType,
        string? errorMessage)
    {
        Succeeded = succeeded;
        Value = value;
        ErrorType = errorType;
        ErrorMessage = errorMessage;
    }

    public bool Succeeded { get; }

    public T? Value { get; }

    public ReservationServiceErrorType? ErrorType { get; }

    public string? ErrorMessage { get; }

    public static ReservationServiceResult<T> Success(T value)
    {
        // Create a successful result containing the reservation service payload.
        return new ReservationServiceResult<T>(true, value, null, null);
    }

    public static ReservationServiceResult<T> Failure(
        ReservationServiceErrorType errorType,
        string errorMessage)
    {
        // Create an expected failure result for the controller to map to an appropriate HTTP status.
        return new ReservationServiceResult<T>(false, default, errorType, errorMessage);
    }
}
