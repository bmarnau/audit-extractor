/**
 * Test Data for Phase 22 Job-Structure API
 *
 * Realistische Beispiele basierend auf docusnap-Dokumenttypen:
 * - Rechnungen (Invoices)
 * - Lieferscheine (Delivery Notes)
 * - Bestellungen (Purchase Orders)
 * - Angebote (Quotes)
 * - Verträge (Contracts)
 *
 * @version 0.22.0
 * @phase 22
 */

// ============================================================================
// BEISPIEL 1: Rechnung (Invoice)
// ============================================================================

export const invoiceTestCase = {
  description: 'Rechnung von ACME Corp',
  documentType: 'pdf',
  sourceFiles: [
    {
      filePath: 'invoice_2026_001234.pdf',
      mimeType: 'application/pdf',
      hash: 'sha256:abc123def456abc123def456abc123def456abc123def456abc123def456',
      sizeBytes: 245600,
    },
  ],
  schemaId: 'invoice-v2.0.0',
  schemaPath: 'schemas/documents/invoice-v2.0.0.json',
  schemaVersion: '2.0.0',
  exampleIds: ['example-invoice-simple', 'example-invoice-complex'],
  options: {
    enableHallucinationCheck: true,
    confidenceThreshold: 0.85,
    maxRetries: 3,
    timeoutMs: 60000,
    enableAuditLogging: true,
    notifyOnCompletion: true,
  },
  metadata: {
    businessUnit: 'Sales',
    invoiceType: 'commercial',
    expectedFields: [
      'invoiceNumber',
      'invoiceDate',
      'dueDate',
      'vendor',
      'vendorAddress',
      'totalAmount',
      'taxAmount',
      'lineItems',
    ],
  },
};

// ============================================================================
// BEISPIEL 2: Lieferschein (Delivery Note)
// ============================================================================

export const deliveryNoteTestCase = {
  description: 'Lieferschein von Logistik GmbH',
  documentType: 'pdf',
  sourceFiles: [
    {
      filePath: 'delivery_note_20260711_456789.pdf',
      mimeType: 'application/pdf',
      hash: 'sha256:fedcba987654fedcba987654fedcba987654fedcba987654fedcba987654',
      sizeBytes: 156400,
    },
  ],
  schemaId: 'delivery-note-v1.5.0',
  schemaPath: 'schemas/documents/delivery-note-v1.5.0.json',
  schemaVersion: '1.5.0',
  exampleIds: ['example-delivery-complete', 'example-delivery-partial'],
  options: {
    enableHallucinationCheck: true,
    confidenceThreshold: 0.8,
    maxRetries: 2,
    timeoutMs: 45000,
    enableAuditLogging: true,
    notifyOnCompletion: false,
  },
  metadata: {
    businessUnit: 'Logistics',
    documentCategory: 'shipping',
    expectedFields: [
      'trackingNumber',
      'shippingDate',
      'expectedDeliveryDate',
      'sender',
      'recipient',
      'packages',
      'totalWeight',
      'status',
    ],
  },
};

// ============================================================================
// BEISPIEL 3: Bestellung (Purchase Order)
// ============================================================================

export const purchaseOrderTestCase = {
  description: 'Bestellung an Supplier XYZ',
  documentType: 'html',
  sourceFiles: [
    {
      filePath: 'po_2026_PO00567.html',
      mimeType: 'text/html',
      hash: 'sha256:123456789abcdef123456789abcdef123456789abcdef123456789abcdef12',
      sizeBytes: 89234,
    },
  ],
  schemaId: 'purchase-order-v3.0.0',
  schemaPath: 'schemas/documents/purchase-order-v3.0.0.json',
  schemaVersion: '3.0.0',
  exampleIds: ['example-po-standard'],
  options: {
    enableHallucinationCheck: false,
    confidenceThreshold: 0.75,
    maxRetries: 1,
    timeoutMs: 30000,
    enableAuditLogging: true,
    notifyOnCompletion: true,
  },
  metadata: {
    businessUnit: 'Procurement',
    vendorID: 'SUPP-0089',
    expectedFields: [
      'poNumber',
      'poDate',
      'vendorName',
      'vendorAddress',
      'deliveryDate',
      'items',
      'unitPrices',
      'totalPrice',
      'paymentTerms',
    ],
  },
};

// ============================================================================
// BEISPIEL 4: Angebot (Quote)
// ============================================================================

export const quoteTestCase = {
  description: 'Angebot für Projektarbeit',
  documentType: 'pdf',
  sourceFiles: [
    {
      filePath: 'quote_2026_Q98765.pdf',
      mimeType: 'application/pdf',
      hash: 'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      sizeBytes: 312400,
    },
  ],
  schemaId: 'quote-v1.0.0',
  schemaPath: 'schemas/documents/quote-v1.0.0.json',
  schemaVersion: '1.0.0',
  exampleIds: ['example-quote-detailed', 'example-quote-simple'],
  options: {
    enableHallucinationCheck: true,
    confidenceThreshold: 0.88,
    maxRetries: 3,
    timeoutMs: 50000,
    enableAuditLogging: true,
    notifyOnCompletion: true,
  },
  metadata: {
    businessUnit: 'Sales',
    clientID: 'CLIENT-001234',
    expectedFields: [
      'quoteNumber',
      'quoteDate',
      'validUntil',
      'clientName',
      'projectDescription',
      'scopeOfWork',
      'deliverables',
      'timeline',
      'totalPrice',
      'terms',
      'signatureBlock',
    ],
  },
};

// ============================================================================
// BEISPIEL 5: Vertrag (Contract)
// ============================================================================

export const contractTestCase = {
  description: 'Service Level Agreement (SLA)',
  documentType: 'pdf',
  sourceFiles: [
    {
      filePath: 'contract_sla_2026_01.pdf',
      mimeType: 'application/pdf',
      hash: 'sha256:9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      sizeBytes: 567800,
    },
  ],
  schemaId: 'contract-v2.0.0',
  schemaPath: 'schemas/documents/contract-v2.0.0.json',
  schemaVersion: '2.0.0',
  exampleIds: ['example-sla-standard'],
  options: {
    enableHallucinationCheck: true,
    confidenceThreshold: 0.92,
    maxRetries: 3,
    timeoutMs: 90000,
    enableAuditLogging: true,
    notifyOnCompletion: true,
  },
  metadata: {
    businessUnit: 'Legal',
    contractType: 'SLA',
    expectedFields: [
      'contractNumber',
      'effectiveDate',
      'expirationDate',
      'parties',
      'scope',
      'serviceLevel',
      'penalties',
      'termination',
      'signatureBlock',
      'appendices',
    ],
  },
};

// ============================================================================
// BEISPIEL 6: Multi-Document Job (Mehrere Dokumente)
// ============================================================================

export const multiDocumentTestCase = {
  description: 'Kompletter Geschäftsfall mit Rechnung, Lieferschein und Vertrag',
  documentType: 'pdf',
  sourceFiles: [
    {
      filePath: 'invoice_2026_001234.pdf',
      mimeType: 'application/pdf',
      hash: 'sha256:abc123def456abc123def456abc123def456abc123def456abc123def456',
      sizeBytes: 245600,
    },
    {
      filePath: 'delivery_note_20260711_456789.pdf',
      mimeType: 'application/pdf',
      hash: 'sha256:fedcba987654fedcba987654fedcba987654fedcba987654fedcba987654',
      sizeBytes: 156400,
    },
    {
      filePath: 'contract_sla_2026_01.pdf',
      mimeType: 'application/pdf',
      hash: 'sha256:9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      sizeBytes: 567800,
    },
  ],
  schemaId: 'multi-document-v1.0.0',
  schemaPath: 'schemas/documents/multi-document-v1.0.0.json',
  schemaVersion: '1.0.0',
  exampleIds: ['example-multi-doc'],
  options: {
    enableHallucinationCheck: true,
    confidenceThreshold: 0.80,
    maxRetries: 5,
    timeoutMs: 120000,
    enableAuditLogging: true,
    notifyOnCompletion: true,
  },
  metadata: {
    businessUnit: 'Operations',
    caseType: 'end-to-end-process',
    documentCount: 3,
    totalSize: 970000,
    expectedFields: [
      'invoiceNumber',
      'trackingNumber',
      'contractNumber',
      'correlationId',
    ],
  },
};

// ============================================================================
// Mock Schema Definitions
// ============================================================================

export const invoiceSchemaJson = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Invoice Schema v2.0.0',
  type: 'object',
  properties: {
    invoiceNumber: { type: 'string', pattern: '^[A-Z]{2}\\d{6}$' },
    invoiceDate: { type: 'string', format: 'date' },
    dueDate: { type: 'string', format: 'date' },
    vendor: { type: 'string' },
    vendorAddress: { type: 'string' },
    totalAmount: { type: 'number', minimum: 0 },
    taxAmount: { type: 'number', minimum: 0 },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
          amount: { type: 'number' },
        },
      },
    },
  },
  required: ['invoiceNumber', 'invoiceDate', 'vendor', 'totalAmount'],
};

export const deliveryNoteSchemaJson = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Delivery Note Schema v1.5.0',
  type: 'object',
  properties: {
    trackingNumber: { type: 'string' },
    shippingDate: { type: 'string', format: 'date' },
    expectedDeliveryDate: { type: 'string', format: 'date' },
    sender: { type: 'string' },
    recipient: { type: 'string' },
    packages: { type: 'number', minimum: 1 },
    totalWeight: { type: 'number' },
    status: { type: 'string', enum: ['in_transit', 'delivered', 'delayed'] },
  },
  required: ['trackingNumber', 'shippingDate', 'recipient'],
};

export const purchaseOrderSchemaJson = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Purchase Order Schema v3.0.0',
  type: 'object',
  properties: {
    poNumber: { type: 'string', pattern: '^PO\\d{5}$' },
    poDate: { type: 'string', format: 'date' },
    vendorName: { type: 'string' },
    vendorAddress: { type: 'string' },
    deliveryDate: { type: 'string', format: 'date' },
    items: { type: 'array' },
    totalPrice: { type: 'number', minimum: 0 },
    paymentTerms: { type: 'string' },
  },
  required: ['poNumber', 'poDate', 'vendorName', 'deliveryDate'],
};

// ============================================================================
// Expected Test Results
// ============================================================================

export const invoiceExpectedExtraction = {
  invoiceNumber: 'RE0001234',
  invoiceDate: '2026-07-10',
  dueDate: '2026-08-10',
  vendor: 'ACME Corporation GmbH',
  vendorAddress: 'Industriestraße 42, 12345 Berlin, Germany',
  totalAmount: 12450.50,
  taxAmount: 2356.59,
  lineItems: [
    {
      description: 'Software Development Services',
      quantity: 120,
      unitPrice: 150.0,
      amount: 18000.0,
    },
    {
      description: 'Support and Maintenance',
      quantity: 1,
      unitPrice: 2500.0,
      amount: 2500.0,
    },
  ],
};

export const deliveryNoteExpectedExtraction = {
  trackingNumber: 'TRACK-456789-DE',
  shippingDate: '2026-07-10',
  expectedDeliveryDate: '2026-07-15',
  sender: 'Logistik GmbH, Berlin',
  recipient: 'TechCorp AG, Munich',
  packages: 3,
  totalWeight: 45.5,
  status: 'in_transit',
};

export const purchaseOrderExpectedExtraction = {
  poNumber: 'PO00567',
  poDate: '2026-07-10',
  vendorName: 'Supplier XYZ Ltd',
  vendorAddress: '123 Business Park, London, UK',
  deliveryDate: '2026-07-31',
  items: ['Software Licenses', 'Hardware Components'],
  totalPrice: 45000.0,
  paymentTerms: 'Net 30',
};
