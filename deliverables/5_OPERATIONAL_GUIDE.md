# Operational Guide

## Overview

This guide provides step-by-step instructions for operating the Liquidation Engine in production, including running the service, monitoring health, handling issues, and managing the insurance fund.

---

## 1. How to Run the Liquidation Engine

### Prerequisites

**System Requirements**:
- Ubuntu 20.04+ or similar Linux distribution
- 2+ CPU cores
- 4GB RAM minimum (8GB recommended)
- 20GB SSD storage
- Solana CLI installed
- Rust 1.70+ installed

**Software Dependencies**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install PostgreSQL (production)
sudo apt update
sudo apt install postgresql postgresql-contrib
```

---

### Step 1: Clone Repository

```bash
git clone https://github.com/parthparmar07/Liquidation-Engine.git
cd Liquidation-Engine/backend
```

---

### Step 2: Configure Environment

Create `.env` file:
```bash
cp .env.example .env
nano .env
```

Add configuration:
```env
# Database
DATABASE_URL=postgresql://liquidation:password@localhost/liquidation_db

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Or use dedicated RPC provider:
# SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Wallet
WALLET_PATH=/path/to/liquidator-keypair.json

# Logging
RUST_LOG=info

# Server
SERVER_PORT=8080
```

---

### Step 3: Set Up Database

**Create Database**:
```bash
sudo -u postgres psql
CREATE DATABASE liquidation_db;
CREATE USER liquidation WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE liquidation_db TO liquidation;
\q
```

**Run Migrations**:
```bash
sqlx database create
sqlx migrate run
```

---

### Step 4: Prepare Liquidator Wallet

**Generate New Keypair**:
```bash
solana-keygen new --outfile ~/liquidator-keypair.json
```

**Or Import Existing**:
```bash
cp /path/to/existing/keypair.json ~/liquidator-keypair.json
chmod 600 ~/liquidator-keypair.json
```

**Fund Wallet** (for transaction fees):
```bash
# Check balance
solana balance ~/liquidator-keypair.json

# Transfer SOL from another wallet
solana transfer <LIQUIDATOR_PUBKEY> 1 --from /path/to/funded-wallet.json
```

**Recommended Balance**: 0.5-1 SOL for transaction fees

---

### Step 5: Build and Run

**Development Mode**:
```bash
cargo run
```

**Production Mode**:
```bash
# Build release binary
cargo build --release

# Run
./target/release/liquidation-engine-service
```

**Expected Output**:
```
[2024-01-15T10:00:00Z INFO  liquidation_engine_service] Starting Liquidation Engine Service...
[2024-01-15T10:00:00Z INFO  liquidation_engine_service] Connecting to database: postgresql://...
[2024-01-15T10:00:00Z INFO  liquidation_engine_service] Database connected successfully
[2024-01-15T10:00:00Z INFO  liquidation_engine_service] Database schema initialized
[2024-01-15T10:00:01Z INFO  actix_server::builder] starting 16 workers
[2024-01-15T10:00:01Z INFO  actix_server::server] starting service: "actix-web-service-0.0.0.0:8080"
[2024-01-15T10:00:01Z INFO  liquidation_engine_service::monitor] Liquidation Engine monitoring program: HCJaVaM9...
```

---

### Step 6: Verify Service is Running

**Check Health Endpoint**:
```bash
curl http://localhost:8080/health
# Expected: {"status":"ok"}
```

**Check Insurance Fund**:
```bash
curl http://localhost:8080/insurance/balance
# Expected: {"balance":50000000,...}
```

**Check Logs**:
```bash
tail -f /var/log/liquidation-engine/service.log
```

---

### Step 7: Run as Systemd Service (Production)

**Create Service File**:
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
WorkingDirectory=/opt/liquidation-engine
EnvironmentFile=/etc/liquidation-engine/config.env
ExecStart=/usr/local/bin/liquidation-engine-service
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Enable and Start**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable liquidation-engine
sudo systemctl start liquidation-engine

# Check status
sudo systemctl status liquidation-engine
```

---

## 2. Monitoring Liquidation Health

### Dashboard Metrics

**Access Dashboard**:
- URL: `http://localhost:3000/dashboard`
- Metrics displayed:
  - Active positions
  - At-risk positions
  - Insurance fund balance
  - Recent liquidations

### Key Performance Indicators (KPIs)

**1. Liquidation Latency**:
```bash
# Query database
psql -d liquidation_db -c "
  SELECT 
    AVG(EXTRACT(EPOCH FROM (timestamp - created_at))) as avg_latency_seconds
  FROM liquidations
  WHERE created_at > NOW() - INTERVAL '1 hour';
"
```

**Target**: < 50ms average

**2. Success Rate**:
```bash
# Calculate success rate
psql -d liquidation_db -c "
  SELECT 
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE error_message IS NULL) as successful,
    ROUND(100.0 * COUNT(*) FILTER (WHERE error_message IS NULL) / COUNT(*), 2) as success_rate_pct
  FROM liquidations
  WHERE created_at > NOW() - INTERVAL '24 hours';
"
```

**Target**: > 99% success rate

**3. Insurance Fund Ratio**:
```bash
# Check insurance fund health
curl http://localhost:8080/insurance/balance | jq '.utilization_ratio'
```

**Target**: < 0.5 (50% utilization)

**4. Position Health Distribution**:
```bash
# Query positions by health
curl http://localhost:8080/liquidations/pending | jq '.positions | group_by(.health_factor < 1.0) | map({healthy: length})'
```

### Automated Monitoring

**Prometheus Metrics** (if enabled):
```bash
# Scrape metrics
curl http://localhost:8080/metrics

# Key metrics:
# - liquidations_total
# - liquidation_latency_seconds
# - positions_monitored
# - insurance_fund_balance
# - failed_liquidations_total
```

**Grafana Dashboard**:
- Import dashboard from `monitoring/grafana-dashboard.json`
- Configure data source: Prometheus
- Set refresh interval: 5 seconds

### Log Monitoring

**View Real-time Logs**:
```bash
# Systemd logs
sudo journalctl -u liquidation-engine -f

# Filter by level
sudo journalctl -u liquidation-engine -p err  # Errors only
sudo journalctl -u liquidation-engine -p warning  # Warnings and above
```

**Search Logs**:
```bash
# Find liquidation events
sudo journalctl -u liquidation-engine | grep "LIQUIDATION TRIGGERED"

# Find errors
sudo journalctl -u liquidation-engine | grep "ERROR"
```

### Alerting Rules

**Set Up Alerts** (example with Prometheus Alertmanager):

```yaml
# alerts.yml
groups:
  - name: liquidation_engine
    rules:
      - alert: HighFailureRate
        expr: rate(failed_liquidations_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High liquidation failure rate"
          
      - alert: InsuranceFundLow
        expr: insurance_fund_balance < 10000000
        for: 1m
        annotations:
          summary: "Insurance fund below 10 SOL"
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, liquidation_latency_seconds) > 0.1
        for: 5m
        annotations:
          summary: "95th percentile latency > 100ms"
```

---

## 3. Handling Stuck Liquidations

### Identifying Stuck Liquidations

**Query Failed Liquidations**:
```bash
curl http://localhost:8080/liquidations/failed
```

**Database Query**:
```sql
SELECT 
  position_pubkey,
  error_message,
  retry_count,
  timestamp
FROM failed_liquidations
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### Common Causes

**1. RPC Timeout**:
- **Symptom**: `error_message` contains "timeout"
- **Fix**: Increase RPC timeout or use faster RPC provider

**2. Insufficient Compute Units**:
- **Symptom**: `error_message` contains "exceeded CUs"
- **Fix**: Increase compute budget in `executor.rs`

**3. Already Liquidated**:
- **Symptom**: `error_message` contains "already liquidated"
- **Fix**: Normal, deduplication working

**4. Insufficient Funds**:
- **Symptom**: `error_message` contains "insufficient funds"
- **Fix**: Fund liquidator wallet

### Manual Intervention

**Retry Failed Liquidation**:
```bash
# Get position details
curl "http://localhost:8080/positions/<POSITION_PUBKEY>"

# Manually trigger liquidation (if needed)
# Use Solana CLI or custom script
solana program invoke <PROGRAM_ID> \
  --instruction-data <LIQUIDATE_IX_DATA> \
  --keypair ~/liquidator-keypair.json
```

**Clear Stuck Queue**:
```bash
# Restart service to clear in-memory queue
sudo systemctl restart liquidation-engine

# Or implement admin endpoint to clear queue
curl -X POST http://localhost:8080/admin/clear-queue
```

### Prevention

**1. Increase Retry Attempts**:
```rust
// executor.rs
const RETRY_ATTEMPTS: u32 = 5;  // Increase from 3
```

**2. Exponential Backoff**:
```rust
for attempt in 0..RETRY_ATTEMPTS {
    let delay = Duration::from_millis(100 * 2u64.pow(attempt));
    tokio::time::sleep(delay).await;
    
    match execute_liquidation().await {
        Ok(_) => return Ok(()),
        Err(e) if attempt == RETRY_ATTEMPTS - 1 => return Err(e),
        Err(_) => continue,
    }
}
```

**3. Priority Fee Adjustment**:
```rust
// Dynamically increase priority fee on retry
let priority_fee = BASE_PRIORITY_FEE * (attempt + 1);
```

---

## 4. Insurance Fund Management

### Checking Balance

**Via API**:
```bash
curl http://localhost:8080/insurance/balance | jq
```

**Via Solana CLI**:
```bash
# Get insurance fund PDA
solana-keygen grind --starts-with insurance:1

# Check balance
solana balance <INSURANCE_FUND_PDA>
```

**Via Dashboard**:
- Navigate to `http://localhost:3000/dashboard`
- View "Insurance Fund" KPI card

### Contributing to Insurance Fund

**Via Smart Contract**:
```bash
# Using Anchor CLI
anchor run contribute-insurance -- --amount 1000000000  # 1 SOL
```

**Via TypeScript**:
```typescript
await program.methods
  .contributeToInsurance(new BN(1_000_000_000))  // 1 SOL
  .accounts({
    insuranceFund: insuranceFundPDA,
    contributor: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Monitoring Utilization

**Calculate Utilization Ratio**:
```
Utilization Ratio = Total Bad Debt Covered / Total Contributions
```

**Query from Database**:
```sql
SELECT 
  SUM(bad_debt) as total_bad_debt,
  (SELECT SUM(amount) FROM insurance_fund_transactions WHERE transaction_type = 'contribution') as total_contributions,
  ROUND(100.0 * SUM(bad_debt) / (SELECT SUM(amount) FROM insurance_fund_transactions WHERE transaction_type = 'contribution'), 2) as utilization_pct
FROM liquidations;
```

**Healthy Range**: 0-50% utilization

### Withdrawal Policy

**Current**: No withdrawals (protocol-owned)

**Future Enhancement**:
- Governance-approved withdrawals
- Minimum balance requirements
- Time-locked withdrawals

### Emergency Procedures

**Scenario: Insurance Fund Depleted**

**Step 1: Halt Protocol**:
```bash
# Implement emergency stop
curl -X POST http://localhost:8080/admin/emergency-stop \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Step 2: Assess Situation**:
```sql
SELECT 
  SUM(bad_debt) as total_bad_debt,
  COUNT(*) as affected_liquidations
FROM liquidations
WHERE bad_debt > 0 AND timestamp > NOW() - INTERVAL '24 hours';
```

**Step 3: Fundraise**:
- Create governance proposal
- Community fundraising campaign
- Protocol treasury allocation

**Step 4: Resume Operations**:
```bash
curl -X POST http://localhost:8080/admin/resume \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 5. Troubleshooting

### Service Won't Start

**Check Logs**:
```bash
sudo journalctl -u liquidation-engine -n 100
```

**Common Issues**:

1. **Database Connection Failed**:
   ```
   Error: Database connection failed
   ```
   **Fix**: Check `DATABASE_URL` and PostgreSQL status

2. **Wallet Not Found**:
   ```
   Error: Failed to read keypair file
   ```
   **Fix**: Verify `WALLET_PATH` and file permissions

3. **Port Already in Use**:
   ```
   Error: Address already in use
   ```
   **Fix**: Change `SERVER_PORT` or kill process on port 8080

### High CPU Usage

**Check Resource Usage**:
```bash
top -p $(pgrep liquidation-engine-service)
```

**Potential Causes**:
- Too many positions (> 10,000)
- RPC rate limiting (constant retries)
- Memory leak (check with `valgrind`)

**Solutions**:
- Increase monitoring interval
- Use connection pooling
- Optimize database queries

### Database Performance Issues

**Check Slow Queries**:
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Add Indexes**:
```sql
CREATE INDEX idx_liquidations_timestamp ON liquidations(timestamp DESC);
CREATE INDEX idx_positions_health ON positions(health_factor);
```

**Vacuum Database**:
```bash
psql -d liquidation_db -c "VACUUM ANALYZE;"
```

---

## 6. Maintenance

### Regular Tasks

**Daily**:
- Check service status
- Review error logs
- Monitor insurance fund balance

**Weekly**:
- Review liquidation metrics
- Check database size
- Backup database

**Monthly**:
- Update dependencies
- Review and optimize queries
- Audit liquidation history

### Backup Procedures

**Database Backup**:
```bash
# Create backup
pg_dump liquidation_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore backup
gunzip -c backup_20240115.sql.gz | psql liquidation_db
```

**Wallet Backup**:
```bash
# Encrypt and backup wallet
gpg --symmetric --cipher-algo AES256 ~/liquidator-keypair.json
# Store encrypted file securely
```

### Updates

**Update Service**:
```bash
# Pull latest code
git pull origin main

# Rebuild
cargo build --release

# Restart service
sudo systemctl restart liquidation-engine
```

**Update Dependencies**:
```bash
cargo update
cargo build --release
```

---

## 7. Security Best Practices

1. **Wallet Security**:
   - Use hardware wallet (Ledger) for production
   - Encrypt keypair file at rest
   - Restrict file permissions (chmod 600)

2. **Network Security**:
   - Use firewall (ufw)
   - Restrict SSH access
   - Use VPN for admin access

3. **Monitoring**:
   - Set up alerts for unusual activity
   - Monitor wallet balance
   - Track failed transactions

4. **Access Control**:
   - Limit sudo access
   - Use separate user for service
   - Implement admin API authentication

---

## Conclusion

This operational guide provides all necessary information to run and maintain the Liquidation Engine in production. Follow these procedures to ensure reliable, secure operation.

For additional support, refer to:
- GitHub Issues: https://github.com/parthparmar07/Liquidation-Engine/issues
- Documentation: https://github.com/parthparmar07/Liquidation-Engine/tree/main/docs
