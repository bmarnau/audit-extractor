#!/usr/bin/env node
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

try {
  const pdfDir = path.join(__dirname, '..', 'source-documents', 'pdf');
  console.log('Creating PDF in:', pdfDir);
  
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const pdfPath = path.join(pdfDir, 'invoice.pdf');
  const stream = fs.createWriteStream(pdfPath);
  const doc = new PDFDocument();
  
  doc.on('error', (err) => {
    console.error('Doc error:', err);
  });
  
  stream.on('error', (err) => {
    console.error('Stream error:', err);
  });

  doc.pipe(stream);

  // Simple Invoice
  doc.fontSize(24).text('RECHNUNG', { align: 'center' });
  doc.fontSize(16).text('INV-202406-0142', { align: 'center' }).moveDown();
  
  doc.fontSize(12).text('RECHNUNGSSTELLER:');
  doc.fontSize(11).text('TechSolve GmbH');
  doc.text('Innovationsstraße 42');
  doc.text('85737 Ismaning');
  doc.text('Deutschland');
  doc.text('Steuernummer: DE287654321').moveDown();
  
  doc.fontSize(12).text('RECHNUNGSEMPFÄNGER:');
  doc.fontSize(11).text('Acme Corporation GmbH');
  doc.text('Hauptstraße 123');
  doc.text('10115 Berlin');
  doc.text('Deutschland');
  doc.text('Kontakt: info@acmecorp.de').moveDown();
  
  doc.fontSize(11).text('Rechnungsdatum: 06.07.2024');
  doc.text('Rechnungsnummer: INV-202406-0142');
  doc.text('Zahlbar bis: 31.08.2024').moveDown();
  
  doc.fontSize(12).text('LEISTUNGSVERZEICHNIS:').moveDown();
  doc.fontSize(10);
  doc.text('1. Cloud-Hosting-Paket (6 Monate) - 6 Monat x 2.500,00 EUR = 15.000,00 EUR');
  doc.text('2. Support & Maintenance - 60 Stunde x 150,00 EUR = 9.000,00 EUR');
  doc.text('3. Security-Audit Durchführung - 1 Paket x 5.500,00 EUR = 5.500,00 EUR');
  doc.text('4. Dokumentation & Training - 20 Stunde x 125,00 EUR = 2.500,00 EUR').moveDown();
  
  doc.fontSize(11).text('Zwischensumme: 32.000,00 EUR');
  doc.text('Steuersatz (MwSt 19%): 6.080,00 EUR');
  doc.fontSize(14).text('GESAMTBETRAG: 38.080,00 EUR', { underline: true }).moveDown();
  
  doc.fontSize(10).text('Währung: EUR');
  doc.text('Zahlungsbedingungen: Zahlung innerhalb von 30 Tagen (NET30)').moveDown();
  
  doc.fontSize(11).text('BANKVERBINDUNG:');
  doc.fontSize(10);
  doc.text('Kontoinhaber: TechSolve GmbH');
  doc.text('Bank: Deutsche Commerzbank');
  doc.text('IBAN: DE89370400440532013000');
  doc.text('BIC: COBADEFFXXX').moveDown();
  
  doc.fontSize(10).text('Bitte überweisen Sie den Betrag auf das angegebene Bankkonto.');
  doc.text('Für Rückfragen: +49 89 123456-0').moveDown();
  
  doc.end();

  stream.on('finish', () => {
    console.log('✅ PDF created:', pdfPath);
    const stats = fs.statSync(pdfPath);
    console.log('   Size:', stats.size, 'bytes');
  });

} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
