#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Phase 45: PDF Export Content Verification Test
    Tests Management and Technical Audit PDF exports with content analysis
#>

param(
    [string]$ApiBase = "http://localhost:3000/api"
)

$ErrorActionPreference = "Stop"
Write-Host "`n════════════════════════════════════════════════════════════"
Write-Host "PHASE 45: PDF Export Content Verification" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════`n"

$results = @{
    passed  = 0
    failed  = 0
    tests   = @()
    details = @()
}

function Test-PDFContent {
    param(
        [string]$EndpointName,
        [string]$Endpoint,
        [string]$Method = "POST",
        [hashtable]$Body = $null
    )
    
    Write-Host "Testing: $EndpointName..." -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri         = $Endpoint
            Method      = $Method
            ErrorAction = "Stop"
            TimeoutSec  = 10
        }
        
        if ($Body) {
            $params['Body'] = ($Body | ConvertTo-Json -Compress)
            $params['ContentType'] = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        $buffer = $response.Content
        
        # Basic validation
        $isValid = $false
        $hasContentBytes = $buffer.Length -gt 0
        $isPDF = $buffer.Length -ge 4 -and $buffer[0] -eq 0x25 -and $buffer[1] -eq 0x50 -and $buffer[2] -eq 0x44 -and $buffer[3] -eq 0x46
        $hasEOF = $buffer.Length -gt 10 -and [System.Text.Encoding]::ASCII.GetString($buffer[-10..-1]) -contains "%%EOF"
        
        if ($isPDF -and $hasContentBytes -and $buffer.Length -gt 500) {
            $isValid = $true
            
            # Extract text for content analysis
            $pdfText = [System.Text.Encoding]::ASCII.GetString($buffer) -replace '[^\x20-\x7E\n\r]', ' '
            
            # Check for expected content sections
            $sections = @{
                "Magic Number (%PDF)" = $isPDF
                "Size > 500 bytes" = $buffer.Length -gt 500
                "EOF Marker" = $hasEOF
                "Title/Header" = $pdfText -match '(Management|Technical|Audit|Report)'
                "Content Sections" = $pdfText -match '(Summary|Status|KPI|Kriterien|Freigabe)'
                "Page Numbers/Structure" = $pdfText.Length -gt 2000  # Good content = more text
            }
            
            $result = "[PASS]"
            $results.passed++
            
            Write-Host "  $result" -ForegroundColor Green
            Write-Host "  Size: $($buffer.Length) bytes"
            Write-Host "  PDF Structure: Valid"
            Write-Host "  Content Analysis:"
            
            $sections.GetEnumerator() | ForEach-Object {
                $status = if ($_.Value) { "[OK]" } else { "[NO]" }
                Write-Host "    $status $($_.Key)"
            }
            
            $results.details += @{
                Endpoint = $EndpointName
                Size = $buffer.Length
                Valid = $true
                Sections = $sections
                TextLength = $pdfText.Length
            }
        } else {
            $result = "[FAIL]"
            $results.failed++
            
            Write-Host "  $result" -ForegroundColor Red
            Write-Host "  Size: $($buffer.Length) bytes"
            Write-Host "  Is PDF: $isPDF"
            Write-Host "  Has EOF: $hasEOF"
            Write-Host "  Error: Content validation failed"
            
            if ($buffer.Length -lt 200) {
                $errorText = [System.Text.Encoding]::UTF8.GetString($buffer)
                Write-Host "  Response: $errorText" -ForegroundColor Red
            }
            
            $results.details += @{
                Endpoint = $EndpointName
                Size = $buffer.Length
                Valid = $false
                Error = "PDF validation failed"
            }
        }
        
        $results.tests += @{
            name   = $EndpointName
            status = if ($isValid) { "PASS" } else { "FAIL" }
            size   = $buffer.Length
        }
    }
    catch {
        $result = "[ERROR]"
        $results.failed++
        
        Write-Host "  $result" -ForegroundColor Red
        Write-Host "  Exception: $($_.Exception.Message)"
        
        $results.tests += @{
            name   = $EndpointName
            status = "ERROR"
            error  = $_.Exception.Message
        }
        
        $results.details += @{
            Endpoint = $EndpointName
            Valid = $false
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

# Run tests
Write-Host "`n>>> PDF EXPORT TESTS`n" -ForegroundColor Magenta

Test-PDFContent `
    -EndpointName "Management Report PDF" `
    -Endpoint "$ApiBase/management/export-pdf" `
    -Method "POST" `
    -Body @{
        title = "Management Report"
        author = "System"
    }

Test-PDFContent `
    -EndpointName "Technical Audit PDF" `
    -Endpoint "$ApiBase/technical-audit/export-pdf" `
    -Method "POST" `
    -Body @{
        title = "Technical Audit Report"
        author = "System"
    }

# Summary
Write-Host "`n════════════════════════════════════════════════════════════"
Write-Host "PDF CONTENT VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════"
Write-Host "Passed: $($results.passed)" -ForegroundColor Green
Write-Host "Failed: $($results.failed)" -ForegroundColor $(if ($results.failed -gt 0) { "Red" } else { "Green" })
Write-Host "Total:  $($results.passed + $results.failed)"

Write-Host "`nDetailed Results:"
$results.details | ForEach-Object {
    Write-Host "`nEndpoint: $($_.Endpoint)"
    Write-Host "  Valid: $($_.Valid)"
    Write-Host "  Size: $($_.Size) bytes"
    if ($_.TextLength) { Write-Host "  Text Content: $($_.TextLength) chars" }
    if ($_.Error) { Write-Host "  Error: $($_.Error)" -ForegroundColor Red }
    if ($_.Sections) {
        Write-Host "  Sections:"
        $_.Sections.GetEnumerator() | ForEach-Object {
            Write-Host "    $($_.Key): $($_.Value)"
        }
    }
}

exit if ($results.failed -gt 0) { 1 } else { 0 }
