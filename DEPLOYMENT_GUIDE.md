# 🚀 Docker Deployment Guide

## Quick Start - Local Development

```bash
# Clone repository
git clone <repo-url>
cd extractor

# Start all services
docker-compose up -d

# Wait for health checks (30-40 seconds)
docker-compose ps

# Access application
# Frontend: http://localhost
# API: http://localhost/api
# pgAdmin: http://localhost:5050
```

---

## Building Docker Images

### **Backend Image**

```bash
# Build with default tag
docker build -f Dockerfile.backend -t extractor-backend:0.18.0 .

# Build with multiple tags
docker tag extractor-backend:0.18.0 extractor-backend:latest

# Verify build
docker image ls | grep extractor-backend
docker run --rm extractor-backend:0.18.0 npm --version
```

**Dockerfile.backend optimization:**
- Multi-stage build (Alpine base)
- Node 20-Alpine for runtime
- Size: ~350MB

---

### **Frontend Image**

```bash
# Build with default tag
docker build -f Dockerfile.frontend -t extractor-frontend:0.18.0 .

# Build with multiple tags
docker tag extractor-frontend:0.18.0 extractor-frontend:latest

# Verify build
docker image ls | grep extractor-frontend
docker inspect extractor-frontend:0.18.0 | jq '.Config.Env'
```

**Dockerfile.frontend optimization:**
- Multi-stage build (Node 20 → Nginx-Alpine)
- Nginx-Alpine for runtime
- Size: ~50MB

---

## Pushing to Docker Registry

### **Setup 1: Docker Hub**

```bash
# Login to Docker Hub
docker login

# Tag images
docker tag extractor-backend:0.18.0 <username>/extractor-backend:0.18.0
docker tag extractor-frontend:0.18.0 <username>/extractor-frontend:0.18.0

# Push images
docker push <username>/extractor-backend:0.18.0
docker push <username>/extractor-frontend:0.18.0
docker push <username>/extractor-backend:latest
docker push <username>/extractor-frontend:latest

# Verify
curl https://hub.docker.com/v2/repositories/<username>/extractor-backend/tags
```

---

### **Setup 2: Azure Container Registry (ACR)**

```bash
# Login to ACR
az acr login --name <registry-name>

# Or using Docker
az acr credential show --name <registry-name> | jq '.passwords[0].value' | \
  docker login <registry-name>.azurecr.io -u 00000000-0000-0000-0000-000000000000 --password-stdin

# Tag images
docker tag extractor-backend:0.18.0 <registry-name>.azurecr.io/extractor-backend:0.18.0
docker tag extractor-frontend:0.18.0 <registry-name>.azurecr.io/extractor-frontend:0.18.0

# Push images
docker push <registry-name>.azurecr.io/extractor-backend:0.18.0
docker push <registry-name>.azurecr.io/extractor-frontend:0.18.0

# Verify
az acr repository list --name <registry-name>
az acr repository show-tags --name <registry-name> --repository extractor-backend
```

---

### **Setup 3: Private Registry (Harbor)**

```bash
# Login to Harbor
docker login harbor.company.com

# Tag images
docker tag extractor-backend:0.18.0 harbor.company.com/library/extractor-backend:0.18.0
docker tag extractor-frontend:0.18.0 harbor.company.com/library/extractor-frontend:0.18.0

# Push images
docker push harbor.company.com/library/extractor-backend:0.18.0
docker push harbor.company.com/library/extractor-frontend:0.18.0
```

---

## Docker Compose Configurations

### **Development (Current)**

`docker-compose.yml` - Optimal for local development:
- Services: backend, frontend, postgres, redis, pgadmin
- Volumes: Bind mounts for live code reloading
- Ports: Exposed for debugging
- Resources: No limits

### **Staging**

`docker-compose.staging.yml`:

```yaml
version: '3.9'
services:
  backend:
    image: extractor-backend:0.18.0
    environment:
      NODE_ENV: staging
      API_URL: https://staging.api.yourdomain.com
    restart: unless-stopped
    resources:
      limits:
        cpus: '2'
        memory: 1G
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    image: extractor-frontend:0.18.0
    environment:
      VITE_API_URL: https://staging.api.yourdomain.com
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: extractor_user
      POSTGRES_PASSWORD: <secure-password>
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_staging_data:
```

**Deploy staging:**
```bash
docker-compose -f docker-compose.staging.yml up -d
```

---

### **Production**

`docker-compose.production.yml`:

```yaml
version: '3.9'
services:
  backend:
    image: myregistry.azurecr.io/extractor-backend:0.18.0
    environment:
      NODE_ENV: production
      API_URL: https://api.yourdomain.com
      LOG_LEVEL: info
      DB_HOST: postgres.azure.com  # Use managed database
      REDIS_URL: redis://redis.azure.com:6379  # Use managed Redis
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
    logging:
      driver: awslogs
      options:
        awslogs-group: /ecs/extractor-backend
        awslogs-region: us-east-1
        awslogs-stream-prefix: ecs

  frontend:
    image: myregistry.azurecr.io/extractor-frontend:0.18.0
    environment:
      VITE_API_URL: https://api.yourdomain.com
    restart: always
    deploy:
      replicas: 2

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: extractor_db
      POSTGRES_USER: extractor_user
      POSTGRES_PASSWORD: <secure-password>
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: always
    command:
      - "-c"
      - "max_connections=200"
      - "-c"
      - "shared_buffers=256MB"

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_prod_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_prod_data:
  redis_prod_data:
```

**Deploy production:**
```bash
docker-compose -f docker-compose.production.yml up -d
```

---

## Kubernetes Deployment

### **Helm Chart Structure**

```
helm/extractor/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-prod.yaml
├── templates/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-service.yaml
│   ├── postgres-statefulset.yaml
│   ├── redis-deployment.yaml
│   ├── ingress.yaml
│   └── configmap.yaml
```

### **Deploy to Kubernetes**

```bash
# Create namespace
kubectl create namespace extractor

# Deploy with Helm
helm install extractor ./helm/extractor \
  -n extractor \
  -f helm/extractor/values-prod.yaml

# Verify deployment
kubectl get pods -n extractor
kubectl get svc -n extractor
kubectl logs -n extractor deployment/extractor-backend

# Check ingress
kubectl get ingress -n extractor
```

---

## Cloud Platform Deployments

### **Azure Container Instances (ACI)**

```bash
# Create container group
az container create \
  --resource-group mygroup \
  --name extractor-backend \
  --image myregistry.azurecr.io/extractor-backend:0.18.0 \
  --cpu 2 \
  --memory 2 \
  --environment-variables \
    NODE_ENV=production \
    API_URL=https://api.yourdomain.com \
  --registry-login-server myregistry.azurecr.io \
  --registry-username <username> \
  --registry-password <password>

# Show logs
az container logs --resource-group mygroup --name extractor-backend
```

---

### **AWS ECS**

```bash
# Create task definition
aws ecs register-task-definition \
  --family extractor-backend \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 1024 \
  --memory 2048 \
  --container-definitions '[{
    "name": "backend",
    "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/extractor-backend:0.18.0",
    "portMappings": [{"containerPort": 3000}],
    "environment": [{
      "name": "NODE_ENV",
      "value": "production"
    }]
  }]'

# Create service
aws ecs create-service \
  --cluster extractor \
  --service-name extractor-backend \
  --task-definition extractor-backend \
  --desired-count 2
```

---

### **Google Cloud Run**

```bash
# Build and push image
gcloud builds submit --tag gcr.io/myproject/extractor-backend:0.18.0

# Deploy
gcloud run deploy extractor-backend \
  --image gcr.io/myproject/extractor-backend:0.18.0 \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --environment-variables NODE_ENV=production,API_URL=https://api.yourdomain.com
```

---

## Environment Configuration

### **Production .env.production**

```
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database (RDS/Managed)
DB_HOST=postgres.c123.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=extractor_user
DB_PASSWORD=<secure-password>
DB_NAME=extractor_db

# Redis (ElastiCache/Managed)
REDIS_URL=redis://redis.cache.amazonaws.com:6379

# API Configuration
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=<secure-secret>
JWT_EXPIRY=24h

# AWS Services (if using AWS)
AWS_REGION=us-east-1
AWS_S3_BUCKET=extractor-backups
AWS_CLOUDWATCH_GROUP=/ecs/extractor

# Azure Services (if using Azure)
AZURE_STORAGE_ACCOUNT=extractorblobs
AZURE_CONTAINER_NAME=backups
AZURE_KEY_VAULT_URL=https://extractor-keyvault.vault.azure.net

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
DATADOG_API_KEY=<key>

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASSWORD=<key>
```

---

## Image Security Scanning

### **Scan with Trivy**

```bash
# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s

# Scan image
trivy image extractor-backend:0.18.0

# Scan with strict reporting
trivy image --severity HIGH,CRITICAL extractor-backend:0.18.0
```

### **Scan with Docker Scout**

```bash
# Requires Docker 4.17+
docker scout cves extractor-backend:0.18.0
```

---

## Secrets Management

### **Using Docker Secrets (Swarm)**

```bash
# Create secrets
echo "db_password123" | docker secret create db_password -
echo "jwt_secret_key" | docker secret create jwt_secret -

# Use in compose file
services:
  backend:
    secrets:
      - db_password
      - jwt_secret
secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

### **Using Environment Files**

```bash
# Create .env.prod.secrets (not in git)
DB_PASSWORD=<secure>
JWT_SECRET=<secure>

# Load in docker-compose
env_file:
  - .env.prod.secrets
```

### **Using Cloud Vaults**

**Azure Key Vault:**
```bash
# Retrieve secret
az keyvault secret show --vault-name extractor-kv --name db-password

# Reference in container
# Use managed identity to access at runtime
```

**AWS Secrets Manager:**
```bash
# Create secret
aws secretsmanager create-secret \
  --name extractor/db-password \
  --secret-string '{"username":"user","password":"pass"}'

# Retrieve in container
aws secretsmanager get-secret-value --secret-id extractor/db-password
```

---

## Monitoring & Logging

### **Container Logs**

```bash
# View logs
docker-compose logs backend

# Follow logs
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail 50 backend

# Export logs
docker-compose logs backend > backend-logs.txt
```

### **Structured Logging (ELK Stack)**

All application logs should be sent to centralized logging:

```bash
# Docker daemon sends logs to ELK
docker-compose logs backend | filebeat -c filebeat.yml
```

### **Metrics (Prometheus)**

```bash
# Add Prometheus endpoint to backend
GET /api/metrics

# Expose in docker-compose
services:
  backend:
    ports:
      - "9090:9090"  # Prometheus endpoint
```

---

## Performance Tuning

### **Resource Limits**

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4'           # Maximum 4 CPU cores
          memory: 4G          # Maximum 4GB RAM
        reservations:
          cpus: '2'           # Guaranteed 2 cores
          memory: 2G          # Guaranteed 2GB
```

### **Database Connection Pooling**

```bash
# PostgreSQL in docker-compose.yml
command: >
  -c max_connections=200
  -c shared_buffers=256MB
  -c effective_cache_size=1GB
  -c maintenance_work_mem=64MB
  -c checkpoint_completion_target=0.9
  -c wal_buffers=16MB
  -c default_statistics_target=100
```

---

## Backup Strategy

### **Automated Backups**

```bash
# Daily backup at 2 AM
0 2 * * * docker-compose exec postgres pg_dump -U extractor_user extractor_db | \
  gzip > /backups/extractor_$(date +\%Y\%m\%d).sql.gz

# Store in S3
aws s3 cp /backups/extractor_*.sql.gz s3://extractor-backups/
```

---

## Disaster Recovery

### **Recovery Point Objective (RPO): 1 hour**
- Hourly backups to cloud storage
- Point-in-time recovery capability

### **Recovery Time Objective (RTO): 2 hours**
- Pre-built golden image
- Terraform/CloudFormation templates
- Automated restoration scripts

---

## Post-Deployment Validation

```bash
# Health check
curl http://localhost/api/health

# API ready
curl http://localhost/api/config

# Database connected
docker-compose exec backend npm run check-db

# Redis connected
docker-compose exec backend redis-cli ping

# Run smoke tests
npm run test:smoke
```

---

## Rollback Procedure

```bash
# If new version has critical issues:

# 1. Note error in production
# 2. Pull previous version image
docker pull myregistry.azurecr.io/extractor-backend:0.17.0

# 3. Update docker-compose.yml with previous image
sed -i 's/0.18.0/0.17.0/g' docker-compose.production.yml

# 4. Restart services
docker-compose -f docker-compose.production.yml up -d

# 5. Verify rollback
curl http://localhost/api/config | jq '.version'

# 6. Investigate issue with rolled-back version
# 7. Fix and re-deploy when ready
```

---

**Version:** 0.18.0  
**Last Updated:** 2026-07-09  
**Deployment Status:** Ready for Production
