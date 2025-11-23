# Backend Service Documentation

## Overview

The backend service is a Rust-based application that monitors Solana positions and executes liquidations automatically. Built with Actix-web for HTTP/WebSocket serving and Tokio for async runtime.

---

## 1. Module Responsibilities

### `main.rs` - Application Entry Point

**Responsibilities**:
- Initialize Tokio runtime
- Load environment variables
- Set up database connection
- Start all services concurrently
- Handle graceful shutdown

**Key Code**:
```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    env_logger::init();
    
    let db = Arc::new(Database::new(&database_url).await?);
    let queue = Arc::new(LiquidationQueue::new());
    let broadcaster = Arc::new(Broadcaster::new());
    
    let engine = LiquidationEngine::new(db.clone(), queue.clone(), broadcaster.clone()).await?;
    let insurance_manager = InsuranceFundManager::new(db.clone(), broadcaster.clone());
    
    tokio::select! {
        result = server::start_server(db, queue, broadcaster) => { },
        _ = engine.start() => { },
    }
    
    Ok(())
}
```

---

### `monitor.rs` - Position Monitoring

**Responsibilities**:
- Fetch positions from Solana every 2 seconds
- Calculate health factors
- Detect liquidatable positions
- Add to priority queue

**Key Functions**:

```rust
pub async fn start(&self) {
    let mut timer = interval(Duration::from_millis(2000));
    loop {
        timer.tick().await;
        self.check_all_positions().await;
    }
}

async fn check_all_positions(&self) -> Result<()> {
    let positions = self.fetch_on_chain_positions().await?;
    
    for position in positions {
        let price = self.oracle.get_mark_price(&position.symbol).await?;
        let health = calculate_health_factor(&position, price);
        
        if health < 1.0 {
            self.queue.push(position.clone(), health).await;
            self.executor.liquidate_position(&position, price, health).await?;
        }
    }
    Ok(())
}
```

**Configuration**:
- `check_interval_ms`: 2000 (2 seconds)
- `program_id`: Smart contract address
- `rpc_url`: Solana RPC endpoint

---

### `executor.rs` - Liquidation Execution

**Responsibilities**:
- Build liquidation transactions
- Sign with liquidator keypair
- Submit to Solana RPC
- Handle retries on failure
- Record results to database

**Key Functions**:

```rust
pub async fn liquidate_position(
    &self,
    position: &Position,
    mark_price: f64,
    margin_ratio: f64,
) -> Result<()> {
    let maintenance = self.get_maintenance_margin_ratio(position.leverage as u16);
    
    if margin_ratio < maintenance * 0.1 {
        self.execute_full_liquidation(position, mark_price, margin_ratio).await?;
    } else {
        // Partial liquidation (simplified to full for now)
        self.execute_full_liquidation(position, mark_price, margin_ratio).await?;
    }
    
    Ok(())
}

async fn execute_full_liquidation(...) -> Result<()> {
    // Build transaction
    let instruction = build_liquidation_instruction(position)?;
    let transaction = Transaction::new_signed_with_payer(...);
    
    // Submit
    match self.rpc_client.send_and_confirm_transaction(&transaction) {
        Ok(signature) => {
            self.db.record_liquidation(...).await?;
            Ok(())
        }
        Err(e) => {
            self.db.record_failed_liquidation(...).await?;
            Err(e.into())
        }
    }
}
```

**Configuration**:
- `wallet_path`: Liquidator keypair file
- `priority_fee`: 1,000,000 micro-lamports
- `compute_budget`: 200,000 units
- `retry_attempts`: 3

---

### `queue.rs` - Priority Queue Management

**Responsibilities**:
- Maintain min-heap by health factor
- Deduplication (prevent double liquidation)
- Provide snapshots for API

**Data Structure**:
```rust
pub struct LiquidationQueue {
    heap: Mutex<BinaryHeap<Reverse<QueueItem>>>,
    seen: Mutex<HashSet<String>>,
}

struct QueueItem {
    position: Position,
    priority: OrderedFloat<f64>,  // Health factor
}
```

**Key Functions**:
```rust
pub async fn push(&self, position: Position, priority: f64) {
    let mut seen = self.seen.lock().await;
    if seen.contains(&position.id) {
        return;  // Already queued
    }
    
    seen.insert(position.id.clone());
    let mut heap = self.heap.lock().await;
    heap.push(Reverse(QueueItem { position, priority: priority.into() }));
}

pub async fn pop(&self) -> Option<Position> {
    let mut heap = self.heap.lock().await;
    heap.pop().map(|Reverse(item)| {
        let mut seen = self.seen.lock().await;
        seen.remove(&item.position.id);
        item.position
    })
}
```

---

### `oracle.rs` - Price Oracle Client

**Responsibilities**:
- Fetch prices from oracle (currently mock)
- Cache prices (2-second TTL)
- Validate price data

**Key Functions**:
```rust
pub async fn get_mark_price(&self, symbol: &str) -> Result<f64> {
    // TODO: Integrate Pyth Network
    // For now, return mock prices
    Ok(match symbol {
        "SOL/USD" => 100.0,
        "BTC/USD" => 43500.0,
        _ => 1.0,
    })
}
```

**Production Integration** (Pyth):
```rust
use pyth_sdk_solana::load_price_feed_from_account;

pub async fn get_pyth_price(&self, price_account: &Pubkey) -> Result<f64> {
    let account_data = self.rpc_client.get_account_data(price_account).await?;
    let price_feed = load_price_feed_from_account(&account_data)?;
    
    let price = price_feed.get_current_price()
        .ok_or(Error::PriceUnavailable)?;
    
    // Validate
    require!(price.publish_time > now() - 60, Error::StalePrice);
    require!(price.conf < price.price * 0.01, Error::LowConfidence);
    
    Ok(price.price as f64 / 10f64.powi(price.expo))
}
```

---

### `insurance.rs` - Insurance Fund Manager

**Responsibilities**:
- Monitor insurance fund balance
- Broadcast balance updates
- Handle bad debt scenarios

**Key Functions**:
```rust
pub async fn start(&mut self) {
    let mut interval = tokio::time::interval(Duration::from_secs(10));
    
    loop {
        interval.tick().await;
        if let Ok(balance) = self.check_balance().await {
            self.broadcaster.send(WsMessage::InsuranceFundUpdate { balance });
        }
    }
}

async fn check_balance(&self) -> Result<u64> {
    let (pda, _) = Pubkey::find_program_address(&[b"insurance_fund"], &program_id);
    let account = self.rpc_client.get_account(&pda).await?;
    
    // Deserialize InsuranceFund account
    let fund: InsuranceFund = try_from_slice(&account.data[8..])?;
    Ok(fund.balance)
}
```

---

### `websocket.rs` - WebSocket Broadcasting

**Responsibilities**:
- Manage WebSocket connections
- Broadcast events to all clients
- Handle heartbeats (ping/pong)

**Message Types**:
```rust
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "liquidation")]
    LiquidationEvent {
        position_id: String,
        symbol: String,
        amount: f64,
        price: f64,
    },
    
    #[serde(rename = "price_update")]
    PriceUpdate {
        symbol: String,
        price: f64,
    },
    
    #[serde(rename = "insurance_fund")]
    InsuranceFundUpdate {
        balance: u64,
    },
}
```

**Broadcasting**:
```rust
pub struct Broadcaster {
    clients: Arc<Mutex<Vec<mpsc::UnboundedSender<String>>>>,
}

impl Broadcaster {
    pub fn send(&self, message: WsMessage) {
        let json = serde_json::to_string(&message).unwrap();
        let mut clients = self.clients.lock().unwrap();
        
        clients.retain(|tx| tx.send(json.clone()).is_ok());
    }
}
```

---

### `db.rs` - Database Operations

**Responsibilities**:
- SQLite/PostgreSQL connection
- Record liquidations
- Query historical data
- Manage schema

**Key Functions**:
```rust
pub async fn record_liquidation(
    &self,
    position_id: &str,
    owner: &str,
    symbol: &str,
    size: i64,
    price: i64,
    liquidator: &str,
    reward: i64,
    bad_debt: i64,
    health_factor: f64,
    is_full: bool,
) -> Result<()> {
    sqlx::query!(
        "INSERT INTO liquidations (...) VALUES (...)",
        position_id, owner, symbol, size, price, liquidator, reward, bad_debt, health_factor, is_full
    )
    .execute(&self.pool)
    .await?;
    
    Ok(())
}
```

**Schema**:
```sql
CREATE TABLE liquidations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_pubkey TEXT NOT NULL,
    owner_pubkey TEXT NOT NULL,
    symbol TEXT NOT NULL,
    liquidated_size INTEGER NOT NULL,
    liquidation_price INTEGER NOT NULL,
    liquidator_pubkey TEXT NOT NULL,
    liquidator_reward INTEGER NOT NULL,
    bad_debt INTEGER NOT NULL,
    health_factor_before REAL NOT NULL,
    is_full_liquidation INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### `server.rs` - HTTP/WebSocket Server

**Responsibilities**:
- Serve REST API endpoints
- Handle WebSocket connections
- CORS configuration

**API Endpoints**:
```rust
pub async fn start_server(
    db: Arc<Database>,
    queue: Arc<LiquidationQueue>,
    broadcaster: Arc<Broadcaster>,
) -> std::io::Result<()> {
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(queue.clone()))
            .app_data(web::Data::new(broadcaster.clone()))
            .wrap(Cors::permissive())
            .route("/health", web::get().to(health_check))
            .route("/insurance/balance", web::get().to(get_insurance_balance))
            .route("/liquidations/pending", web::get().to(get_pending_liquidations))
            .route("/liquidations/recent", web::get().to(get_recent_liquidations))
            .route("/stats", web::get().to(get_stats))
            .route("/ws", web::get().to(ws_handler))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
```

---

## 2. Configuration Parameters

### Environment Variables

```env
# Database
DATABASE_URL=sqlite:liquidation_engine.db
# or
DATABASE_URL=postgresql://user:pass@localhost/liquidation_db

# Solana
SOLANA_RPC_URL=http://127.0.0.1:8899
# or
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Wallet
WALLET_PATH=/path/to/keypair.json

# Logging
RUST_LOG=info
# Options: error, warn, info, debug, trace

# Server
SERVER_PORT=8080
```

### Runtime Configuration

```rust
// monitor.rs
const CHECK_INTERVAL_MS: u64 = 2000;  // 2 seconds

// executor.rs
const PRIORITY_FEE: u64 = 1_000_000;  // 0.001 SOL
const COMPUTE_BUDGET: u32 = 200_000;
const RETRY_ATTEMPTS: u32 = 3;

// oracle.rs
const PRICE_CACHE_TTL: Duration = Duration::from_secs(2);

// insurance.rs
const BALANCE_CHECK_INTERVAL: Duration = Duration::from_secs(10);
```

---

## 3. API Specifications

See `docs/API.md` for complete API documentation.

**Quick Reference**:
- `GET /health` - Health check
- `GET /insurance/balance` - Insurance fund balance
- `GET /liquidations/pending` - Pending liquidations
- `GET /liquidations/recent` - Recent liquidations
- `GET /stats` - System statistics
- `GET /ws` - WebSocket endpoint

---

## 4. Monitoring and Alerting

### Logging

**Log Levels**:
```rust
error!("Critical error: {}", e);  // Unrecoverable errors
warn!("Warning: {}", msg);        // Potential issues
info!("Info: {}", msg);           // Important events
debug!("Debug: {}", msg);         // Detailed debugging
trace!("Trace: {}", msg);         // Very verbose
```

**Key Log Events**:
- Position fetched
- Liquidation triggered
- Transaction submitted
- Transaction confirmed
- Error occurred

### Metrics

**Prometheus Integration** (optional):
```rust
use actix_web_prom::PrometheusMetrics;

let prometheus = PrometheusMetrics::new("liquidation_engine", Some("/metrics"), None);

HttpServer::new(move || {
    App::new()
        .wrap(prometheus.clone())
        // ... routes
})
```

**Key Metrics**:
- `liquidations_total`: Counter
- `liquidation_latency_seconds`: Histogram
- `positions_monitored`: Gauge
- `insurance_fund_balance`: Gauge
- `failed_liquidations_total`: Counter

### Alerting

**Alert Conditions**:
1. Insurance fund < 5% of TVL
2. Failed liquidation rate > 5%
3. Average latency > 100ms
4. RPC errors > 10/minute
5. Database connection lost

**Alert Channels**:
- Email
- Slack/Discord webhook
- PagerDuty (production)

---

## Conclusion

The backend service is designed for reliability, performance, and observability. All modules are well-separated with clear responsibilities, making the system maintainable and scalable.
