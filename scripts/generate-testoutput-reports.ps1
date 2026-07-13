#!/usr/bin/env pwsh

<#
.SYNOPSIS
Generate comprehensive HTML and PDF test reports from Jest results
.DESCRIPTION
Converts Jest JSON test results to professional HTML and PDF formats for archival
#>

$outputDir = "./Testoutput"
$jestResultsPath = "$outputDir/test-results.json"

if (-not (Test-Path $jestResultsPath)) {
    Write-Error "Test results file not found: $jestResultsPath"
    exit 1
}

$jestResults = Get-Content $jestResultsPath | ConvertFrom-Json

# Calculate statistics
$totalTests = $jestResults.numTotalTests
$passedTests = $jestResults.numPassedTests
$failedTests = $jestResults.numFailedTests
$skippedTests = $jestResults.numPendingTests
$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$timestampISO = Get-Date -Format "o"

# Generate comprehensive HTML report
$htmlContent = @"
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="created" content="$timestampISO">
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
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
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
            transition: transform 0.2s ease;
        }
        
        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
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
        
        .status-section {
            margin-top: 40px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #ddd;
        }
        
        .status-section h3 {
            margin-bottom: 20px;
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .progress-container {
            margin-bottom: 20px;
        }
        
        .progress-bar {
            background: #e9ecef;
            height: 35px;
            border-radius: 20px;
            overflow: hidden;
            margin-bottom: 10px;
            border: 2px solid #ddd;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.95em;
            transition: width 0.5s ease;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
        
        .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.95em;
            color: #333;
        }
        
        .stats-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .stats-table th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #555;
        }
        
        .stats-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .stats-table tr:hover {
            background: #f5f5f5;
        }
        
        .stats-table tr:last-child td {
            border-bottom: none;
        }
        
        .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            margin: 0 5px;
        }
        
        .badge.pass {
            background: #d4edda;
            color: #155724;
        }
        
        .badge.fail {
            background: #f8d7da;
            color: #721c24;
        }
        
        .badge.skip {
            background: #fff3cd;
            color: #856404;
        }
        
        .test-suite {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 15px;
            padding: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .test-suite h4 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .test-suite-path {
            font-size: 0.85em;
            color: #666;
            font-family: monospace;
            background: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 10px;
            border-left: 3px solid #667eea;
            padding-left: 12px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 25px 40px;
            text-align: center;
            border-top: 2px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
        
        .footer-meta {
            color: #999;
            font-size: 0.85em;
            margin-top: 15px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        
        .metric-row {
            display: flex;
            justify-content: space-around;
            margin: 15px 0;
            flex-wrap: wrap;
        }
        
        .metric-item {
            text-align: center;
            padding: 10px 20px;
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .metric-label {
            font-size: 0.85em;
            color: #666;
            margin-top: 5px;
        }
        
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
            .status-section, .summary-grid { page-break-inside: avoid; }
        }
        
        @page {
            margin: 20mm;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Execution Report</h1>
            <p>Phase 31: Comprehensive Test Executor Framework</p>
        </div>
        
        <div class="content">
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div class="value">$totalTests</div>
                </div>
                <div class="summary-card">
                    <h3>Passed ✅</h3>
                    <div class="value" style="color: #28a745;">$passedTests</div>
                </div>
                <div class="summary-card">
                    <h3>Failed ❌</h3>
                    <div class="value" style="color: #dc3545;">$failedTests</div>
                </div>
                <div class="summary-card">
                    <h3>Success Rate</h3>
                    <div class="value" style="color: #667eea;">$successRate<span class="unit">%</span></div>
                </div>
            </div>
            
            <div class="status-section">
                <h3>📊 Test Coverage Overview</h3>
                
                <div class="progress-container">
                    <div class="progress-label">
                        <span>Pass Rate</span>
                        <span>$successRate%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${successRate}%">
                            $passedTests / $totalTests Passed
                        </div>
                    </div>
                </div>
                
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Count</th>
                            <th>Percentage</th>
                            <th>Badge</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>✅ Passed</strong></td>
                            <td>$passedTests</td>
                            <td>${[math]::Round(($passedTests / $totalTests) * 100, 1)}%</td>
                            <td><span class="badge pass">Pass</span></td>
                        </tr>
                        <tr>
                            <td><strong>❌ Failed</strong></td>
                            <td>$failedTests</td>
                            <td>${[math]::Round(($failedTests / $totalTests) * 100, 1)}%</td>
                            <td><span class="badge fail">Fail</span></td>
                        </tr>
                        <tr>
                            <td><strong>⏭️ Skipped</strong></td>
                            <td>$skippedTests</td>
                            <td>${[math]::Round(($skippedTests / $totalTests) * 100, 1)}%</td>
                            <td><span class="badge skip">Skip</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="status-section">
                <h3>🧬 Test Suites Executed</h3>
"@

# Add test suite details
foreach ($testResult in $jestResults.testResults) {
    $testPath = Split-Path -Leaf $testResult.name
    $passed = $testResult.numPassingTests
    $failed = $testResult.numFailingTests
    $skipped = $testResult.numPendingTests
    
    $htmlContent += @"
                <div class="test-suite">
                    <h4>$testPath</h4>
                    <div class="test-suite-path">$($testResult.name)</div>
                    <div class="metric-row">
                        <div class="metric-item">
                            <div class="metric-value" style="color: #28a745;">$passed</div>
                            <div class="metric-label">Passed ✅</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value" style="color: #dc3545;">$failed</div>
                            <div class="metric-label">Failed ❌</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value" style="color: #ffc107;">$skipped</div>
                            <div class="metric-label">Skipped ⏭️</div>
                        </div>
                    </div>
                </div>
"@
}

$htmlContent += @"
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Test Execution Report</strong> for Phase 31 Comprehensive Testing Framework</p>
            <div class="footer-meta">
                <p>Generated: $timestamp</p>
                <p>Framework: Jest | TypeScript | Node.js</p>
                <p>Location: Testoutput/</p>
            </div>
        </div>
    </div>
</body>
</html>
"@

# Save HTML
$htmlPath = "$outputDir/test-report.html"
$htmlContent | Out-File -FilePath $htmlPath -Encoding UTF8
Write-Host "✅ HTML Report generated: $htmlPath ($(((Get-Item $htmlPath).Length / 1KB).ToString('F1')) KB)" -ForegroundColor Green

# Generate PDF using HTML (alternative method if wkhtmltopdf not available)
$pdfPath = "$outputDir/test-report.pdf"

# Create a text-based PDF summary as fallback
$pdfSummary = @"
PHASE 31: COMPREHENSIVE TEST EXECUTION REPORT
═══════════════════════════════════════════════════════

Generated: $timestamp

TEST SUMMARY
────────────
  Total Tests ............ $totalTests
  Passed Tests ........... $passedTests ✅
  Failed Tests ........... $failedTests ❌
  Skipped Tests .......... $skippedTests ⏭️
  Success Rate ........... $successRate%

METRICS
───────
"@

foreach ($testResult in $jestResults.testResults) {
    $testPath = Split-Path -Leaf $testResult.name
    $passed = $testResult.numPassingTests
    $failed = $testResult.numFailingTests
    
    $pdfSummary += "`n  $testPath`n"
    $pdfSummary += "    ├─ Passed: $passed`n"
    $pdfSummary += "    └─ Failed: $failed`n"
}

$pdfSummary += @"

RECOMMENDATIONS
───────────────
✓ Review failing tests in JSON output
✓ Prioritize HIGH/CRITICAL severity issues
✓ Run tests again after fixes
✓ Maintain test suite for continuous monitoring

TEST FRAMEWORK
──────────────
  Language: TypeScript
  Test Runner: Jest
  Output Format: JSON, HTML, PDF
  Repository: Phase 31 Complete (committed)

═══════════════════════════════════════════════════════
Report Directory: Testoutput/
"@

# Save PDF as text (since wkhtmltopdf may not be available)
$pdfSummary | Out-File -FilePath "$pdfPath.txt" -Encoding UTF8
Write-Host "✅ PDF Summary generated: $($pdfPath).txt" -ForegroundColor Green

# Create a manifest file
$manifestPath = "$outputDir/manifest.json"
$manifest = @{
    "reportName" = "Phase 31 Comprehensive Test Execution"
    "generated" = $timestamp
    "files" = @(
        @{ "name" = "test-report.html"; "type" = "HTML Report"; "size" = "$(((Get-Item $htmlPath).Length / 1KB).ToString('F1')) KB" }
        @{ "name" = "test-results.json"; "type" = "Raw JSON Data"; "size" = "$(((Get-Item "$outputDir/test-results.json").Length / 1KB).ToString('F1')) KB" }
        @{ "name" = "test-report.pdf.txt"; "type" = "PDF Summary"; "size" = "$(((Get-Item "$($pdfPath).txt").Length / 1KB).ToString('F1')) KB" }
    )
    "statistics" = @{
        "totalTests" = $totalTests
        "passedTests" = $passedTests
        "failedTests" = $failedTests
        "skippedTests" = $skippedTests
        "successRate" = $successRate
    }
} | ConvertTo-Json -Depth 5

$manifest | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Host "✅ Manifest created: $manifestPath" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Test Output Generation Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "`nGenerated Files in Testoutput/:" -ForegroundColor Yellow
Write-Host "  📄 test-report.html ........... Professional HTML Report" -ForegroundColor White
Write-Host "  📊 test-results.json ......... Raw Jest Results Data" -ForegroundColor White
Write-Host "  📑 test-report.pdf.txt ....... PDF Summary (Text)" -ForegroundColor White
Write-Host "  📋 manifest.json ............ Report Metadata" -ForegroundColor White
Write-Host "`nStatistics:" -ForegroundColor Yellow
Write-Host "  Total Tests: $totalTests | Passed: $passedTests | Failed: $failedTests | Success: $successRate%" -ForegroundColor Cyan
Write-Host ""
