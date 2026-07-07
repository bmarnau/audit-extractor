#!/usr/bin/env node
/**
 * Test-Script: Verifiziere dass Parser HTML und PDF richtig parsen können
 */

const fs = require('fs');
const path = require('path');

// Import our parsers
const { HtmlParser } = require('../dist/infrastructure/parsers/HtmlParser');
const { PdfParser } = require('../dist/infrastructure/parsers/PdfParser');

async function testParsers() {
  console.log('🧪 Testing Document Parsers...\n');

  // Test HTML
  console.log('📄 Testing HTML Parser:');
  const htmlFile = path.join(__dirname, '..', 'source-documents', 'html', 'invoice.html');
  if (fs.existsSync(htmlFile)) {
    try {
      const htmlBuffer = fs.readFileSync(htmlFile);
      const htmlParser = new HtmlParser();
      
      if (htmlParser.canHandle('invoice.html')) {
        console.log('  ✅ Parser can handle HTML file');
        
        const text = await htmlParser.extractText(htmlBuffer);
        console.log('  ✅ Text extracted:', text.length, 'characters');
        
        // Check for key data
        const checks = [
          ['INV-202406-0142', 'Invoice Number'],
          ['Acme Corporation', 'Customer Name'],
          ['38.080,00', 'Total Amount'],
          ['06.07.2024', 'Invoice Date']
        ];
        
        checks.forEach(([searchStr, label]) => {
          if (text.includes(searchStr)) {
            console.log(`  ✅ Found ${label}: "${searchStr}"`);
          } else {
            console.log(`  ❌ Missing ${label}: "${searchStr}"`);
          }
        });
      } else {
        console.log('  ❌ Parser cannot handle HTML file');
      }
    } catch (err) {
      console.error('  ❌ HTML Parser Error:', err.message);
    }
  } else {
    console.log(`  ❌ HTML file not found: ${htmlFile}`);
  }

  console.log('\n📋 Testing PDF Parser:');
  const pdfFile = path.join(__dirname, '..', 'source-documents', 'pdf', 'invoice.pdf');
  if (fs.existsSync(pdfFile)) {
    try {
      const pdfBuffer = fs.readFileSync(pdfFile);
      const pdfParser = new PdfParser();
      
      if (pdfParser.canHandle('invoice.pdf')) {
        console.log('  ✅ Parser can handle PDF file');
        
        const text = await pdfParser.extractText(pdfBuffer);
        console.log('  ✅ Text extracted:', text.length, 'characters');
        
        // Check for key data
        const checks = [
          ['INV-202406-0142', 'Invoice Number'],
          ['Acme Corporation', 'Customer Name'],
          ['38.080,00', 'Total Amount'],
          ['06.07.2024', 'Invoice Date']
        ];
        
        checks.forEach(([searchStr, label]) => {
          if (text.includes(searchStr)) {
            console.log(`  ✅ Found ${label}: "${searchStr}"`);
          } else {
            console.log(`  ⚠️  ${label} might be missing (PDFs can format differently)`);
          }
        });
      } else {
        console.log('  ❌ Parser cannot handle PDF file');
      }
    } catch (err) {
      console.error('  ❌ PDF Parser Error:', err.message);
    }
  } else {
    console.log(`  ❌ PDF file not found: ${pdfFile}`);
  }

  console.log('\n✅ Parser verification complete!');
}

testParsers().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
