using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using SmartSolarMicrogrid.Api.Controllers;
using Xunit;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class AuthorizationBoundaryTests
{
    [Fact]
    public void StationReadRequiresAuthentication()
    {
        var attribute = GetMethodAuthorizeAttribute<StationsController>("GetAll");

        Assert.NotNull(attribute);
        Assert.Null(attribute!.Roles);
    }

    [Fact]
    public void StationMutationsRequireBackoffice()
    {
        Assert.Equal("Backoffice", GetMethodAuthorizeAttribute<StationsController>("Create")!.Roles);
        Assert.Equal("Backoffice", GetMethodAuthorizeAttribute<StationsController>("UpdateDetails")!.Roles);
        Assert.Equal("Backoffice", GetMethodAuthorizeAttribute<StationsController>("UpdateStatus")!.Roles);
    }

    [Fact]
    public void ProsumerSelfServiceRequiresProsumerRole()
    {
        Assert.Equal("Prosumer", GetMethodAuthorizeAttribute<ProsumersController>("GetCurrent")!.Roles);
        Assert.Equal("Prosumer", GetMethodAuthorizeAttribute<ProsumersController>("UpdateCurrent")!.Roles);
        Assert.Equal("Prosumer", GetMethodAuthorizeAttribute<ProsumersController>("RequestDeactivation")!.Roles);
    }

    [Fact]
    public void AdminProsumerControllerRequiresBackofficeRole()
    {
        var attribute = typeof(AdminProsumersController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal("Backoffice", attribute!.Roles);
    }

    private static AuthorizeAttribute? GetMethodAuthorizeAttribute<TController>(string methodName)
    {
        var method = typeof(TController).GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
        return method?.GetCustomAttribute<AuthorizeAttribute>();
    }
}
