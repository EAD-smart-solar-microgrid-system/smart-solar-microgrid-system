$ErrorActionPreference = "Stop"
Add-Type -Path "$env:windir\System32\inetsrv\Microsoft.Web.Administration.dll"
$sm = New-Object Microsoft.Web.Administration.ServerManager
$pool = $sm.ApplicationPools["SmartSolar-ApiPool"]
if ($null -eq $pool) { $pool = $sm.ApplicationPools.Add("SmartSolar-ApiPool") }
$pool.ManagedRuntimeVersion = ""
try {
  [void]$pool.EnvironmentVariables.Add("ASPNETCORE_ENVIRONMENT", "Production")
} catch {}
$entry = $pool.EnvironmentVariables | Where-Object { $_.Name -eq "ASPNETCORE_ENVIRONMENT" } | Select-Object -First 1
"Entry name=$($entry.Name) value=$($entry.Value)"
$sm.CommitChanges()
"Commit OK"
$sm.Dispose()
