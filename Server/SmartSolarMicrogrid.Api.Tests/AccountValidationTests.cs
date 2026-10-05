using SmartSolarMicrogrid.Api.Common.Enums;
using SmartSolarMicrogrid.Api.Common.Validation;
using Xunit;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class AccountValidationTests
{
    [Theory]
    [InlineData("admin")]
    [InlineData("operator_colombo")]
    [InlineData("grid.operator-01")]
    public void UsernameValidation_AcceptsSupportedCharacters(string username)
    {
        Assert.Null(AccountValidation.GetUsernameError(username));
    }

    [Theory]
    [InlineData("")]
    [InlineData("ab")]
    [InlineData("_admin")]
    [InlineData("admin user")]
    [InlineData("admin!")]
    public void UsernameValidation_RejectsInvalidValues(string username)
    {
        Assert.NotNull(AccountValidation.GetUsernameError(username));
    }

    [Theory]
    [InlineData("991234567V")]
    [InlineData("991234567x")]
    [InlineData("200012345678")]
    public void NicValidation_AcceptsOldAndNewFormats(string nic)
    {
        Assert.Null(AccountValidation.GetNicError(nic));
    }

    [Theory]
    [InlineData("1234")]
    [InlineData("991234567A")]
    [InlineData("2000-1234-5678")]
    public void NicValidation_RejectsMalformedValues(string nic)
    {
        Assert.NotNull(AccountValidation.GetNicError(nic));
    }

    [Fact]
    public void NewPasswordValidation_RequiresLengthUppercaseLowercaseAndNumber()
    {
        Assert.Null(AccountValidation.GetNewPasswordError("NewPassword123"));
        Assert.NotNull(AccountValidation.GetNewPasswordError("password123"));
        Assert.NotNull(AccountValidation.GetNewPasswordError("PASSWORD123"));
        Assert.NotNull(AccountValidation.GetNewPasswordError("NewPassword"));
        Assert.NotNull(AccountValidation.GetNewPasswordError("New1"));
    }

    [Fact]
    public void OptionalContactValidation_AcceptsEmptyOrSriLankanPhoneAndBoundedAddress()
    {
        Assert.Null(AccountValidation.GetOptionalPhoneError(null));
        Assert.Null(AccountValidation.GetOptionalPhoneError("+94 71-234-5678"));
        Assert.NotNull(AccountValidation.GetOptionalPhoneError("123"));
        Assert.Null(AccountValidation.GetOptionalAddressError(null));
        Assert.Null(AccountValidation.GetOptionalAddressError("Colombo, Sri Lanka"));
        Assert.NotNull(AccountValidation.GetOptionalAddressError("No"));
    }

    [Fact]
    public void RoleValidation_RejectsUndefinedEnumValues()
    {
        Assert.True(AccountValidation.IsSupportedRole(WebUserRole.Backoffice));
        Assert.True(AccountValidation.IsSupportedRole(WebUserRole.GridOperator));
        Assert.False(AccountValidation.IsSupportedRole((WebUserRole)99));
    }
}
