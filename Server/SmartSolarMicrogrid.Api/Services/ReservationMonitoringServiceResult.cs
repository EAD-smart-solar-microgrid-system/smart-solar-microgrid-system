/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationMonitoringServiceResult.cs
 * Purpose: Carry Member 4 monitoring outcomes to controllers without using exceptions for expected errors.
 */

namespace SmartSolarMicrogrid.Api.Services;

public enum ReservationMonitoringServiceErrorType
{
    Validation,
    NotFound
}

public sealed class ReservationMonitoringServiceResult<T>
{
    private ReservationMonitoringServiceResult(
        bool succeeded,
        T? value,
        ReservationMonitoringServiceErrorType? errorType,
        string? errorMessage)
    {
        Succeeded = succeeded;
        Value = value;
        ErrorType = errorType;
        ErrorMessage = errorMessage;
    }

    public bool Succeeded { get; }

    public T? Value { get; }

    public ReservationMonitoringServiceErrorType? ErrorType { get; }

    public string? ErrorMessage { get; }

    public static ReservationMonitoringServiceResult<T> Success(T value)
    {
        // Create a successful monitoring result containing the response payload.
        return new ReservationMonitoringServiceResult<T>(true, value, null, null);
    }

    public static ReservationMonitoringServiceResult<T> Failure(
        ReservationMonitoringServiceErrorType errorType,
        string errorMessage)
    {
        // Create an expected failure result for the monitoring controller to map to HTTP.
        return new ReservationMonitoringServiceResult<T>(false, default, errorType, errorMessage);
    }
}
