# API Documentation

## Base URL

**Development**: `http://localhost:8080`  
**Production**: `https://api.liquidation-engine.com` (example)

## Authentication

Currently, the API is public and does not require authentication. In production, consider implementing:
- API keys for admin endpoints
- Rate limiting per IP
- JWT tokens for user-specific data

---

## REST API Endpoints

### 1. Health Check

**Endpoint**: `GET /health`

**Description**: Check if the API server is running

**Response**:
```json
{
  "status": "ok"
}
```

**Status Codes**:
- `200 OK`: Server is healthy
- `503 Service Unavailable`: Server is down

**Example**:
```bash
curl http://localhost:8080/health
```

---

### 2. Get Insurance Fund Balance

**Endpoint**: `GET /insurance/balance`

**Description**: Get the current insurance fund balance

**Response**:
```json
{
  "balance": 50000000,
  "balance_formatted": "50.00 SOL",
  "utilization_ratio": 0.15,
  "total_contributions": 60000000,
  "total_bad_debt_covered": 10000000,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

**Fields**:
- `balance` (integer): Balance in lamports (1 SOL = 1,000,000,000 lamports)
- `balance_formatted` (string): Human-readable balance
- `utilization_ratio` (float): Percentage of fund used (0.0 - 1.0)
- `total_contributions` (integer): Total deposits to fund
- `total_bad_debt_covered` (integer): Total bad debt paid out
- `last_updated` (string): ISO 8601 timestamp

**Status Codes**:
- `200 OK`: Success
- `500 Internal Server Error`: Database error

**Example**:
```bash
curl http://localhost:8080/insurance/balance
```

---

### 3. Get Pending Liquidations

**Endpoint**: `GET /liquidations/pending`

**Description**: Get positions currently in the liquidation queue

**Response**:
```json
{
  "pending_count": 3,
  "positions": [
    {
      "id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "owner": "5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG",
      "symbol": "SOL/USD",
      "size": 100.5,
      "collateral": 1000.0,
      "entry_price": 100.0,
      "current_price": 85.0,
      "leverage": 10,
      "margin_ratio": 0.018,
      "maintenance_margin": 0.025,
      "health_factor": 0.72,
      "unrealized_pnl": -1507.5,
      "liquidation_priority": 1,
      "queued_at": "2024-01-15T10:29:45Z"
    }
  ]
}
```

**Query Parameters**:
- `limit` (optional, integer): Max number of positions to return (default: 50, max: 100)
- `min_health` (optional, float): Filter positions with health >= this value

**Example**:
```bash
curl "http://localhost:8080/liquidations/pending?limit=10&min_health=0.5"
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid query parameters

---

### 4. Get Recent Liquidations

**Endpoint**: `GET /liquidations/recent`

**Description**: Get recently executed liquidations

**Response**:
```json
{
  "liquidations": [
    {
      "id": 142,
      "position_pubkey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "owner_pubkey": "5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG",
      "symbol": "SOL/USD",
      "liquidated_size": 100.5,
      "liquidation_price": 85.0,
      "liquidator_pubkey": "9K3sRRPZRxfP8ECxkW7mPZ3GiMLbW1PWU2HuBn8seCHS",
      "liquidator_reward": 213,
      "bad_debt": 0,
      "health_factor_before": 0.72,
      "is_full_liquidation": true,
      "transaction_signature": "5J8H5sTvEhnGcB7vqfKZBTqyNXvVfZQpKx3nFqKvWqN8dYz...",
      "timestamp": "2024-01-15T10:30:15Z"
    }
  ],
  "total_count": 142,
  "page": 1,
  "per_page": 10
}
```

**Query Parameters**:
- `limit` (optional, integer): Number of results (default: 10, max: 100)
- `offset` (optional, integer): Pagination offset (default: 0)
- `symbol` (optional, string): Filter by trading pair (e.g., "SOL/USD")
- `from_date` (optional, string): ISO 8601 date (e.g., "2024-01-01")
- `to_date` (optional, string): ISO 8601 date

**Example**:
```bash
curl "http://localhost:8080/liquidations/recent?limit=20&symbol=SOL/USD"
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters

---

### 5. Get System Statistics

**Endpoint**: `GET /stats`

**Description**: Get overall system statistics

**Response**:
```json
{
  "total_liquidations": 142,
  "total_volume": 45000000,
  "total_volume_formatted": "45.00 SOL",
  "active_positions": 8,
  "at_risk_positions": 2,
  "insurance_fund_balance": 50000000,
  "average_health_factor": 1.85,
  "liquidations_24h": 12,
  "volume_24h": 5000000,
  "uptime_percentage": 99.99,
  "last_block_processed": 185432100,
  "monitoring_frequency_ms": 2000,
  "average_liquidation_latency_ms": 45
}
```

**Status Codes**:
- `200 OK`: Success

**Example**:
```bash
curl http://localhost:8080/stats
```

---

### 6. Get Position by ID

**Endpoint**: `GET /positions/:pubkey`

**Description**: Get detailed information about a specific position

**Path Parameters**:
- `pubkey` (string): Position account public key

**Response**:
```json
{
  "id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "owner": "5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG",
  "symbol": "SOL/USD",
  "size": 100.5,
  "collateral": 1000.0,
  "entry_price": 100.0,
  "current_price": 105.0,
  "leverage": 10,
  "margin_ratio": 0.148,
  "maintenance_margin": 0.025,
  "health_factor": 5.92,
  "unrealized_pnl": 502.5,
  "liquidation_price": 97.5,
  "created_at": "2024-01-10T08:15:00Z",
  "last_updated": "2024-01-15T10:30:00Z",
  "status": "active"
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Position doesn't exist

**Example**:
```bash
curl http://localhost:8080/positions/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

---

### 7. Get Liquidation History for Position

**Endpoint**: `GET /positions/:pubkey/liquidations`

**Description**: Get liquidation history for a specific position

**Response**:
```json
{
  "position_pubkey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "liquidations": [
    {
      "id": 85,
      "liquidated_size": 25.0,
      "liquidation_price": 92.0,
      "is_full_liquidation": false,
      "timestamp": "2024-01-12T14:20:00Z"
    }
  ],
  "total_liquidations": 1
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Position doesn't exist

---

### 8. Get Failed Liquidations

**Endpoint**: `GET /liquidations/failed`

**Description**: Get liquidations that failed to execute

**Response**:
```json
{
  "failed_liquidations": [
    {
      "id": 5,
      "position_pubkey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "error_message": "Transaction simulation failed: insufficient funds",
      "retry_count": 3,
      "timestamp": "2024-01-15T09:45:30Z"
    }
  ],
  "total_count": 5
}
```

**Query Parameters**:
- `limit` (optional, integer): Number of results (default: 10)

**Status Codes**:
- `200 OK`: Success

---

## WebSocket API

### Connection

**Endpoint**: `ws://localhost:8080/ws`

**Protocol**: WebSocket (RFC 6455)

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket');
};
```

---

### Message Types

#### 1. Liquidation Event

**Type**: `liquidation`

**Sent When**: A position is liquidated

**Payload**:
```json
{
  "type": "liquidation",
  "position_id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "symbol": "SOL/USD",
  "amount": 100.5,
  "price": 85.0
}
```

**Fields**:
- `type` (string): Always "liquidation"
- `position_id` (string): Position public key
- `symbol` (string): Trading pair
- `amount` (float): Liquidated size
- `price` (float): Liquidation price

---

#### 2. Price Update

**Type**: `price_update`

**Sent When**: Oracle price changes

**Payload**:
```json
{
  "type": "price_update",
  "symbol": "SOL/USD",
  "price": 105.5
}
```

**Fields**:
- `type` (string): Always "price_update"
- `symbol` (string): Trading pair
- `price` (float): New price

---

#### 3. Insurance Fund Update

**Type**: `insurance_fund`

**Sent When**: Insurance fund balance changes

**Payload**:
```json
{
  "type": "insurance_fund",
  "balance": 50000000
}
```

**Fields**:
- `type` (string): Always "insurance_fund"
- `balance` (integer): New balance in lamports

---

### Heartbeat

The server sends a ping every 30 seconds. Clients should respond with a pong to maintain the connection.

**Server → Client**:
```
PING
```

**Client → Server**:
```
PONG
```

If no pong is received within 60 seconds, the server closes the connection.

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid value for parameter 'limit': must be between 1 and 100",
    "details": {
      "parameter": "limit",
      "provided": 150,
      "allowed_range": [1, 100]
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PARAMETER` | 400 | Invalid query/path parameter |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `RPC_ERROR` | 503 | Solana RPC unavailable |

---

## Rate Limiting

**Current**: No rate limiting (development)

**Production Recommendation**:
- 100 requests/minute per IP for public endpoints
- 1000 requests/minute for authenticated users
- WebSocket: 1 connection per IP

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

---

## CORS

**Development**: All origins allowed (`*`)

**Production**: Whitelist specific origins
```
Access-Control-Allow-Origin: https://app.liquidation-engine.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Versioning

**Current Version**: v1 (implicit)

**Future**: Use URL versioning
```
GET /v1/stats
GET /v2/stats
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:8080';

// Get insurance fund balance
const getInsuranceFund = async () => {
  const response = await axios.get(`${API_BASE}/insurance/balance`);
  return response.data;
};

// Get pending liquidations
const getPendingLiquidations = async (limit = 10) => {
  const response = await axios.get(`${API_BASE}/liquidations/pending`, {
    params: { limit }
  });
  return response.data;
};

// WebSocket connection
const connectWebSocket = (onMessage) => {
  const ws = new WebSocket('ws://localhost:8080/ws');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  return ws;
};
```

### Python

```python
import requests
import websocket
import json

API_BASE = 'http://localhost:8080'

# Get system stats
def get_stats():
    response = requests.get(f'{API_BASE}/stats')
    return response.json()

# WebSocket connection
def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data}")

ws = websocket.WebSocketApp(
    'ws://localhost:8080/ws',
    on_message=on_message
)
ws.run_forever()
```

### Rust

```rust
use reqwest;
use serde_json::Value;

const API_BASE: &str = "http://localhost:8080";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Get pending liquidations
    let response = reqwest::get(format!("{}/liquidations/pending", API_BASE))
        .await?
        .json::<Value>()
        .await?;
    
    println!("{:#?}", response);
    Ok(())
}
```

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- REST endpoints for positions, liquidations, stats
- WebSocket support for real-time updates
- SQLite database backend

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/parthparmar07/Liquidation-Engine/issues
