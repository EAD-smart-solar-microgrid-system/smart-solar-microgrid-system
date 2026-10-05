using System.Security.Cryptography;
using SmartSolarMicrogrid.Api.Services;
using Xunit;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class PasswordHasherTests
{
    [Fact]
    public void Hash_UsesBcryptAndVerifiesOnlyTheCorrectPassword()
    {
        const string password = "StrongPass123";

        var storedValue = PasswordHasher.Hash(password);

        Assert.NotEqual(password, storedValue);
        Assert.StartsWith("$2", storedValue);
        Assert.True(PasswordHasher.Verify(password, storedValue));
        Assert.False(PasswordHasher.Verify("WrongPass123", storedValue));
        Assert.False(PasswordHasher.NeedsRehash(storedValue));
    }

    [Fact]
    public void Verify_SupportsPbkdf2AndLegacyValuesForMigration()
    {
        const string password = "LegacyPass123";
        var salt = RandomNumberGenerator.GetBytes(16);
        const int iterations = 100_000;
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            32);
        var pbkdf2Value = $"pbkdf2-sha256${iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";

        Assert.True(PasswordHasher.Verify(password, pbkdf2Value));
        Assert.False(PasswordHasher.Verify("wrong", pbkdf2Value));
        Assert.True(PasswordHasher.NeedsRehash(pbkdf2Value));
        Assert.True(PasswordHasher.Verify("admin123", "admin123"));
        Assert.True(PasswordHasher.NeedsRehash("admin123"));
    }
}
