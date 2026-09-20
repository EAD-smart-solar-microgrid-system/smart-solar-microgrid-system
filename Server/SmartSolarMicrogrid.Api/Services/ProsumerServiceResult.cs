/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerServiceResult.cs
 * Purpose: Carry prosumer service outcomes to controllers without using exceptions for expected errors.
 */

namespace SmartSolarMicrogrid.Api.Services;

public enum ProsumerServiceErrorType
{
    Validation,
    NotFound,
    Conflict
}

public sealed class ProsumerServiceResult<T>
{
    private ProsumerServiceResult(
        bool succeeded,
        T? value,
        ProsumerServiceErrorType? errorType,
        string? errorMessage)
    {
        Succeeded = succeeded;
        Value = value;
        ErrorType = errorType;
        ErrorMessage = errorMessage;
    }

    public bool Succeeded { get; }

    public T? Value { get; }

    public ProsumerServiceErrorType? ErrorType { get; }

    public string? ErrorMessage { get; }

    public static ProsumerServiceResult<T> Success(T value)
    {
        // Create a successful result containing the prosumer service response payload.
        return new ProsumerServiceResult<T>(true, value, null, null);
    }

    public static ProsumerServiceResult<T> Failure(
        ProsumerServiceErrorType errorType,
        string errorMessage)
    {
        // Create an expected failure result for the controller to map to an appropriate HTTP status.
        return new ProsumerServiceResult<T>(false, default, errorType, errorMessage);
    }
}
