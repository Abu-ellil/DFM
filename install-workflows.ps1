# GitHub Actions Workflow Setup Script
# This script moves the generated workflows to the repository root where GitHub expects them.

$repoRoot = (git rev-parse --show-toplevel)
if ($null -eq $repoRoot) {
    Write-Error "Not a git repository. Please run this script inside the project directory."
    exit 1
}

$targetDir = Join-Path $repoRoot ".github/workflows"
$sourceDir = Join-Path (Get-Location) ".github/workflows"

Write-Host "Setting up GitHub Actions in: $repoRoot" -ForegroundColor Cyan

# 1. Clean up potential nested .github/.github issues
$nestedDir = Join-Path $repoRoot ".github/.github"
if (Test-Path $nestedDir) {
    Write-Host "Found nested .github directory at $nestedDir. Cleaning up..." -ForegroundColor Yellow
    Remove-Item -Path $nestedDir -Recurse -Force
}

# 2. Ensure target directory exists
if (-not (Test-Path $targetDir)) {
    Write-Host "Creating target directory: $targetDir"
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# 3. Move files
Write-Host "Moving workflow files to $targetDir..." -ForegroundColor Green
Move-Item -Path "$sourceDir\*.yml" -Destination $targetDir -Force

# 4. Cleanup temp folder
if (Test-Path "$sourceDir") {
    Remove-Item -Path (Join-Path (Get-Location) ".github") -Recurse -Force
}

Write-Host "`nSuccessfully installed GitHub Actions workflows!" -ForegroundColor Green
Write-Host "You can now commit and push the .github directory to enable Actions." -ForegroundColor Gray
