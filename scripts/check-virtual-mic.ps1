$cablePaths = @(
    "${env:ProgramFiles}\VB\CABLE Virtual Audio Device",
    "${env:ProgramFiles(x86)}\VB\CABLE Virtual Audio Device"
)

foreach ($cablePath in $cablePaths) {
    if (Test-Path $cablePath) {
        Write-Output "installed"
        exit 0
    }
}

Write-Output "missing"
exit 1
