/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: AuthorizationBoundaryTests.cs
 * Purpose: Verify role-based authorization attributes on API controllers and actions.
 */

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
        // Assert station read endpoints require authentication without a specific role.
        var attribute = GetMethodAuthorizeAttribute<StationsController>("GetAll");

        Assert.NotNull(attribute);
        Assert.Null(attribute!.Roles);

        var getByHubIdAttribute = GetMethodAuthorizeAttribute<StationsController>("GetByHubId");

        Assert.NotNull(getByHubIdAttribute);
        Assert.Null(getByHubIdAttribute!.Roles);
    }

    [Fact]
    public void StationMutationsRequireBackoffice()
    {
        // Assert station create and update actions are restricted to Backoffice users.
        Assert.Equal("Backoffice", GetMethodAuthorizeAttribute<StationsController>("Create")!.Roles);
        Assert.Equal("Backoffice", GetMethodAuthorizeAttribute<StationsController>("UpdateDetails")!.Roles);
        Assert.Equal("Backoffice", GetMethodAuthorizeAttribute<StationsController>("UpdateStatus")!.Roles);
    }

    [Fact]
    public void ProsumerSelfServiceRequiresProsumerRole()
    {
        // Assert prosumer self-service endpoints require the Prosumer role.
        Assert.Equal("Prosumer", GetMethodAuthorizeAttribute<ProsumersController>("GetCurrent")!.Roles);
        Assert.Equal("Prosumer", GetMethodAuthorizeAttribute<ProsumersController>("UpdateCurrent")!.Roles);
        Assert.Equal("Prosumer", GetMethodAuthorizeAttribute<ProsumersController>("RequestDeactivation")!.Roles);
    }

    [Fact]
    public void AdminProsumerControllerRequiresBackofficeRole()
    {
        // Assert the admin prosumer controller is restricted to Backoffice users.
        var attribute = typeof(AdminProsumersController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal("Backoffice", attribute!.Roles);
    }

    [Fact]
    public void ReservationApprovalRequiresGridOperatorRole()
    {
        // Assert reservation approval is restricted to GridOperator users.
        Assert.Equal("GridOperator", GetMethodAuthorizeAttribute<ReservationsController>("Approve")!.Roles);
    }

    [Fact]
    public void ReservationQrTokenRequiresProsumerRole()
    {
        // Assert QR token generation is restricted to Prosumer users.
        Assert.Equal("Prosumer", GetMethodAuthorizeAttribute<ReservationsController>("GenerateQrToken")!.Roles);
    }

    [Fact]
    public void ReservationMonitoringRequiresGridOperatorBackofficeOrProsumer()
    {
        // Assert reservation monitoring allows GridOperator, Backoffice, or Prosumer roles.
        var attribute = typeof(ReservationMonitoringController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attribute);
        Assert.Equal("GridOperator,Backoffice,Prosumer", attribute!.Roles);
    }

    [Fact]
    public void SlotAvailabilityPatchRequiresGridOperatorRole()
    {
        // Assert slot availability updates are restricted to GridOperator users.
        var attribute = GetMethodAuthorizeAttribute<EnergyBookingSlotsController>("UpdateAvailability");
        Assert.NotNull(attribute);
        Assert.Equal("GridOperator", attribute!.Roles);
    }

    private static AuthorizeAttribute? GetMethodAuthorizeAttribute<TController>(string methodName)
    {
        // Resolve the Authorize attribute applied to a controller action by method name.
        var method = typeof(TController).GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
        return method?.GetCustomAttribute<AuthorizeAttribute>();
    }
}
