# Sync backend shared/ to the standalone mobile repo.
# Usage (from backend repo root):
#   .\scripts\sync-shared-to-mobile.ps1 -MobileRepoPath "C:\path\to\TableTennisScorer"
param(
    [Parameter(Mandatory = $true)]
    [string]$MobileRepoPath
)

$ErrorActionPreference = "Stop"
$backendShared = Join-Path $PSScriptRoot "..\shared"
$mobileShared = Join-Path $MobileRepoPath "shared"

if (-not (Test-Path $backendShared)) {
    throw "Backend shared folder not found: $backendShared"
}

if (-not (Test-Path $MobileRepoPath)) {
    throw "Mobile repo path not found: $MobileRepoPath"
}

if (Test-Path $mobileShared) {
    Remove-Item -Recurse -Force $mobileShared
}

Copy-Item -Path $backendShared -Destination $mobileShared -Recurse
Write-Host "Synced shared/ -> $mobileShared"
