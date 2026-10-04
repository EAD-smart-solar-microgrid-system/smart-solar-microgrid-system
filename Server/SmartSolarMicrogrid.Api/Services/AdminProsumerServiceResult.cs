/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AdminProsumerServiceResult.cs
 * Purpose: Encapsulate outcomes and error classifications for administrative prosumer operations.
 */

namespace SmartSolarMicrogrid.Api.Services;

public enum AdminProsumerErrorType
{
    Validation,
    NotFound,
    Conflict,
    Internal
}

public sealed class AdminProsumerServiceResult<T>
{
    private AdminProsumerServiceResult(bool succeeded, T? value, AdminProsumerErrorType? errorType, string? errorMessage)
    {
        Succeeded = succeeded;
        Value = value;
        ErrorType = errorType;
        ErrorMessage = errorMessage;
    }

    public bool Succeeded { get; }

    public T? Value { get; }

    public AdminProsumerErrorType? ErrorType { get; }

    public string? ErrorMessage { get; }

    public static AdminProsumerServiceResult<T> Success(T value) =>
        new(true, value, null, null);

    public static AdminProsumerServiceResult<T> Failure(AdminProsumerErrorType errorType, string errorMessage) =>
        new(false, default, errorType, errorMessage);
}
