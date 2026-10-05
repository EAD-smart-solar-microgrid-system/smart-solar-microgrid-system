/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: PasswordHasher.cs
 * Purpose: Hash and verify web-user passwords with BCrypt, including legacy plaintext migration.
 */

using System.Security.Cryptography;

namespace SmartSolarMicrogrid.Api.Services;

public static class PasswordHasher
{
    private const string Pbkdf2Algorithm = "pbkdf2-sha256";

    /// <summary>
    /// Creates a BCrypt hash for a new or updated password.
    /// </summary>
    public static string Hash(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    /// <summary>
    /// Verifies a password against a stored hash or legacy plaintext value.
    /// </summary>
    public static bool Verify(string password, string storedPasswordHash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(storedPasswordHash))
        {
            return false;
        }

        if (IsBcryptHash(storedPasswordHash))
        {
            return BCrypt.Net.BCrypt.Verify(password, storedPasswordHash);
        }

        if (storedPasswordHash.StartsWith($"{Pbkdf2Algorithm}$", StringComparison.Ordinal))
        {
            return VerifyPbkdf2(password, storedPasswordHash);
        }

        // Legacy plaintext passwords from earlier seeds / records.
        return string.Equals(storedPasswordHash, password, StringComparison.Ordinal);
    }

    /// <summary>
    /// True when the stored value should be upgraded to a BCrypt hash after a successful login.
    /// </summary>
    public static bool NeedsRehash(string storedPasswordHash)
    {
        return !string.IsNullOrEmpty(storedPasswordHash) && !IsBcryptHash(storedPasswordHash);
    }

    private static bool IsBcryptHash(string value)
    {
        return value.StartsWith("$2a$", StringComparison.Ordinal)
               || value.StartsWith("$2b$", StringComparison.Ordinal)
               || value.StartsWith("$2y$", StringComparison.Ordinal);
    }

    private static bool VerifyPbkdf2(string password, string storedPasswordHash)
    {
        try
        {
            var parts = storedPasswordHash.Split('$');
            if (parts.Length != 4 ||
                !string.Equals(parts[0], Pbkdf2Algorithm, StringComparison.Ordinal) ||
                !int.TryParse(parts[1], out var iterations) ||
                iterations <= 0)
            {
                return false;
            }

            var salt = Convert.FromBase64String(parts[2]);
            var expectedHash = Convert.FromBase64String(parts[3]);
            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
