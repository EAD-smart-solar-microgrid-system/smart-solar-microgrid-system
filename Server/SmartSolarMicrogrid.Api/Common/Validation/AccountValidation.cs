/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AccountValidation.cs
 * Purpose: Central validation rules for account registration and authentication.
 */

using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using SmartSolarMicrogrid.Api.Common.Enums;

namespace SmartSolarMicrogrid.Api.Common.Validation;

public static class AccountValidation
{
    public const int UsernameMinLength = 3;
    public const int UsernameMaxLength = 50;
    public const int EmailMaxLength = 254;
    public const int LoginIdentifierMaxLength = 254;
    public const int PasswordMinLength = 8;
    public const int PasswordMaxLength = 128;
    public const int FullNameMinLength = 2;
    public const int FullNameMaxLength = 100;
    public const int AddressMinLength = 5;
    public const int AddressMaxLength = 250;
    public const int PhoneMaxLength = 20;

    public const string UsernamePatternText = @"^[A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9]$";
    public const string TokenPatternText = @"^[A-Fa-f0-9]{64}$";

    private static readonly Regex UsernamePattern = new(UsernamePatternText, RegexOptions.CultureInvariant);
    private static readonly Regex TokenPattern = new(TokenPatternText, RegexOptions.CultureInvariant);
    private static readonly Regex OldNicPattern = new(@"^\d{9}[VX]$", RegexOptions.CultureInvariant);
    private static readonly Regex NewNicPattern = new(@"^\d{12}$", RegexOptions.CultureInvariant);
    private static readonly Regex PhonePattern = new(@"^(0\d{9}|\+94\d{9})$", RegexOptions.CultureInvariant);
    private static readonly EmailAddressAttribute EmailValidator = new();

    public static string? GetUsernameError(string? username)
    {
        var value = username?.Trim() ?? string.Empty;
        if (value.Length == 0) return "Username is required.";
        if (value.Length < UsernameMinLength || value.Length > UsernameMaxLength)
        {
            return $"Username must be between {UsernameMinLength} and {UsernameMaxLength} characters.";
        }

        return UsernamePattern.IsMatch(value)
            ? null
            : "Username may contain only letters, numbers, dots, underscores, and hyphens, and must start and end with a letter or number.";
    }

    public static string? GetEmailError(string? email)
    {
        var value = email?.Trim() ?? string.Empty;
        if (value.Length == 0) return "Email is required.";
        if (value.Length > EmailMaxLength) return $"Email must not exceed {EmailMaxLength} characters.";
        return EmailValidator.IsValid(value) ? null : "Enter a valid email address.";
    }

    public static string? GetLoginIdentifierError(string? identifier)
    {
        var value = identifier?.Trim() ?? string.Empty;
        if (value.Length == 0) return "Username or email is required.";
        return value.Length <= LoginIdentifierMaxLength
            ? null
            : $"Username or email must not exceed {LoginIdentifierMaxLength} characters.";
    }

    public static string? GetLoginPasswordError(string? password)
    {
        if (string.IsNullOrEmpty(password)) return "Password is required.";
        return password.Length <= PasswordMaxLength
            ? null
            : $"Password must not exceed {PasswordMaxLength} characters.";
    }

    public static string? GetNewPasswordError(string? password)
    {
        if (string.IsNullOrEmpty(password)) return "Password is required.";
        if (password.Length < PasswordMinLength || password.Length > PasswordMaxLength)
        {
            return $"Password must be between {PasswordMinLength} and {PasswordMaxLength} characters.";
        }

        if (!password.Any(char.IsUpper) || !password.Any(char.IsLower) || !password.Any(char.IsDigit))
        {
            return "Password must include an uppercase letter, a lowercase letter, and a number.";
        }

        return null;
    }

    public static string? GetTokenError(string? token)
    {
        var value = token?.Trim() ?? string.Empty;
        if (value.Length == 0) return "Token is required.";
        return TokenPattern.IsMatch(value) ? null : "Token format is invalid.";
    }

    public static string NormalizeNic(string? nic) =>
        string.IsNullOrWhiteSpace(nic) ? string.Empty : nic.Trim().ToUpperInvariant();

    public static bool IsValidNic(string? nic)
    {
        var value = NormalizeNic(nic);
        return OldNicPattern.IsMatch(value) || NewNicPattern.IsMatch(value);
    }

    public static string? GetNicError(string? nic)
    {
        if (string.IsNullOrWhiteSpace(nic)) return "NIC is required.";
        return IsValidNic(nic)
            ? null
            : "Enter a valid NIC: 9 digits followed by V/X, or 12 digits.";
    }

    public static string? GetFullNameError(string? fullName)
    {
        var value = fullName?.Trim() ?? string.Empty;
        if (value.Length == 0) return "Full name is required.";
        return value.Length is >= FullNameMinLength and <= FullNameMaxLength
            ? null
            : $"Full name must be between {FullNameMinLength} and {FullNameMaxLength} characters.";
    }

    public static string NormalizePhone(string? phoneNumber) =>
        string.IsNullOrWhiteSpace(phoneNumber)
            ? string.Empty
            : Regex.Replace(phoneNumber.Trim(), @"[\s-]", string.Empty);

    public static string? GetOptionalPhoneError(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber)) return null;
        if (phoneNumber.Trim().Length > PhoneMaxLength)
        {
            return $"Phone number must not exceed {PhoneMaxLength} characters.";
        }

        return PhonePattern.IsMatch(NormalizePhone(phoneNumber))
            ? null
            : "Enter a Sri Lankan phone number such as 0712345678 or +94712345678.";
    }

    public static string? GetOptionalAddressError(string? address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        var value = address.Trim();
        return value.Length is >= AddressMinLength and <= AddressMaxLength
            ? null
            : $"Address must be between {AddressMinLength} and {AddressMaxLength} characters.";
    }

    public static bool IsSupportedRole(WebUserRole role) => Enum.IsDefined(role);
}
