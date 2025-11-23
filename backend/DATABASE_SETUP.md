# Database Setup Guide

## PostgreSQL Installation & Setup

### Step 1: Install PostgreSQL

**Windows:**
```powershell
# Download and install from: https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql

# Or use Docker (recommended):
docker run --name liquidation-postgres `
  -e POSTGRES_PASSWORD=liquidation_pass `
  -e POSTGRES_USER=liquidation_user `
  -e POSTGRES_DB=liquidation_engine `
  -p 5432:5432 `
  -d postgres:15
```

### Step 2: Create Database

**If not using Docker:**
```powershell
# Connect to PostgreSQL
psql -U postgres

# Create user and database
CREATE USER liquidation_user WITH PASSWORD 'liquidation_pass';
CREATE DATABASE liquidation_engine OWNER liquidation_user;
GRANT ALL PRIVILEGES ON DATABASE liquidation_engine TO liquidation_user;
\q
```

### Step 3: Configure Environment

```powershell
# Copy example env file
cd C:\Users\Parth\OneDrive\Desktop\Liquidation\backend
copy .env.example .env

# Edit .env and update DATABASE_URL if needed
```

### Step 4: Run Database Migrations

The backend will automatically create tables on first run, but you can also run migrations manually:

```powershell
# Install sqlx-cli
cargo install sqlx-cli --no-default-features --features postgres

# Run migrations (if you create migration files)
sqlx migrate run
```

---

## Database Schema

### Tables Created:

#### 1. `liquidations`
Stores all liquidation events

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| position_pubkey | VARCHAR(44) | Position account address |
| owner_pubkey | VARCHAR(44) | Position owner address |
| symbol | VARCHAR(20) | Trading pair (e.g., SOL/USD) |
| liquidated_size | BIGINT | Amount liquidated |
| liquidation_price | BIGINT | Price at liquidation |
| liquidator_pubkey | VARCHAR(44) | Liquidator address |
| liquidator_reward | BIGINT | Reward paid to liquidator |
| bad_debt | BIGINT | Bad debt covered by insurance |
| health_factor_before | DOUBLE PRECISION | Health factor before liquidation |
| is_full_liquidation | BOOLEAN | Full or partial liquidation |
| timestamp | TIMESTAMPTZ | When liquidation occurred |

#### 2. `position_snapshots`
Historical position data for analytics

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| position_pubkey | VARCHAR(44) | Position account address |
| owner_pubkey | VARCHAR(44) | Position owner address |
| symbol | VARCHAR(20) | Trading pair |
| size | BIGINT | Position size |
| collateral | BIGINT | Collateral amount |
| entry_price | BIGINT | Entry price |
| current_price | BIGINT | Current market price |
| health_factor | DOUBLE PRECISION | Current health factor |
| timestamp | TIMESTAMPTZ | Snapshot time |

---

## Usage in Backend

The database is automatically initialized when the backend starts:

```rust
use crate::db::Database;

// Connect to database
let db = Database::new(&database_url).await?;

// Initialize schema
db.init_schema().await?;

// Record a liquidation
db.record_liquidation(
    position_pubkey,
    owner_pubkey,
    symbol,
    liquidated_size,
    liquidation_price,
    liquidator_pubkey,
    liquidator_reward,
    bad_debt,
    health_factor_before,
    is_full_liquidation,
).await?;

// Get recent liquidations
let liquidations = db.get_recent_liquidations(10).await?;

// Get stats
let stats = db.get_liquidation_stats(24).await?;
```

---

## Querying Data

### Get Recent Liquidations
```sql
SELECT * FROM liquidations 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Get Liquidation Volume by Symbol
```sql
SELECT 
    symbol,
    COUNT(*) as count,
    SUM(liquidated_size) as total_volume,
    SUM(liquidator_reward) as total_rewards
FROM liquidations
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY symbol
ORDER BY total_volume DESC;
```

### Get Position Health History
```sql
SELECT 
    timestamp,
    health_factor,
    current_price
FROM position_snapshots
WHERE position_pubkey = 'YOUR_POSITION_PUBKEY'
ORDER BY timestamp DESC
LIMIT 100;
```

### Get Average Health Factor Over Time
```sql
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    AVG(health_factor) as avg_health
FROM position_snapshots
GROUP BY hour
ORDER BY hour DESC;
```

---

## Frontend API Integration

Create a simple API endpoint to serve data to the frontend:

```rust
// In backend, add an HTTP server (using axum or actix-web)
use axum::{Router, routing::get, Json};

async fn get_liquidations(db: Database) -> Json<Vec<LiquidationRecord>> {
    let liquidations = db.get_recent_liquidations(50).await.unwrap();
    Json(liquidations)
}

async fn get_stats(db: Database) -> Json<LiquidationStats> {
    let stats = db.get_liquidation_stats(24).await.unwrap();
    Json(stats)
}

let app = Router::new()
    .route("/api/liquidations", get(get_liquidations))
    .route("/api/stats", get(get_stats));
```

Then in frontend:
```typescript
// Fetch real liquidation data
const response = await fetch('http://localhost:3001/api/liquidations');
const liquidations = await response.json();
```

---

## Docker Compose Setup (Optional)

Create `docker-compose.yml` in backend directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: liquidation_user
      POSTGRES_PASSWORD: liquidation_pass
      POSTGRES_DB: liquidation_engine
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```powershell
docker-compose up -d
```

---

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `pg_isready`
- Verify port 5432 is open
- Check DATABASE_URL in .env

### Permission Denied
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE liquidation_engine TO liquidation_user;`

### Tables Not Created
- Check logs for errors
- Manually run: `db.init_schema().await?;`

---

## Next Steps

1. ✅ Install PostgreSQL
2. ✅ Create database and user
3. ✅ Copy .env.example to .env
4. ✅ Run backend (tables auto-create)
5. ✅ Query data for analytics
