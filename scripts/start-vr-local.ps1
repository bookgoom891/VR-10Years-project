param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "SilentlyContinue"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pnpm = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
$nodeBin = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$url = "http://127.0.0.1:5173/"
$logDir = Join-Path $projectRoot "work"
$startupLog = Join-Path $logDir "vr-startup.log"
$devLog = Join-Path $logDir "vr-dev.log"

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

function Write-StartupLog {
  param([string]$Message)
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $startupLog -Value "[$timestamp] $Message"
}

function Test-VrSite {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (-not (Test-VrSite)) {
  Write-StartupLog "Starting VR local dev server."
  $command = "`$env:PATH='$nodeBin;' + `$env:PATH; Set-Location '$projectRoot'; & '$pnpm' dev -- --host 127.0.0.1 *> '$devLog'"
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-Command", $command -WorkingDirectory $projectRoot -WindowStyle Hidden
} else {
  Write-StartupLog "VR local site is already running."
}

for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
  if (Test-VrSite) {
    Write-StartupLog "VR local site is ready."
    if (-not $NoBrowser) {
      Start-Process $url
      Write-StartupLog "Opened browser at $url"
    }
    exit 0
  }
  Start-Sleep -Seconds 1
}

if (-not $NoBrowser) {
  Start-Process $url
  Write-StartupLog "Timed out waiting, opened browser anyway at $url"
} else {
  Write-StartupLog "Timed out waiting for VR local site."
}
