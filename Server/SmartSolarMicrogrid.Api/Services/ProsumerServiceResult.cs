/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerServiceResult.cs
 * Purpose: Carry Prosumer service outcomes to controllers without exposing persistence details.
 */

namespace SmartSolarMicrogrid.Api.Services;

public enum ProsumerServiceErrorType
{
    Validation,
    Unauthorized,
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
        // Create a successful result containing the service response value.
        return new ProsumerServiceResult<T>(true, value, null, null);
    }

    public static ProsumerServiceResult<T> Failure(
        ProsumerServiceErrorType errorType,
        string errorMessage)
    {
        // Create a controlled failure result for public HTTP response mapping.
        return new ProsumerServiceResult<T>(false, default, errorType, errorMessage);
    }
}
