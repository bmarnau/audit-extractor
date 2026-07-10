#!/usr/bin/env pwsh
# Upload example schemas to the API

$apiUrl = "http://localhost:3000"

# Upload Invoice Schema
Write-Host "🔄 Uploading Invoice Schema..."

$schema = Get-Content example-schemas/invoice-schema.json -Raw | ConvertFrom-Json
$example = Get-Content example-schemas/invoice-example-1.json -Raw | ConvertFrom-Json

$payload = @{
    name = "Invoice Extraction"
    description = "Extracts invoice data from PDF and Word documents"
    schema = $schema
    example = $example
    extractionBasis = "documents"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/api/schema/upload" `
        -Method Post `
        -ContentType "application/json" `
        -Body $payload
    
    Write-Host "✅ Invoice Schema uploaded: $($response.schemaId)"
    Write-Host "   Title: $($response.title)"
    Write-Host "   Fields: $($response.fieldCount)"
} catch {
    Write-Host "❌ Error uploading invoice schema: $_"
}

# Upload API Response Schema  
Write-Host "`n🔄 Uploading API Response Schema..."

$schema2 = Get-Content example-schemas/api-response-schema.json -Raw | ConvertFrom-Json
$example2 = Get-Content example-schemas/api-response-example-1.json -Raw | ConvertFrom-Json

$payload2 = @{
    name = "REST API Response"
    description = "Extracts data from REST API JSON responses"
    schema = $schema2
    example = $example2
    extractionBasis = "json"
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri "$apiUrl/api/schema/upload" `
        -Method Post `
        -ContentType "application/json" `
        -Body $payload2
    
    Write-Host "✅ API Response Schema uploaded: $($response2.schemaId)"
    Write-Host "   Title: $($response2.title)"
    Write-Host "   Fields: $($response2.fieldCount)"
} catch {
    Write-Host "❌ Error uploading API response schema: $_"
}

# List all schemas
Write-Host "`n📋 All schemas:"
try {
    $schemas = Invoke-RestMethod -Uri "$apiUrl/api/schema/list" -UseBasicParsing
    foreach ($s in $schemas.data) {
        Write-Host "  • $($s.title) (ID: $($s.id), Fields: $($s.fieldCount))"
    }
} catch {
    Write-Host "❌ Error listing schemas: $_"
}
