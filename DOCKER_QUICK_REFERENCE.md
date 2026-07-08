# 🚀 Quick Reference: Docker Stack

**Version**: 0.17.0  
**Status**: Production Ready  
**Last Updated**: 8.7.2026

---

## 📍 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost | - |
| **Backend API** | http://localhost:3000/api | - |
| **pgAdmin** | http://localhost:5050 | admin@extractor.local / admin-pass |
| **PostgreSQL** | localhost:5432 | extractor_user / extractor_pass |
| **Redis** | localhost:6379 | - |

---

## ⚡ Quick Commands

### Start Stack
```bash
# Windows CMD
start-docker.cmd

# PowerShell
.\start-docker.ps1

# Manual
docker-compose up -d
```

### Stop Stack
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild & Restart
```bash
docker-compose build backend && docker-compose up -d backend
docker-compose build frontend && docker-compose up -d frontend
```

### Full Stack Rebuild
```bash
docker-compose up -d --build
```

---

## 🐛 Troubleshooting

### Backend not responding
```bash
# Check logs
docker-compose logs backend

# Test connection
curl http://localhost:3000/api/health

# Verify network
docker network inspect extractor-network
```

### Frontend shows error
```bash
# Check logs
docker-compose logs frontend

# Verify files exist
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Database connection error
```bash
# Check PostgreSQL status
docker-compose logs postgres

# Connect directly
docker-compose exec postgres psql -U extractor_user -d extractor_db

# Check DATABASE_URL
docker-compose exec backend env | grep DATABASE
```

### Port already in use
```bash
# Find process
netstat -ano | findstr :3000

# Either kill the process or change port in docker-compose.yml
```

---

## 🔄 Database Operations

### Backup Database
```bash
docker-compose exec postgres pg_dump -U extractor_user extractor_db > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker-compose exec -T postgres psql -U extractor_user -d extractor_db
```

### Access Database
```bash
# Via pgAdmin: http://localhost:5050
# Via psql CLI
docker-compose exec postgres psql -U extractor_user -d extractor_db

# Via DBeaver/SQL Tools
Host: localhost
Port: 5432
User: extractor_user
Password: extractor_pass
Database: extractor_db
```

---

## 💾 Volume Management

### List Volumes
```bash
docker volume ls | grep extractor
```

### Inspect Volume
```bash
docker volume inspect extractor_postgres_data
```

### Backup Volume
```bash
docker run --rm -v extractor_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres.tar.gz -C /data .
```

### Delete All Data (⚠️ Caution!)
```bash
docker-compose down -v
```

---

## 🔧 Configuration

### Change Environment Variables

Edit `docker-compose.yml`:
```yaml
environment:
  NODE_ENV: production
  PORT: 3000
  DATABASE_URL: postgresql://user:pass@host:port/db
  LOG_LEVEL: info
```

Or override at runtime:
```bash
docker-compose up -d -e NODE_ENV=development
```

### Change Ports

Edit `docker-compose.yml`:
```yaml
backend:
  ports:
    - "3001:3000"  # External:Internal

frontend:
  ports:
    - "8080:80"
```

---

## 📊 Monitoring

### Check Docker Resources
```bash
docker stats

# Or specific container
docker stats extractor-backend
```

### View Docker Events
```bash
docker events --filter "image=*extractor*"
```

### Health Status
```bash
# Health check output
docker inspect --format='{{.State.Health.Status}}' extractor-backend

# Full health details
docker inspect --format='{{json .State.Health}}' extractor-backend | jq
```

---

## 🔐 Security Notes

### Change Default Credentials
1. Edit `docker-compose.yml` environment variables
2. Change PostgreSQL password
3. Change pgAdmin credentials
4. Restart services

### Keep Image Updated
```bash
# Update base images
docker-compose pull

# Rebuild with latest
docker-compose build --no-cache

# Restart
docker-compose up -d
```

### Scan for Vulnerabilities
```bash
# Using Trivy
trivy image extractor-backend:latest
trivy image extractor-frontend:latest
```

---

## 🚀 Deployment

### Push to Docker Hub
```bash
# Tag
docker tag extractor-backend:latest username/extractor-backend:0.17.0

# Login
docker login

# Push
docker push username/extractor-backend:0.17.0
```

### Deploy to AWS ECS
```bash
# Create ECR repository
aws ecr create-repository --repository-name extractor-backend

# Build and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag extractor-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/extractor-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/extractor-backend:latest
```

### Deploy to Azure
```bash
# Create ACR
az acr create --resource-group mygroup --name myregistry --sku Basic

# Build and push
az acr build --registry myregistry --image extractor-backend:latest .
```

---

## 📚 More Information

- **Full Guide**: See `DOCKER_DEPLOYMENT_GUIDE.md`
- **Completion Report**: See `PHASE_18_DOCKER_COMPLETION_REPORT.md`
- **Docker Docs**: https://docs.docker.com
- **Docker Compose**: https://docs.docker.com/compose

---

## 🆘 Help

### Common Issues

**Q: How do I get logs from a container?**  
A: `docker-compose logs -f <service-name>`

**Q: How do I restart a service?**  
A: `docker-compose restart <service-name>`

**Q: How do I access the database?**  
A: Go to http://localhost:5050 (pgAdmin) or use `docker-compose exec postgres psql ...`

**Q: How do I change a configuration?**  
A: Edit `docker-compose.yml`, then run `docker-compose up -d`

**Q: How do I backup my data?**  
A: See backup commands above or use `docker-compose exec postgres pg_dump ...`

**Q: How do I delete all containers and start fresh?**  
A: `docker-compose down -v` (⚠️ This deletes all data!)

---

**Happy containerizing! 🐳**
