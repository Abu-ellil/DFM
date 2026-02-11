$body = @{
    machineId = "BBD4A43C1EBC4692"
    factoryName = "Demo Factory"
    durationCode = "30D"
} | ConvertTo-Json

Write-Host "Generating trial license..."
Write-Host "Machine ID: BBD4A43C1EBC4692"
Write-Host "Factory Name: Demo Factory"
Write-Host "Duration: 30D (30 days)"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "https://dates-factory-manager-cloud.vercel.app/api/license/generate-trial" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Status:" $response.StatusCode
    Write-Host ""
    Write-Host "Response:"
    Write-Host $response.Content
} catch {
    Write-Host "Error:" $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response:" $responseBody
    }
}
