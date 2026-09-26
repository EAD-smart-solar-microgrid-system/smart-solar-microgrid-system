/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Member4DashboardServiceResult.cs
 * Purpose: Carry Member 4 dashboard and maps outcomes without using exceptions for expected errors.
 */

namespace SmartSolarMicrogrid.Api.Services;

public enum Member4DashboardServiceErrorType
{
    Validation,
    NotFound
}

public sealed class Member4DashboardServiceResult<T>
{
    private Member4DashboardServiceResult(
        bool succeeded,
        T? value,
        Member4DashboardServiceErrorType? errorType,
        string? errorMessage)
    {
        Succeeded = succeeded;
        Value = value;
        ErrorType = errorType;
        ErrorMessage = errorMessage;
    }

    public bool Succeeded { get; }

    public T? Value { get; }

    public Member4DashboardServiceErrorType? ErrorType { get; }

    public string? ErrorMessage { get; }

    public static Member4DashboardServiceResult<T> Success(T value)
    {
        // Create a successful Member 4 dashboard or maps result containing the payload.
        return new Member4DashboardServiceResult<T>(true, value, null, null);
    }

    public static Member4DashboardServiceResult<T> Failure(
        Member4DashboardServiceErrorType errorType,
        string errorMessage)
    {
        // Create an expected failure result for Member 4 controllers to map to HTTP.
        return new Member4DashboardServiceResult<T>(false, default, errorType, errorMessage);
    }
}
