Import-Module WebAdministration -ErrorAction SilentlyContinue
Restart-WebAppPool -Name "SmartSolar-WebPool"
