/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: PasswordHasher.cs
 * Purpose: Hash and verify web-user passwords with BCrypt, including legacy plaintext migration.
 */

namespace SmartSolarMicrogrid.Api.Services;

public static class PasswordHasher
{
    /// <summary>
    /// Creates a BCrypt hash for a new or updated password.
    /// </summary>
    public static string Hash(string password)
    {
        // Hash a plaintext password with BCrypt for secure storage.
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    /// <summary>
    /// Verifies a password against a stored hash or legacy plaintext value.
    /// </summary>
    public static bool Verify(string password, string storedPasswordHash)
    {
        // Verify a password against BCrypt or legacy plaintext stored values.
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(storedPasswordHash))
        {
            return false;
        }

        if (IsBcryptHash(storedPasswordHash))
        {
            return BCrypt.Net.BCrypt.Verify(password, storedPasswordHash);
        }

        // Legacy plaintext passwords from earlier seeds / records.
        return string.Equals(storedPasswordHash, password, StringComparison.Ordinal);
    }

    /// <summary>
    /// True when the stored value should be upgraded to a BCrypt hash after a successful login.
    /// </summary>
    public static bool NeedsRehash(string storedPasswordHash)
    {
        // Detect legacy plaintext hashes that should be upgraded after login.
        return !string.IsNullOrEmpty(storedPasswordHash) && !IsBcryptHash(storedPasswordHash);
    }

    private static bool IsBcryptHash(string value)
    {
        // Identify BCrypt-encoded password hashes by prefix.
        return value.StartsWith("$2a$", StringComparison.Ordinal)
               || value.StartsWith("$2b$", StringComparison.Ordinal)
               || value.StartsWith("$2y$", StringComparison.Ordinal);
    }
}
