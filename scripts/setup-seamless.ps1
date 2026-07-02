# STREEM - install SeamlessStreaming backend on Windows via WSL2
# fairseq2/fairseq2n have no native Windows wheels; backend runs in Linux (WSL).
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot

function ConvertTo-WslPath([string]$WinPath) {
    $resolved = [System.IO.Path]::GetFullPath($WinPath)
    if ($resolved -match '^([A-Za-z]):\\(.*)$') {
        $drive = $Matches[1].ToLower()
        $rest = $Matches[2] -replace '\\', '/'
        return "/mnt/$drive/$rest"
    }
    return ($resolved -replace '\\', '/')
}

function Get-WslLinuxDistro {
    if ($env:STREEM_WSL_DISTRO) {
        return $env:STREEM_WSL_DISTRO
    }

    $streemPaths = Join-Path $PSScriptRoot "streem-paths.js"
    $distro = & node -e "process.stdout.write(require(process.argv[1]).getWslDistro() || '')" $streemPaths
    if ($distro) {
        return $distro.Trim()
    }

    return $null
}

Write-Host "STREEM backend requires Linux (fairseq2 has no native Windows support)."
Write-Host "Installing backend inside WSL2..."
Write-Host ""

$Distro = Get-WslLinuxDistro
if (-not $Distro) {
    Write-Host "ERROR: No Linux WSL distro found."
    Write-Host ""
    Write-Host "Install Ubuntu WSL, reboot if prompted, then re-run:"
    Write-Host "  wsl --install -d Ubuntu"
    Write-Host "  npm run setup:seamless"
    exit 1
}

Write-Host "Using WSL distro: $Distro"
$WslProjectRoot = ConvertTo-WslPath $ProjectRoot
Write-Host "Project path in WSL: $WslProjectRoot"
Write-Host ""

$setupScript = "$WslProjectRoot/scripts/setup-seamless.sh"
$setupCmd = "sed -i 's/\r$//' '$setupScript' && bash '$setupScript'"
& wsl.exe -d $Distro -- bash -lc $setupCmd
if ($LASTEXITCODE -ne 0) {
    throw "WSL setup failed with exit code $LASTEXITCODE"
}

node (Join-Path $ProjectRoot "scripts\prepare-assets.js")

$AppDir = Join-Path $ProjectRoot "seamless-streaming\streaming-react-app"
if (Test-Path (Join-Path $AppDir "dist\index.html")) {
    Write-Host "Frontend dist/ already built."
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    Push-Location $AppDir
    npm install
    npm run build
    Pop-Location
} else {
    Write-Host 'Install Node.js, then: cd seamless-streaming/streaming-react-app; npm run build'
}

Write-Host ""
Write-Host "Setup complete. Backend runs in WSL ($Distro), UI runs in Electron."
Write-Host "  npm run start"
Write-Host ""
Write-Host 'Virtual mic for Zoom: install VB-Audio Virtual Cable, pick CABLE Input as output in STREEM, CABLE Output as mic in Zoom.'
