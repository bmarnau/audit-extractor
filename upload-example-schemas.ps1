# Upload Example Schemas to Backend API
# This script transforms the JSON Schema files into API-compatible format and uploads them

$API_BASE = "http://localhost:3000/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Example Schemas Upload Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Helper function to upload schema
function Upload-Schema {
    param(
        [string]$Name,
        [string]$Description,
        [string]$DocumentType,
        [string]$Version,
        [array]$Fields
    )
    
    Write-Host "[*] Uploading Schema: $Name..." -ForegroundColor Yellow
    
    $body = @{
        name = $Name
        description = $Description
        documentType = $DocumentType
        version = $Version
        fields = $Fields
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-WebRequest -Uri "$API_BASE/schema/upload" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        $result = $response.Content | ConvertFrom-Json
        
        Write-Host "[OK] Schema uploaded successfully!" -ForegroundColor Green
        Write-Host "    ID: $($result.schemaId)" -ForegroundColor Green
        Write-Host "    Fields: $($result.fieldCount)" -ForegroundColor Green
        Write-Host ""
        return $true
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "[ERROR] Upload failed: $errorMsg" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# ============================================
# 1. Upload Invoice Schema
# ============================================
Write-Host "1. Invoice Extraction Schema" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

$invoiceFields = @(
    @{
        fieldName = "invoiceNumber"
        type = "string"
        isRequired = $true
        pattern = "^[A-Z]{2,5}-[0-9]{4}-[0-9]{6}$"
        confidence = 0.95
        description = "Eindeutige Rechnungsnummer"
    },
    @{
        fieldName = "invoiceDate"
        type = "date"
        isRequired = $true
        pattern = "^\d{4}-\d{2}-\d{2}$"
        confidence = 0.98
        description = "Rechnungsdatum"
    },
    @{
        fieldName = "dueDate"
        type = "date"
        isRequired = $true
        pattern = "^\d{4}-\d{2}-\d{2}$"
        confidence = 0.94
        description = "Fälligkeitsdatum"
    },
    @{
        fieldName = "vendorName"
        type = "string"
        isRequired = $true
        pattern = "^[A-Za-zÄÖÜäöü0-9\s.,&-]{3,100}$"
        confidence = 0.92
        description = "Name des Rechnungsstellers"
    },
    @{
        fieldName = "buyerName"
        type = "string"
        isRequired = $true
        pattern = "^[A-Za-zÄÖÜäöü0-9\s.,&-]{3,100}$"
        confidence = 0.90
        description = "Name des Rechnungsempfängers"
    },
    @{
        fieldName = "subtotal"
        type = "number"
        isRequired = $false
        pattern = "^[0-9]{1,10}[.,][0-9]{2}$"
        confidence = 0.96
        description = "Summe ohne Steuern"
    },
    @{
        fieldName = "taxRate"
        type = "number"
        isRequired = $false
        pattern = "^[0-9]{1,3}[.,][0-9]{2}$"
        confidence = 0.91
        description = "Steuersatz in Prozent"
    },
    @{
        fieldName = "totalAmount"
        type = "number"
        isRequired = $true
        pattern = "^[0-9]{1,10}[.,][0-9]{2}$"
        confidence = 0.97
        description = "Gesamtrechnungsbetrag"
    },
    @{
        fieldName = "lineItems"
        type = "array"
        isRequired = $false
        confidence = 0.85
        description = "Rechnungspositionen (Artikel, Menge, Preis)"
    }
)

$invoiceSuccess = Upload-Schema `
    -Name "Invoice Extraction Schema" `
    -Description "Struktur für automatische Rechnungsextraction aus PDF, Word und anderen Dokumenten" `
    -DocumentType "invoice" `
    -Version "1.0.0" `
    -Fields $invoiceFields

# ============================================
# 2. Upload API Response Schema
# ============================================
Write-Host "2. API Response Extraction Schema" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

$apiResponseFields = @(
    @{
        fieldName = "status"
        type = "string"
        isRequired = $true
        pattern = "^(success|error|pending)$"
        confidence = 0.99
        description = "Response Status (success, error, pending)"
    },
    @{
        fieldName = "statusCode"
        type = "number"
        isRequired = $true
        pattern = "^[0-9]{3}$"
        confidence = 0.98
        description = "HTTP Status Code (200, 404, 500, etc.)"
    },
    @{
        fieldName = "message"
        type = "string"
        isRequired = $false
        pattern = "^.{0,500}$"
        confidence = 0.95
        description = "Status Message or Error Description"
    },
    @{
        fieldName = "data"
        type = "object"
        isRequired = $false
        confidence = 0.90
        description = "Response Data (JSON object)"
    },
    @{
        fieldName = "timestamp"
        type = "string"
        isRequired = $false
        pattern = "^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$"
        confidence = 0.97
        description = "ISO 8601 Timestamp"
    },
    @{
        fieldName = "requestId"
        type = "string"
        isRequired = $false
        pattern = "^[a-f0-9-]{36}$"
        confidence = 0.93
        description = "Unique Request ID / Trace ID"
    },
    @{
        fieldName = "errorDetails"
        type = "object"
        isRequired = $false
        confidence = 0.88
        description = "Error details object (when status = error)"
    }
)

$apiResponseSuccess = Upload-Schema `
    -Name "API Response Extraction Schema" `
    -Description "Schema für Extraktion von API Response-Daten (JSON REST APIs)" `
    -DocumentType "api-response" `
    -Version "1.0.0" `
    -Fields $apiResponseFields

# ============================================
# 3. Verify Uploads
# ============================================
Write-Host "3. Verifying Uploads" -ForegroundColor Magenta
Write-Host "=====================" -ForegroundColor Magenta

try {
    $response = Invoke-WebRequest -Uri "$API_BASE/schema/list" `
        -Method GET `
        -ErrorAction Stop
    
    $schemas = $response.Content | ConvertFrom-Json
    
    Write-Host "[✓] Total schemas in system: $($schemas.data.Count)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Schemas List:" -ForegroundColor Cyan
    
    foreach ($schema in $schemas.data) {
        Write-Host "  • $($schema.name)" -ForegroundColor White
        Write-Host "    └─ ID: $($schema.id)" -ForegroundColor Gray
        Write-Host "    └─ Fields: $($schema.fieldsCount)" -ForegroundColor Gray
        Write-Host "    └─ Version: $($schema.version)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "[✓] Upload verification complete!" -ForegroundColor Green
}
catch {
    Write-Host "[✗] Error listing schemas: $_" -ForegroundColor Red
}

# ============================================
# Summary
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Upload Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($invoiceSuccess -and $apiResponseSuccess) {
    Write-Host "[✓] Both schemas uploaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open Browser: http://localhost/#/schemas" -ForegroundColor White
    Write-Host "2. Both schemas should now appear in Schema Management" -ForegroundColor White
    Write-Host "3. Click on a schema to view/edit details" -ForegroundColor White
}
else {
    Write-Host "[!] Some schemas failed to upload. Check errors above." -ForegroundColor Yellow
}

Write-Host ""
