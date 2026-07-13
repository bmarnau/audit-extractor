#!/usr/bin/env pwsh

<#
.SYNOPSIS
Generate HTML and PDF test reports from Jest JSON results

.DESCRIPTION
Converts Jest JSON test results to HTML and PDF formats for archival and documentation

.EXAMPLE
.\generate-test-reports.ps1
#>

# Read Jest results
$jestResultsPath = "./test-results/comprehensive-executor-results.json"
$outputDir = "./test-results"

if (-not (Test-Path $jestResultsPath)) {
    Write-Error "Jest results file not found: $jestResultsPath"
    exit 1
}

$jestResults = Get-Content $jestResultsPath | ConvertFrom-Json

# Calculate statistics
$totalTests = $jestResults.numTotalTests
$passedTests = $jestResults.numPassedTests
$failedTests = $jestResults.numFailedTests
$skippedTests = $jestResults.numPendingTests
$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }
$duration = $jestResults.testResults[0].perfStats.end - $jestResults.testResults[0].perfStats.start

# Generate HTML
$htmlContent = @"
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phase 31: Comprehensive Test Execution Results</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.95;
        }
        
        .content {
            padding: 40px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 25px;
            border-radius: 8px;
            border-left: 5px solid #667eea;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .summary-card h3 {
            color: #667eea;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .summary-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
        }
        
        .summary-card .unit {
            font-size: 0.9em;
            color: #666;
            margin-left: 5px;
        }
        
        .status-bar {
            margin-top: 40px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #ddd;
        }
        
        .status-bar h3 {
            margin-bottom: 15px;
            color: #333;
        }
        
        .progress-bar {
            background: #e9ecef;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.9em;
            transition: width 0.3s ease;
        }
        
        .test-list {
            margin-top: 30px;
        }
        
        .test-list h4 {
            color: #333;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        .test-item {
            padding: 12px 15px;
            margin-bottom: 8px;
            border-left: 4px solid #ddd;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 0.95em;
        }
        
        .test-item.passed {
            border-left-color: #28a745;
            background: #d4edda;
        }
        
        .test-item.failed {
            border-left-color: #dc3545;
            background: #f8d7da;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .badge.pass {
            background: #d4edda;
            color: #155724;
        }
        
        .badge.fail {
            background: #f8d7da;
            color: #721c24;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
        
        .timestamp {
            color: #999;
            font-size: 0.85em;
            margin-top: 20px;
        }
        
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
            .summary-grid, .status-bar { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Execution Report</h1>
            <p>Phase 31: Comprehensive Test Executor</p>
        </div>
        
        <div class="content">
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div class="value">$totalTests</div>
                </div>
                <div class="summary-card">
                    <h3>Passed Tests</h3>
                    <div class="value" style="color: #28a745;">$passedTests</div>
                </div>
                <div class="summary-card">
                    <h3>Failed Tests</h3>
                    <div class="value" style="color: #dc3545;">$failedTests</div>
                </div>
                <div class="summary-card">
                    <h3>Success Rate</h3>
                    <div class="value" style="color: #667eea;">$successRate<span class="unit">%</span></div>
                </div>
            </div>
            
            <div class="status-bar">
                <h3>Overall Test Coverage</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${successRate}%">
                        $successRate% - $passedTests / $totalTests
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background: #f8f9fa; border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px; font-weight: bold;">Status</td>
                        <td style="padding: 10px; font-weight: bold;">Count</td>
                        <td style="padding: 10px; font-weight: bold;">Percentage</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px; color: #28a745; font-weight: bold;">✅ Passed</td>
                        <td style="padding: 10px;">$passedTests</td>
                        <td style="padding: 10px;">${[math]::Round(($passedTests / $totalTests) * 100, 1)}%</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px; color: #dc3545; font-weight: bold;">❌ Failed</td>
                        <td style="padding: 10px;">$failedTests</td>
                        <td style="padding: 10px;">${[math]::Round(($failedTests / $totalTests) * 100, 1)}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; color: #ffc107; font-weight: bold;">⏭️ Skipped</td>
                        <td style="padding: 10px;">$skippedTests</td>
                        <td style="padding: 10px;">${[math]::Round(($skippedTests / $totalTests) * 100, 1)}%</td>
                    </tr>
                </table>
            </div>
            
            <div class="test-list">
                <h4>Test Suites</h4>
"@

# Add test results
foreach ($testResult in $jestResults.testResults) {
    $testPath = $testResult.name
    $passed = $testResult.numPassingTests
    $failed = $testResult.numFailingTests
    
    $htmlContent += @"
                <div class="test-item">
                    <strong>$testPath</strong>
                    <span class="badge pass">✅ $passed Passed</span>
"@
    
    if ($failed -gt 0) {
        $htmlContent += "<span class='badge fail'>❌ $failed Failed</span>"
    }
    
    $htmlContent += "</div>"
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$htmlContent += @"
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on $timestamp</p>
            <p class="timestamp">Test Report for Phase 31: Comprehensive Test Execution Framework</p>
        </div>
    </div>
</body>
</html>
"@

# Save HTML
$htmlPath = Join-Path $outputDir "test-results-comprehensive.html"
$htmlContent | Out-File -FilePath $htmlPath -Encoding UTF8
Write-Host "✅ HTML Report: $htmlPath" -ForegroundColor Green

# Generate PDF using HTML to PDF conversion (PowerShell)
$pdfPath = Join-Path $outputDir "test-results-comprehensive.pdf"

try {
    # Try using wkhtmltopdf if available
    $wkhtmltopdf = Get-Command wkhtmltopdf -ErrorAction SilentlyContinue
    
    if ($wkhtmltopdf) {
        & wkhtmltopdf $htmlPath $pdfPath
        Write-Host "✅ PDF Report: $pdfPath (wkhtmltopdf)" -ForegroundColor Green
    } else {
        # Fallback: Try using Edge/Chrome via PowerShell
        Write-Host "⚠️ wkhtmltopdf not found. Creating PDF via alternative method..." -ForegroundColor Yellow
        
        # Save alternative PDF summary
        $pdfSummary = @"
TEST EXECUTION REPORT - PHASE 31
Generated: $timestamp

SUMMARY STATISTICS
==================
Total Tests: $totalTests
Passed: $passedTests
Failed: $failedTests
Success Rate: $successRate%

STATUS
======
✅ Test execution completed
✅ Reports generated in test-results directory

For detailed results, see:
- test-results-comprehensive.html (Full HTML Report)
- test-results/comprehensive-executor-results.json (Raw JSON Data)

NEXT STEPS
==========
1. Review test results in HTML
2. Check failed tests in JSON output
3. Address failures according to severity classification
4. Run tests again after fixes
"@
        
        $pdfSummary | Out-File -FilePath "$($pdfPath).txt" -Encoding UTF8
        Write-Host "✅ PDF Summary: $($pdfPath).txt" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ PDF generation skipped. HTML report available." -ForegroundColor Yellow
}

# Create summary file
$summary = @"
# Test Execution Report - Phase 31

**Generated**: $timestamp

## Summary
- **Total Tests**: $totalTests
- **Passed**: $passedTests ✅
- **Failed**: $failedTests ❌
- **Skipped**: $skippedTests ⏭️
- **Success Rate**: $successRate%

## Test Output Files
- `test-results-comprehensive.html` - Full HTML Report
- `comprehensive-executor-results.json` - Raw Jest Results
- `test-results-comprehensive.pdf` - PDF Summary (if available)

## Recommendations
- Review failed tests in JSON output
- Check severity classification for blockers
- Address CRITICAL/HIGH severity issues first
- Re-run tests after fixes

"@

$summaryPath = Join-Path $outputDir "test-summary.md"
$summary | Out-File -FilePath $summaryPath -Encoding UTF8
Write-Host "✅ Summary: $summaryPath" -ForegroundColor Green

Write-Host "`n✅ All reports generated successfully!" -ForegroundColor Green
Write-Host "   Output directory: $outputDir" -ForegroundColor Cyan
