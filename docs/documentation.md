# Documentation

## Getting Started
Welcome to the Audit-Safe Document Extractor. This system provides automated extraction of structured data from various document types.

## Key Features
- **Multi-format Support**: Process PDF, Word, Excel documents
- **Schema-based Extraction**: Define extraction patterns with JSON schemas
- **Rules Engine**: Create complex extraction rules
- **Backup Management**: Automatic and manual backup functionality
- **Dashboard Monitoring**: Real-time system status and statistics

## Core Concepts

### Schemas
Schemas define the structure of data to be extracted. Each schema:
- Defines required fields
- Specifies field types and validation rules
- Can include extraction patterns
- Supports nested structures

### Extraction Rules
Rules determine how data is extracted:
- Pattern matching
- Field mapping
- Validation logic
- Custom transformations

### Backups
The system automatically creates backups:
- Regular scheduled backups
- Manual backup on demand
- Full system state preservation
- Quick restore capability

## Using the Dashboard
The Dashboard provides:
- **Config Status**: Current configuration status
- **Backup Status**: Number of available backups
- **API Status**: Backend connectivity status
- **Extraction Rules**: Active rule count
- **System Information**: Version and port information

## Best Practices
1. Regularly create backups before major changes
2. Test extraction rules on sample documents first
3. Monitor system logs for errors
4. Keep schemas organized and documented
5. Review extraction results for accuracy
