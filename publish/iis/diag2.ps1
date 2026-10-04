$ErrorActionPreference = "Stop"
Add-Type -Path "$env:windir\System32\inetsrv\Microsoft.Web.Administration.dll"
$sm = New-Object Microsoft.Web.Administration.ServerManager
foreach ($poolName in @("SmartSolar-ApiPool","SmartSolar-WebPool")) {
  $pool = $sm.ApplicationPools[$poolName]
  if ($null -eq $pool) { Write-Output "Pool $poolName: missing"; continue }
  Write-Output "Pool $poolName state=$($pool.State) runtime=$($pool.ManagedRuntimeVersion)"
  $i = 0
  foreach ($v in $pool.EnvironmentVariables) {
    Write-Output "  env[$i] name='$($v.Name)' valueLength=$($v.Value.Length)"
    $i++
  }
}
foreach ($siteName in @("SmartSolar-Api","SmartSolar-Web","Default Web Site")) {
  $site = $sm.Sites | Where-Object Name -eq $siteName | Select-Object -First 1
  if ($null -eq $site) { Write-Output "Site $siteName: missing"; continue }
  Write-Output "Site $siteName state=$($site.State)"
  foreach ($b in $site.Bindings) { Write-Output "  binding $($b.Protocol) $($b.BindingInformation)" }
  Write-Output "  path $($site.Applications['/'].VirtualDirectories['/'].PhysicalPath)"
}
$sm.Dispose()
