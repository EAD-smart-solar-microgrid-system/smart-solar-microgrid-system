# IIS Deployment — Smart Solar Microgrid

| IIS Site | Port | Content |
| :--- | :--- | :--- |
| `SmartSolar-Api` | `5278` | ASP.NET Core 8 API |
| `SmartSolar-Web` | `8080` | React SPA static files |
| `Default Web Site` | `80` | Unchanged |

## Deploy (Administrator PowerShell)

```powershell
cd "C:\Users\Ravindu Peiris\Documents\GitHub\smart-solar-microgrid-system\deploy\iis"
.\Deploy-IIS.ps1
```

Uses existing `publish\iis\api` and `publish\iis\web` by default. MongoDB settings are read from `Server\SmartSolarMicrogrid.Api\.env` (values are never logged).

### Rebuild publish output first

```powershell
.\Deploy-IIS.ps1 -Rebuild -ApiBaseUrl "http://192.168.1.5:5278"
```

## Verify

- API: `http://localhost:5278/api/health`
- Web: `http://localhost:8080`
- LAN web: `http://192.168.1.5:8080`

## Logs

- Deployment log: `publish\iis\deploy.log`
- API stdout: `publish\iis\api\logs\stdout_*.log`
