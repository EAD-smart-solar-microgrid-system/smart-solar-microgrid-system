#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Allow inbound LAN access to SmartSolar IIS sites (ports 5278 and 8080).
#>
param(
    [int] $ApiPort = 5278,
    [int] $WebPort = 8080
)

$ErrorActionPreference = "Stop"

function Ensure-FirewallRule([string] $Name, [int] $Port) {
    $existing = netsh advfirewall firewall show rule name="$Name" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Rule already exists: $Name"
        return
    }

    netsh advfirewall firewall add rule name="$Name" dir=in action=allow protocol=TCP localport=$Port profile=private,domain
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create firewall rule $Name"
    }

    Write-Host "Created firewall rule: $Name (TCP $Port)"
}

Ensure-FirewallRule -Name "SmartSolar API $ApiPort" -Port $ApiPort
Ensure-FirewallRule -Name "SmartSolar Web $WebPort" -Port $WebPort
Write-Host "Firewall ready for phone/LAN access."
