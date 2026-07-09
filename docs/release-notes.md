# Release Notes

## Version 0.18.0 - July 8, 2026

### Phase 18: Complete Docker Containerization

#### New Features
- **Docker Compose Stack**: Full containerized deployment
  - PostgreSQL 15 database
  - Redis 7 caching layer
  - Node.js backend
  - React + Nginx frontend
  - pgAdmin management interface

- **Multi-Stage Builds**: Optimized Docker images
  - Backend: ~250MB
  - Frontend: ~20MB
  - Reduced deployment overhead

- **Production-Ready Configuration**
  - Environment variable management
  - CORS configuration
  - Security headers
  - Gzip compression
  - Health checks for all services

#### Bug Fixes
- ✅ Fixed Vite environment variable embedding for frontend
- ✅ Fixed schema endpoint naming (plural/singular mismatch)
- ✅ Improved Docker cache invalidation
- ✅ All API endpoints verified and working

#### Known Issues
- None reported

---

## Version 0.17.0 - July 7, 2026

### Phase 17: Frontend Integration Complete

#### Features
- Enhanced React components
- Improved error handling
- Better user feedback
- Performance optimization

---

## Version 0.16.0 - July 6, 2026

### Phase 16: Database Persistence

#### Features
- Database initialization scripts
- Migration support
- Data persistence across restarts
- Backup system foundation

---

## Version 0.15.0 - July 5, 2026

### Phase 15: Core System MVP

#### Features
- Basic extraction functionality
- Schema management
- Rule creation interface
- Initial dashboard
