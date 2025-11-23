# Deployment Guide

This guide covers deploying the Liquidation Engine to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Smart Contract Deployment](#smart-contract-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Security Hardening](#security-hardening)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Backend Server**:
- CPU: 2+ cores
- RAM: 4GB minimum, 8GB recommended
- Storage: 20GB SSD
- OS: Ubuntu 20.04+ or similar Linux distribution

**Database**:
- PostgreSQL 14+ (production) or SQLite (development)
- 10GB storage minimum

### Software Dependencies

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version  # Should be 1.70+

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version  # Should be 1.18+

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.0
avm use 0.30.0

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be 18+
```

---

## Smart Contract Deployment

### 1. Configure Solana CLI

```bash
# Set cluster (mainnet-beta for production)
solana config set --url https://api.mainnet-beta.solana.com

# Or use a dedicated RPC provider (recommended)
solana config set --url https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Create/import wallet
solana-keygen new --outfile ~/.config/solana/deployer.json

# Fund wallet (need ~5 SOL for deployment)
# Transfer SOL from exchange or use faucet for devnet
```

### 2. Build Program

```bash
cd programs/liquidation-engine
anchor build
```

### 3. Get Program ID

```bash
solana address -k target/deploy/liquidation_engine-keypair.json
```

Copy this address and update:
- `programs/liquidation-engine/src/lib.rs` (declare_id! macro)
- `Anchor.toml` (programs.liquidation_engine section)

### 4. Rebuild with Correct ID

```bash
anchor build
```

### 5. Deploy

```bash
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

### 6. Initialize Insurance Fund

```bash
# Using Anchor client
anchor run initialize-insurance
```

Or manually:
```bash
solana program invoke <PROGRAM_ID> \
  --instruction-data <INITIALIZE_IX_DATA> \
  --keypair ~/.config/solana/deployer.json
```

---

## Backend Deployment

### Option 1: Systemd Service (Recommended)

#### 1. Build Release Binary

```bash
cd backend
cargo build --release

# Binary will be at: target/release/liquidation-engine-service
```

#### 2. Create Service User

```bash
sudo useradd -r -s /bin/false liquidation-engine
```

#### 3. Copy Binary

```bash
sudo cp target/release/liquidation-engine-service /usr/local/bin/
sudo chown liquidation-engine:liquidation-engine /usr/local/bin/liquidation-engine-service
sudo chmod 755 /usr/local/bin/liquidation-engine-service
```

#### 4. Create Configuration

```bash
sudo mkdir -p /etc/liquidation-engine
sudo nano /etc/liquidation-engine/config.env
```

Add:
```env
DATABASE_URL=postgresql://liquidation:password@localhost/liquidation_db
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
RUST_LOG=info
WALLET_PATH=/etc/liquidation-engine/wallet.json
```

#### 5. Copy Wallet

```bash
sudo cp ~/.config/solana/id.json /etc/liquidation-engine/wallet.json
sudo chown liquidation-engine:liquidation-engine /etc/liquidation-engine/wallet.json
sudo chmod 600 /etc/liquidation-engine/wallet.json
```

#### 6. Create Systemd Service

```bash
sudo nano /etc/systemd/system/liquidation-engine.service
```

Add:
```ini
[Unit]
Description=Liquidation Engine Service
After=network.target postgresql.service

[Service]
Type=simple
User=liquidation-engine
Group=liquidation-engine
EnvironmentFile=/etc/liquidation-engine/config.env
ExecStart=/usr/local/bin/liquidation-engine-service
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/liquidation-engine

[Install]
WantedBy=multi-user.target
```

#### 7. Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable liquidation-engine
sudo systemctl start liquidation-engine

# Check status
sudo systemctl status liquidation-engine

# View logs
sudo journalctl -u liquidation-engine -f
```

---

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
# backend/Dockerfile
FROM rust:1.70 as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl1.1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/liquidation-engine-service /usr/local/bin/

EXPOSE 8080

CMD ["liquidation-engine-service"]
```

#### 2. Build Image

```bash
docker build -t liquidation-engine:latest .
```

#### 3. Run Container

```bash
docker run -d \
  --name liquidation-engine \
  --restart unless-stopped \
  -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/liquidation \
  -e SOLANA_RPC_URL=https://api.mainnet-beta.solana.com \
  -v /path/to/wallet.json:/app/wallet.json:ro \
  liquidation-engine:latest
```

#### 4. Docker Compose (Full Stack)

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: liquidation_db
      POSTGRES_USER: liquidation
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: ./backend
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://liquidation:secure_password@db:5432/liquidation_db
      SOLANA_RPC_URL: ${SOLANA_RPC_URL}
    volumes:
      - ./wallet.json:/app/wallet.json:ro
    ports:
      - "8080:8080"
    restart: unless-stopped

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Configure Environment

Create `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.liquidation-engine.com
```

#### 3. Deploy

```bash
cd frontend
vercel --prod
```

#### 4. Set Custom Domain

```bash
vercel domains add liquidation-engine.com
```

---

### Option 2: Self-Hosted (Nginx)

#### 1. Build Frontend

```bash
cd frontend
npm run build
```

#### 2. Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/liquidation-engine
```

Add:
```nginx
server {
    listen 80;
    server_name liquidation-engine.com www.liquidation-engine.com;

    root /var/www/liquidation-engine;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /_next/static/ {
        alias /var/www/liquidation-engine/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

#### 4. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/liquidation-engine /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d liquidation-engine.com -d www.liquidation-engine.com
```

---

## Database Setup

### PostgreSQL (Production)

#### 1. Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### 2. Create Database

```bash
sudo -u postgres psql

CREATE DATABASE liquidation_db;
CREATE USER liquidation WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE liquidation_db TO liquidation;
\q
```

#### 3. Run Migrations

```bash
cd backend
sqlx database create
sqlx migrate run
```

#### 4. Configure Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-liquidation-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/liquidation-db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U liquidation liquidation_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-liquidation-db.sh
```

Add to crontab:
```bash
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-liquidation-db.sh
```

---

## Monitoring & Logging

### 1. Prometheus Metrics

Add to `backend/src/main.rs`:
```rust
use actix_web_prom::PrometheusMetrics;

let prometheus = PrometheusMetrics::new("liquidation_engine", Some("/metrics"), None);

HttpServer::new(move || {
    App::new()
        .wrap(prometheus.clone())
        // ... other routes
})
```

### 2. Grafana Dashboard

Import dashboard JSON from `monitoring/grafana-dashboard.json`

Key metrics:
- Liquidation count
- Average latency
- Error rate
- Active positions
- Insurance fund balance

### 3. Alerting

Configure alerts in `monitoring/alerts.yml`:
```yaml
groups:
  - name: liquidation_engine
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: InsuranceFundLow
        expr: insurance_fund_balance < 10000000
        for: 1m
        annotations:
          summary: "Insurance fund below threshold"
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Backend API (if exposed)
sudo ufw allow 8080/tcp

sudo ufw enable
```

### 2. Wallet Security

```bash
# Encrypt wallet at rest
gpg --symmetric --cipher-algo AES256 wallet.json

# Use hardware wallet for production (Ledger)
solana-keygen pubkey usb://ledger
```

### 3. Rate Limiting

Add to Nginx:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... proxy settings
}
```

### 4. Environment Variables

Never commit `.env` files. Use secrets management:

**AWS Secrets Manager**:
```bash
aws secretsmanager create-secret \
  --name liquidation-engine/database-url \
  --secret-string "postgresql://..."
```

**HashiCorp Vault**:
```bash
vault kv put secret/liquidation-engine \
  database_url="postgresql://..." \
  solana_rpc_url="https://..."
```

---

## Troubleshooting

### Backend Won't Start

**Check logs**:
```bash
sudo journalctl -u liquidation-engine -n 100
```

**Common issues**:
1. Database connection failed
   - Verify `DATABASE_URL` is correct
   - Check PostgreSQL is running: `sudo systemctl status postgresql`

2. Wallet not found
   - Verify `WALLET_PATH` points to valid keypair
   - Check file permissions: `ls -l /etc/liquidation-engine/wallet.json`

3. Port already in use
   - Check what's using port 8080: `sudo lsof -i :8080`
   - Kill process or change port in config

### Frontend Not Loading

**Check build**:
```bash
cd frontend
npm run build
# Look for errors
```

**Check Nginx**:
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Database Performance Issues

**Check slow queries**:
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Add indexes**:
```sql
CREATE INDEX idx_liquidations_timestamp ON liquidations(timestamp DESC);
CREATE INDEX idx_positions_health ON positions(health_factor);
```

### High Memory Usage

**Check backend**:
```bash
ps aux | grep liquidation-engine-service
```

**Optimize**:
- Reduce position cache size
- Increase monitoring interval
- Use connection pooling for database

---

## Production Checklist

- [ ] Smart contract deployed and verified
- [ ] Backend service running with systemd
- [ ] Database backups configured
- [ ] Frontend deployed with CDN
- [ ] SSL certificates installed
- [ ] Monitoring and alerting set up
- [ ] Firewall rules configured
- [ ] Wallet secured (hardware wallet or encrypted)
- [ ] Environment variables in secrets manager
- [ ] Rate limiting enabled
- [ ] Logs centralized (e.g., CloudWatch, Datadog)
- [ ] Disaster recovery plan documented
- [ ] On-call rotation established

---

## Scaling Considerations

### Horizontal Scaling

**Backend**:
- Run multiple instances behind load balancer
- Use Redis for shared state (liquidation queue)
- Implement leader election for monitoring

**Database**:
- Read replicas for queries
- Write to primary only
- Connection pooling (PgBouncer)

**Frontend**:
- CDN for static assets
- Edge caching (Cloudflare)
- Multiple regions

### Vertical Scaling

**Backend**:
- Increase CPU cores for parallel processing
- More RAM for larger caches
- Faster SSD for database

---

## Cost Estimation

**Monthly Costs (AWS)**:
- EC2 t3.medium (backend): $30
- RDS PostgreSQL db.t3.small: $25
- CloudFront (frontend): $10
- Solana RPC (Alchemy): $50
- Monitoring (Datadog): $15
- **Total**: ~$130/month

**Solana Costs**:
- Transaction fees: ~0.000005 SOL per liquidation
- 1000 liquidations/day = 0.005 SOL/day = ~$0.50/day
- **Monthly**: ~$15

**Grand Total**: ~$145/month

---

## Support

For deployment issues:
- GitHub Discussions: https://github.com/parthparmar07/Liquidation-Engine/discussions
