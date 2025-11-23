# Architecture Documentation

## System Overview

The Liquidation Engine is a distributed system designed to monitor and liquidate undercollateralized positions on Solana in real-time. It consists of three main layers: Smart Contract, Backend Service, and Frontend Dashboard.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Traders    │    │  Liquidators │    │   Admins     │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          │ HTTP/WS          │ HTTP/WS          │ HTTP/WS
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js Application (Port 3000)              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │   Landing   │  │  Dashboard  │  │  Settings   │      │   │
│  │  │    Page     │  │    Page     │  │    Page     │      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│  │                                                            │   │
│  │  Components: KPI Cards, Radar Table, Charts, Logs        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                                          ▲
          │ REST API                                 │ WebSocket
          │ (JSON)                                   │ (Real-time)
          ▼                                          │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Rust Backend Service (Port 8080)                  │   │
│  │                                                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │   Monitor   │  │  Executor   │  │   Queue     │      │   │
│  │  │   Engine    │  │   Engine    │  │   Manager   │      │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │   │
│  │         │                │                │              │   │
│  │         └────────────────┼────────────────┘              │   │
│  │                          │                               │   │
│  │  ┌─────────────┐  ┌──────▼──────┐  ┌─────────────┐      │   │
│  │  │  Insurance  │  │   Oracle    │  │  WebSocket  │      │   │
│  │  │    Fund     │  │   Client    │  │  Broadcaster│      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │         SQLite Database (Persistence)             │    │   │
│  │  │  - Liquidations  - Snapshots  - Failed Attempts  │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                                          ▲
          │ RPC Calls                                │ Account
          │ (Transactions)                           │ Subscriptions
          ▼                                          │
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Solana Blockchain                        │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │    Liquidation Engine Program (Anchor)           │    │   │
│  │  │    ID: HCJaVaM9GEH4nYoX6UquxWXroXJyjSLp2LLKCa1gg5NJ│    │   │
│  │  │                                                    │    │   │
│  │  │  Instructions:                                    │    │   │
│  │  │  - create_position                                │    │   │
│  │  │  - liquidate_full                                 │    │   │
│  │  │  - contribute_to_insurance                        │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  Position    │  │  Insurance   │  │   Oracle     │   │   │
│  │  │  Accounts    │  │  Fund PDA    │  │   Feeds      │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Smart Contract Layer (Anchor Program)

**Purpose**: On-chain state management and liquidation execution

**Key Components**:
- **Position Accounts**: Store leveraged position data
  - Owner (Pubkey)
  - Symbol (String)
  - Size, Collateral, Entry Price (u64)
  - Leverage (u16)
  - Maintenance Margin (u64)

- **Insurance Fund PDA**: Program-derived account holding insurance funds
  - Derived from seed: `b"insurance_fund"`
  - Stores total balance and metadata

**Instructions**:
1. `create_position`: Opens a new leveraged position
2. `liquidate_full`: Closes underwater position, transfers collateral
3. `contribute_to_insurance`: Adds funds to insurance pool

**Security Features**:
- Health factor validation before liquidation
- PDA-based fund management (no private keys)
- Event emission for monitoring
- Overflow protection on calculations

---

### 2. Backend Service Layer (Rust)

**Purpose**: Real-time monitoring and automated liquidation execution

#### 2.1 Monitor Engine (`monitor.rs`)

**Responsibilities**:
- Fetch all positions from Solana every 2 seconds
- Calculate health factors using oracle prices
- Identify positions requiring liquidation
- Push to priority queue

**Algorithm**:
```rust
loop {
    positions = fetch_on_chain_positions()
    
    for position in positions {
        mark_price = oracle.get_price(position.symbol)
        
        unrealized_pnl = calculate_pnl(position, mark_price)
        margin_ratio = (collateral + pnl) / position_value
        
        if margin_ratio < maintenance_margin {
            queue.push(position, margin_ratio)  // Lower ratio = higher priority
            executor.liquidate(position)
        }
    }
    
    sleep(2_seconds)
}
```

**Performance Optimizations**:
- Price caching (avoid duplicate oracle calls)
- Parallel position processing
- Efficient RPC batching

#### 2.2 Executor Engine (`executor.rs`)

**Responsibilities**:
- Execute liquidations on-chain
- Implement partial vs full liquidation logic
- Handle transaction failures and retries
- Record results to database

**Liquidation Decision Tree**:
```
margin_ratio < maintenance_margin?
    ├─ YES
    │   ├─ margin_ratio < (maintenance * 0.1)?
    │   │   ├─ YES → FULL LIQUIDATION
    │   │   └─ NO  → PARTIAL LIQUIDATION
    │   │       └─ Calculate amount to restore health
    └─ NO → No action
```

**Transaction Construction**:
- Priority fees: 1,000,000 micro-lamports (0.001 SOL)
- Compute budget: 200,000 units
- Retry logic: Exponential backoff (3 attempts)

#### 2.3 Priority Queue (`queue.rs`)

**Data Structure**: Binary Heap (min-heap by margin ratio)

**Features**:
- Deduplication via HashSet
- Thread-safe (Mutex-protected)
- Snapshot capability for API

**Complexity**:
- Insert: O(log n)
- Pop: O(log n)
- Contains check: O(1)

#### 2.4 Insurance Fund Manager (`insurance.rs`)

**Responsibilities**:
- Monitor on-chain insurance fund balance
- Broadcast balance updates via WebSocket
- Handle bad debt scenarios

**Bad Debt Handling**:
```
if collateral < debt {
    bad_debt = debt - collateral
    insurance_fund.cover(bad_debt)
    emit_event("bad_debt_covered", bad_debt)
}
```

#### 2.5 WebSocket Broadcaster (`websocket.rs`)

**Purpose**: Real-time updates to connected clients

**Message Types**:
```json
{
  "type": "liquidation",
  "position_id": "...",
  "symbol": "SOL/USD",
  "amount": 100.0,
  "price": 1845.0
}

{
  "type": "insurance_fund",
  "balance": 50000000
}

{
  "type": "price_update",
  "symbol": "BTC/USD",
  "price": 43500.0
}
```

**Connection Management**:
- Heartbeat every 30 seconds
- Auto-reconnect on disconnect
- Broadcast to all connected clients

---

### 3. Frontend Layer (Next.js)

**Purpose**: User interface for monitoring and interaction

#### 3.1 Page Structure

**Landing Page (`/`)**:
- Marketing content
- Feature highlights
- Call-to-action (Enter App)

**Dashboard (`/dashboard`)**:
- KPI cards (Insurance Fund, Active Positions, At Risk, Total Collateral)
- Liquidation Radar (real-time position table)
- System Activity Log
- Top Liquidators Leaderboard
- Trending Markets
- Event Feed

**Settings (`/settings`)**:
- Currency selection
- Notification preferences
- RPC endpoint configuration

#### 3.2 State Management

**Data Flow**:
```
API Client → React State → Components → UI
     ↑                                    ↓
     └────────── User Actions ────────────┘
```

**Real-time Updates**:
```typescript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080/ws')
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'liquidation') {
      refreshPositions()
    } else if (data.type === 'insurance_fund') {
      setInsuranceFund(data.balance)
    }
  }
}, [])
```

---

## Data Flow Diagrams

### Liquidation Flow

```
┌─────────┐
│  Start  │
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ Monitor fetches     │
│ positions from      │
│ Solana RPC          │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ For each position:  │
│ - Get oracle price  │
│ - Calculate health  │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ Health < threshold? │
└────┬────────────────┘
     │
     ├─ NO ──────────────────┐
     │                       │
     ▼                       │
┌─────────────────────┐      │
│ Add to queue        │      │
│ (priority by health)│      │
└────┬────────────────┘      │
     │                       │
     ▼                       │
┌─────────────────────┐      │
│ Executor builds     │      │
│ transaction with    │      │
│ priority fees       │      │
└────┬────────────────┘      │
     │                       │
     ▼                       │
┌─────────────────────┐      │
│ Submit to Solana    │      │
└────┬────────────────┘      │
     │                       │
     ▼                       │
┌─────────────────────┐      │
│ Transaction         │      │
│ confirmed?          │      │
└────┬────────────────┘      │
     │                       │
     ├─ YES                  │
     │   │                   │
     │   ▼                   │
     │ ┌──────────────────┐  │
     │ │ Update database  │  │
     │ │ Broadcast event  │  │
     │ └──────────────────┘  │
     │                       │
     ├─ NO                   │
     │   │                   │
     │   ▼                   │
     │ ┌──────────────────┐  │
     │ │ Log failure      │  │
     │ │ Retry (3x)       │  │
     │ └──────────────────┘  │
     │                       │
     └───────────────────────┘
              │
              ▼
         ┌─────────┐
         │  End    │
         └─────────┘
```

### WebSocket Communication Flow

```
Frontend                Backend               Blockchain
   │                       │                      │
   │  WS Connect           │                      │
   ├──────────────────────>│                      │
   │                       │                      │
   │  Connected (200)      │                      │
   │<──────────────────────┤                      │
   │                       │                      │
   │                       │  Monitor Loop        │
   │                       │  (every 2s)          │
   │                       ├─────────────────────>│
   │                       │                      │
   │                       │  Position Data       │
   │                       │<─────────────────────┤
   │                       │                      │
   │                       │  Liquidation Needed? │
   │                       │  ├─ YES              │
   │                       │  │                   │
   │                       │  Execute TX          │
   │                       │  ├─────────────────>│
   │                       │                      │
   │  Liquidation Event    │  TX Confirmed        │
   │<──────────────────────┤<─────────────────────┤
   │  (JSON)               │                      │
   │                       │                      │
   │  Update UI            │                      │
   │  (React setState)     │                      │
   │                       │                      │
```

## Scalability Considerations

### Current Limitations
- Single-threaded liquidation execution
- SQLite database (single-writer)
- Synchronous RPC calls

### Production Improvements
1. **Multi-threaded Executor**: Process multiple liquidations concurrently
2. **PostgreSQL**: Better concurrency and ACID guarantees
3. **Redis Cache**: Cache oracle prices and position data
4. **Load Balancer**: Distribute frontend traffic
5. **Microservices**: Separate monitor, executor, and API into services

### Estimated Capacity
- **Current**: ~100 positions, ~10 liquidations/minute
- **Optimized**: ~10,000 positions, ~1,000 liquidations/minute

## Security Architecture

### Authentication & Authorization
- Frontend: No auth (public dashboard)
- Backend: API key for admin endpoints (future)
- Smart Contract: Signature verification on liquidations

### Data Validation
- Input sanitization on all API endpoints
- Health factor verification before liquidation
- Oracle price staleness checks

### Error Handling
- Graceful degradation on RPC failures
- Transaction retry with exponential backoff
- Database transaction rollback on errors

## Monitoring & Observability

### Metrics Collected
- Liquidation latency (p50, p95, p99)
- Transaction success rate
- WebSocket connection count
- Database query performance

### Logging Levels
- ERROR: Transaction failures, critical errors
- WARN: Retry attempts, high risk positions
- INFO: Successful liquidations, system events
- DEBUG: Position checks, price updates

## Deployment Architecture

### Development
```
Local Machine
├── Solana Test Validator (localhost:8899)
├── Backend Service (localhost:8080)
└── Frontend Dev Server (localhost:3000)
```

### Production
```
Cloud Infrastructure
├── Solana Mainnet (RPC via QuickNode/Alchemy)
├── Backend (Docker on AWS ECS)
│   ├── Auto-scaling (2-10 instances)
│   └── Load balancer
├── Database (AWS RDS PostgreSQL)
├── Frontend (Vercel CDN)
└── Monitoring (Datadog/Grafana)
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Smart Contract | Anchor 0.30 | Solana program framework |
| Backend | Rust 1.70+ | High-performance service |
| Web Server | Actix-web 4.0 | HTTP/WebSocket server |
| Database | SQLite / PostgreSQL | Data persistence |
| Frontend | Next.js 14 | React framework |
| Styling | Tailwind CSS | UI styling |
| State | React Hooks | Client state management |
| Animations | Framer Motion | UI animations |

## Conclusion

This architecture provides a robust, scalable foundation for automated liquidation management on Solana. The modular design allows for easy extension and optimization as the system grows.
