/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationServiceResult.cs
 * Purpose: Carry station service outcomes to controllers without using exceptions for expected errors.
 */

namespace SmartSolarMicrogrid.Api.Services;

public enum StationServiceErrorType
{
    Validation,
    NotFound,
    Conflict,
    DependencyUnavailable
}

public sealed class StationServiceResult<T>
{
    private StationServiceResult(
        bool succeeded,
        T? value,
        StationServiceErrorType? errorType,
        string? errorMessage)
    {
        Succeeded = succeeded;
        Value = value;
        ErrorType = errorType;
        ErrorMessage = errorMessage;
    }

    public bool Succeeded { get; }

    public T? Value { get; }

    public StationServiceErrorType? ErrorType { get; }

    public string? ErrorMessage { get; }

    public static StationServiceResult<T> Success(T value)
    {
        // Create a successful result containing the service response value.
        return new StationServiceResult<T>(true, value, null, null);
    }

    public static StationServiceResult<T> Failure(
        StationServiceErrorType errorType,
        string errorMessage)
    {
        // Create a controlled failure result for the controller to map to HTTP.
        return new StationServiceResult<T>(false, default, errorType, errorMessage);
    }
}
