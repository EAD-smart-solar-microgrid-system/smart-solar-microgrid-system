$appcmd = "$env:windir\System32\inetsrv\appcmd.exe"
"---anon---"
& $appcmd list config "SmartSolar-Web" -section:system.webServer/security/authentication/anonymousAuthentication
"---windows---"
& $appcmd list config "SmartSolar-Web" -section:system.webServer/security/authentication/windowsAuthentication
"---authz---"
& $appcmd list config "SmartSolar-Web" -section:system.webServer/security/authorization
"---site path---"
& $appcmd list vdir "SmartSolar-Web/"
"---set anon app pool identity---"
& $appcmd set config "SmartSolar-Web" -section:system.webServer/security/authentication/anonymousAuthentication /userName:"" /commit:apphost
& $appcmd set config "SmartSolar-Web" /section:system.webServer/security/authorization /+"[accessType='Allow',users='*']" /commit:apphost
& $appcmd recycle apppool "SmartSolar-WebPool"
Start-Sleep -Seconds 2
try { $r = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 15; "Status $($r.StatusCode) len $($r.Content.Length)" } catch { "ERR $($_.Exception.Message)" }
