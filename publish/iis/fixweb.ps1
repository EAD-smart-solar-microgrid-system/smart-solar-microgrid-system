Copy-Item "C:\Users\Ravindu Peiris\Documents\GitHub\smart-solar-microgrid-system\deploy\iis\web.config" "C:\Users\Ravindu Peiris\Documents\GitHub\smart-solar-microgrid-system\publish\iis\web\web.config" -Force
$appcmd = "$env:windir\System32\inetsrv\appcmd.exe"
& $appcmd set config "SmartSolar-Web" -section:system.webServer/security/authentication/anonymousAuthentication /enabled:true /commit:apphost
& $appcmd set config "SmartSolar-Web" -section:system.webServer/security/authentication/windowsAuthentication /enabled:false /commit:apphost
& $appcmd recycle apppool "SmartSolar-WebPool"
Start-Sleep -Seconds 2
try {
  $r = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 15
  "Status $($r.StatusCode)"
} catch {
  "ERR $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $sr.ReadToEnd()
    if ($body.Length -gt 500) { $body.Substring(0,500) } else { $body }
  }
}
