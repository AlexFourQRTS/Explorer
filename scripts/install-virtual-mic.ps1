$downloadUrl = "https://vb-audio.com/Cable/"

Write-Host "VB-Audio Virtual Cable is not installed."
Write-Host "Download page: $downloadUrl"
Start-Process $downloadUrl
Write-Host "After install, restart STREEM and select CABLE Input as translation output."
