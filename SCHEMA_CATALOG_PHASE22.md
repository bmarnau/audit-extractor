# Docusnap Document Schemas - Phase 22
## Catalog of Business Document Types

**Version:** 0.22.0  
**Location:** `schemas/documents/`  
**Status:** ✅ Complete with 6 document types

---

## 📋 Schema Overview

| Document Type | Schema File | Version | Fields | Use Case |
|---|---|---|---|---|
| Invoice | `invoice-v2.0.0.json` | 2.0.0 | 16 required + 10 optional | Sales billing |
| Delivery Note | `delivery-note-v1.5.0.json` | 1.5.0 | 10 required + 8 optional | Shipment tracking |
| Purchase Order | `purchase-order-v3.0.0.json` | 3.0.0 | 8 required + 12 optional | Procurement |
| Quote | `quote-v1.0.0.json` | 1.0.0 | 6 required + 10 optional | Sales proposals |
| Contract | `contract-v2.0.0.json` | 2.0.0 | 7 required + 15 optional | SLA/Agreements |
| Multi-Document | `multi-document-v1.0.0.json` | 1.0.0 | Bundle schema | Combined workflows |

---

## 📄 Schema Details

### 1. Invoice (v2.0.0)
**File:** `invoice-v2.0.0.json`  
**Test Size:** 245.6 KB PDF

**Key Fields:**
- `invoiceNumber` (Pattern: ^[A-Z]{2,3}-\d{4}-\d{3,6}$)
- `invoiceDate`, `dueDate`
- `vendor` (Object: name, address, taxId, contact)
- `items[]` (Array: description, quantity, unitPrice, tax, total)
- `totalAmount`, `currency`, `paymentTerms`, `bankDetails`

**Validation Rules:**
- ✅ Minimum 1 item required
- ✅ Tax breakdown included
- ✅ Bank details for payment
- ✅ Pattern validation for invoice number

**Typical Extraction:**
```json
{
  "invoiceNumber": "INV-2024-001234",
  "invoiceDate": "2024-07-01",
  "dueDate": "2024-08-01",
  "vendor": {
    "name": "ACME Corporation",
    "taxId": "DE123456789"
  },
  "items": [
    {
      "description": "Professional Services",
      "quantity": 40,
      "unitPrice": 150,
      "total": 6000
    }
  ],
  "totalAmount": 7140,
  "currency": "EUR"
}
```

---

### 2. Delivery Note (v1.5.0)
**File:** `delivery-note-v1.5.0.json`  
**Test Size:** 156.4 KB PDF

**Key Fields:**
- `deliveryNoteNumber` (Pattern: ^DN-\d{4}-\d{3,6}$)
- `deliveryDate`, `shipmentDate`
- `relatedInvoiceNumber`, `relatedOrderNumber` (Traceability)
- `from` (Warehouse/Supplier), `to` (Customer/Destination)
- `items[]` (Track: quantityOrdered, quantityDelivered, quantityDamaged)
- `deliveryStatus` (pending, shipped, in_transit, delivered, returned)

**Validation Rules:**
- ✅ From/To addresses required
- ✅ Minimum 1 delivered item
- ✅ Damage reporting support
- ✅ Status tracking

**Typical Extraction:**
```json
{
  "deliveryNoteNumber": "DN-2024-001",
  "deliveryDate": "2024-07-05",
  "relatedInvoiceNumber": "INV-2024-001234",
  "from": {
    "name": "ACME Warehouse Berlin",
    "address": "Warehouse St. 1, 10115 Berlin"
  },
  "to": {
    "name": "Customer Corp",
    "address": "Main St. 42, 80331 Munich"
  },
  "items": [
    {
      "description": "Item A",
      "quantityOrdered": 100,
      "quantityDelivered": 100,
      "quantityDamaged": 0
    }
  ],
  "deliveryStatus": "delivered",
  "signedBy": "John Doe"
}
```

---

### 3. Purchase Order (v3.0.0)
**File:** `purchase-order-v3.0.0.json`  
**Test Size:** 89.2 KB HTML

**Key Fields:**
- `poNumber` (Pattern: ^PO-\d{4}-\d{5}$)
- `poDate`, `requiredDeliveryDate`
- `orderingParty` (Buyer info), `supplier` (Vendor info)
- `items[]` (lineNumber, sku, quantity, unitPrice, totalPrice)
- `approvalStatus` (draft, submitted, approved, rejected, cancelled)
- `incoterms` (Trade terms: EXW, FOB, CIF, etc.)

**Validation Rules:**
- ✅ Minimum 1 line item
- ✅ PO number pattern validation
- ✅ Approval workflow tracking
- ✅ International commerce terms

**Typical Extraction:**
```json
{
  "poNumber": "PO-2024-12345",
  "poDate": "2024-07-01",
  "requiredDeliveryDate": "2024-08-15",
  "orderingParty": {
    "name": "Buyer Company",
    "department": "Procurement"
  },
  "supplier": {
    "name": "ACME Corp",
    "supplierNumber": "ACME-001"
  },
  "items": [
    {
      "description": "Electronic Components",
      "sku": "COMP-2024",
      "quantity": 500,
      "unitPrice": 12.50,
      "totalPrice": 6250
    }
  ],
  "totalOrderValue": 6250,
  "approvalStatus": "approved",
  "incoterms": "CIF"
}
```

---

### 4. Quote (v1.0.0)
**File:** `quote-v1.0.0.json`  
**Test Size:** 312.4 KB PDF

**Key Fields:**
- `quoteNumber` (Pattern: ^QUOTE-\d{4}-\d{5}$)
- `quoteDate`, `validUntil`, `validityDays`
- `issuer` (Company making offer), `customer` (Recipient)
- `items[]` (Service/product with discount support)
- `totalAmount`, `paymentTerms`, `deliveryTerms`
- `quoteStatus` (draft, sent, accepted, rejected, expired)

**Validation Rules:**
- ✅ Minimum 1 line item
- ✅ Expiration validation
- ✅ Status tracking (acceptance workflow)
- ✅ Discount support (percentage or fixed)

**Typical Extraction:**
```json
{
  "quoteNumber": "QUOTE-2024-00567",
  "quoteDate": "2024-07-01",
  "validUntil": "2024-08-01",
  "issuer": {
    "name": "ACME Services Ltd",
    "contact": "sales@acme.com"
  },
  "customer": {
    "name": "Prospect Company"
  },
  "items": [
    {
      "description": "Consulting Services - Phase 1",
      "quantity": 40,
      "unit": "hours",
      "unitPrice": 200,
      "totalPrice": 8000
    }
  ],
  "totalAmount": 8000,
  "paymentTerms": "50% deposit, 50% on completion",
  "quoteStatus": "sent"
}
```

---

### 5. Contract (v2.0.0)
**File:** `contract-v2.0.0.json`  
**Test Size:** 567.8 KB PDF

**Key Fields:**
- `contractNumber` (Pattern: ^CONTRACT-\d{4}-\d{5}$)
- `contractTitle`, `contractType` (SLA, Service Agreement, etc.)
- `executionDate`, `effectiveDate`, `expirationDate`
- `provider` (Service provider), `client` (Customer)
- `sla` (Availability %, Response times, Resolution times)
- `pricing` (Model: fixed/hourly/monthly; costs)
- `penalties` (SLA breach credits)
- `terminationClause` (Notice period, fees)

**Validation Rules:**
- ✅ All date fields required
- ✅ SLA metrics support (uptime %, response times)
- ✅ Penalty calculation fields
- ✅ GDPR/Data protection tracking
- ✅ Termination clause validation

**Typical Extraction:**
```json
{
  "contractNumber": "CONTRACT-2024-00123",
  "contractTitle": "Cloud Services SLA",
  "contractType": "SLA",
  "executionDate": "2024-07-01",
  "expirationDate": "2025-07-01",
  "provider": {
    "name": "Cloud Provider Inc"
  },
  "client": {
    "name": "Customer Corp"
  },
  "sla": {
    "availability": 99.9,
    "supportHours": "24/7",
    "responseTime": {
      "critical": 15,
      "high": 60
    }
  },
  "pricing": {
    "model": "monthly",
    "monthlyCost": 5000
  },
  "penalties": {
    "creditPercentage": 10,
    "maxCredit": 500
  }
}
```

---

### 6. Multi-Document Bundle (v1.0.0)
**File:** `multi-document-v1.0.0.json`  
**Test Size:** 970 KB (3 PDFs combined)

**Key Fields:**
- `bundleId`, `bundleDate`
- `documents[]` (Array of documents: Invoice, Delivery Note, PO, Quote, Contract)
- `totalDocuments`, `totalValue`
- `transactionChain` (Workflow: PO→Invoice→Delivery)
- `businessProcess` (procurement, sales, combined)
- `completeness` (Validation that all expected docs present)

**Validation Rules:**
- ✅ Minimum 2 documents required
- ✅ Maximum 5 documents per bundle
- ✅ Related documents should reference each other
- ✅ Document status tracking (active, completed, cancelled)

**Typical Extraction:**
```json
{
  "bundleId": "BUNDLE-2024-001",
  "bundleDate": "2024-07-10",
  "totalDocuments": 3,
  "documents": [
    {
      "documentType": "purchase-order",
      "documentNumber": "PO-2024-12345",
      "amount": 10000,
      "status": "completed"
    },
    {
      "documentType": "invoice",
      "documentNumber": "INV-2024-001234",
      "amount": 10000,
      "status": "completed"
    },
    {
      "documentType": "delivery-note",
      "documentNumber": "DN-2024-001",
      "status": "completed"
    }
  ],
  "transactionChain": "PO→Invoice→Delivery",
  "businessProcess": "procurement"
}
```

---

## 🔗 Integration Points

### Phase 22 Job Structure API
All schemas are referenced in Phase 22 test fixtures:
```javascript
// File: tests/fixtures/job-test-data.ts
schemaId: 'invoice-v2.0.0'
schemaPath: 'schemas/documents/invoice-v2.0.0.json'
```

### Phase 23 ExtractionPipeline (Coming)
These schemas will be used for:
- ✅ OCR field validation
- ✅ Hallucination detection
- ✅ Confidence scoring per field
- ✅ Output serialization

### API Endpoints
POST `/api/v1/jobs/structure`
```json
{
  "documentType": "pdf",
  "schemaId": "invoice-v2.0.0",
  "schemaPath": "schemas/documents/invoice-v2.0.0.json"
}
```

---

## 📊 Field Statistics

### Most Common Fields Across All Schemas
- Document Number (invoiceNumber, poNumber, quoteNumber, etc.)
- Date fields (2-3 per document)
- Party information (vendor, supplier, customer, client)
- Items/Services array (minimum 1-2 items)
- Total amount / pricing
- Status tracking

### Validation Patterns
| Pattern | Usage | Examples |
|---|---|---|
| `^[A-Z]{2,3}-\d{4}-\d{3,6}$` | Invoice/Delivery/Contract | INV-2024-001234 |
| `^PO-\d{4}-\d{5}$` | Purchase Orders | PO-2024-12345 |
| `^QUOTE-\d{4}-\d{5}$` | Quotes | QUOTE-2024-00567 |
| `^DN-\d{4}-\d{3,6}$` | Delivery Notes | DN-2024-001 |
| ISO 8601 Date | All dates | 2024-07-01 |

---

## 🔄 Document Relationships

```
Purchase Order (PO-2024-12345)
    ↓
    ├→ Invoice (INV-2024-001234) - references PO
    │   ↓
    │   └→ Delivery Note (DN-2024-001) - references Invoice
    │
    └→ Quote (QUOTE-2024-00567) - optional, pre-sales
    └→ Contract (CONTRACT-2024-00123) - covers all POs from period
```

---

## 🎯 Next Steps (Phase 23+)

1. **ExtractionPipeline Integration**
   - Implement 9-step OCR and field extraction
   - Apply confidence thresholding per schema

2. **Result Persistence**
   - Store extracted data in `jobs/JOB-XXXX/output/`
   - One JSON file per document per schema version

3. **Validation & Quality**
   - Cross-field validation (e.g., items total = invoice total)
   - Hallucination detection using schemas
   - Field-level confidence scores

4. **Advanced Features**
   - Multi-language support
   - Fuzzy matching for vendor names
   - Historical comparison (for recurring documents)
   - Batch processing of related documents

---

## 📝 Usage in Tests

All schemas are tested via:
- **Unit Tests:** `tests/unit/domain/job/Job.test.ts`
- **Integration Tests:** `tests/integration/api/job-structure-routes.test.ts`
- **Fixtures:** `tests/fixtures/job-test-data.ts`

Example test creation:
```typescript
const job = await service.createJob({
  documentType: 'pdf',
  sourceFiles: [...],
  schemaId: 'invoice-v2.0.0',
  schemaPath: 'schemas/documents/invoice-v2.0.0.json',
  schemaVersion: '2.0.0',
  options: {...}
});
```

---

**Last Updated:** 2026-07-11  
**Status:** ✅ Production Ready for Phase 22

