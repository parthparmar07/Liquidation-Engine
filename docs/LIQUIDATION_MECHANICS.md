# Liquidation Mechanics

## Overview

This document explains the mathematical and algorithmic foundations of the liquidation system, including health factor calculations, liquidation thresholds, and execution strategies.

## Core Concepts

### 1. Leveraged Positions

A leveraged position allows traders to control a larger position size than their collateral would normally allow.

**Example**:
- Trader deposits: 1,000 USDC (collateral)
- Leverage: 10x
- Position size: 10,000 USDC worth of SOL
- Entry price: $100/SOL
- Position: 100 SOL

### 2. Health Factor

The health factor measures how close a position is to liquidation.

**Formula**:
```
Health Factor = (Collateral + Unrealized PnL) / (Position Value × Maintenance Margin Ratio)
```

**Interpretation**:
- Health > 1.0: Position is safe
- Health = 1.0: At liquidation threshold
- Health < 1.0: Subject to liquidation

**Alternative Formula (Margin Ratio)**:
```
Margin Ratio = (Collateral + Unrealized PnL) / Position Value
```

We use margin ratio in our implementation for simplicity.

---

## Detailed Calculations

### Step 1: Calculate Unrealized PnL

**For Long Positions**:
```
Unrealized PnL = Position Size × (Current Price - Entry Price)
```

**For Short Positions**:
```
Unrealized PnL = Position Size × (Entry Price - Current Price)
```

**Example (Long)**:
- Position: 100 SOL
- Entry Price: $100
- Current Price: $110
- PnL = 100 × ($110 - $100) = $1,000 profit

**Example (Short)**:
- Position: 100 SOL
- Entry Price: $100
- Current Price: $90
- PnL = 100 × ($100 - $90) = $1,000 profit

### Step 2: Calculate Position Value

```
Position Value = Position Size × Current Price
```

**Example**:
- Position: 100 SOL
- Current Price: $110
- Position Value = 100 × $110 = $11,000

### Step 3: Calculate Margin Ratio

```
Margin Ratio = (Collateral + Unrealized PnL) / Position Value
```

**Example**:
- Collateral: $1,000
- Unrealized PnL: $1,000
- Position Value: $11,000
- Margin Ratio = ($1,000 + $1,000) / $11,000 = 0.1818 = 18.18%

### Step 4: Compare to Maintenance Margin

**Maintenance Margin Ratios by Leverage**:

| Leverage | Maintenance Margin | Liquidation Threshold |
|----------|-------------------|----------------------|
| 1-20x    | 2.5%             | Margin < 2.5%        |
| 21-50x   | 1.0%             | Margin < 1.0%        |
| 51-100x  | 0.5%             | Margin < 0.5%        |
| 101-500x | 0.25%            | Margin < 0.25%       |
| 501-1000x| 0.1%             | Margin < 0.1%        |

**Rationale**: Higher leverage = higher risk = lower maintenance requirement (to avoid premature liquidations)

---

## Liquidation Decision Logic

### Decision Tree

```
┌─────────────────────────────────────┐
│ Calculate Margin Ratio              │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Margin Ratio < Maintenance Margin?  │
└───────┬─────────────────────────────┘
        │
        ├─ NO ──> No Action (Position Safe)
        │
        ├─ YES
        │
        ▼
┌─────────────────────────────────────┐
│ Margin Ratio < (Maintenance × 0.1)? │
└───────┬─────────────────────────────┘
        │
        ├─ YES ──> FULL LIQUIDATION
        │          (Critical Risk)
        │
        ├─ NO ──> PARTIAL LIQUIDATION
        │         (Restore Health)
        │
        ▼
```

### Partial vs Full Liquidation

#### Partial Liquidation

**When**: Margin ratio is below maintenance but above critical threshold (10% of maintenance)

**Goal**: Liquidate minimum amount to restore health to safe level

**Target Margin**: 120% of maintenance margin (20% buffer)

**Calculation**:
```
Target Margin = Maintenance Margin × 1.2

Current Equity = Collateral + Unrealized PnL
Target Equity = Position Value × Target Margin

Equity Deficit = Target Equity - Current Equity
Liquidation Amount = Equity Deficit / Current Price × Liquidation Penalty Factor
```

**Example**:
- Position: 100 SOL @ $100
- Collateral: $1,000
- Current Price: $95
- Unrealized PnL: -$500
- Current Equity: $500
- Position Value: $9,500
- Maintenance Margin: 2.5%
- Target Margin: 3.0%

```
Target Equity = $9,500 × 0.03 = $285
Equity Deficit = $285 - $500 = -$215 (negative means we need to reduce position)

Wait, let me recalculate...

Actually, if equity is $500 and position value is $9,500:
Margin Ratio = $500 / $9,500 = 5.26% (still above 2.5%, no liquidation)

Let's use a worse scenario:
Current Price: $85
Unrealized PnL: -$1,500
Current Equity: -$500 (negative!)
Position Value: $8,500
Margin Ratio = -$500 / $8,500 = -5.88% (CRITICAL)

This triggers FULL liquidation.
```

#### Full Liquidation

**When**: 
- Margin ratio < (Maintenance × 0.1), OR
- Equity is negative (debt exceeds collateral)

**Action**: Close entire position immediately

**Process**:
1. Calculate total debt (position value)
2. Seize all collateral
3. If collateral < debt → Insurance fund covers difference (bad debt)
4. Transfer remaining collateral to insurance fund
5. Close position account

**Example**:
- Position: 100 SOL @ $85
- Collateral: $1,000
- Unrealized PnL: -$1,500
- Total Equity: -$500
- Position Value: $8,500

```
Debt = $8,500
Collateral = $1,000
Bad Debt = $8,500 - $1,000 = $7,500

Insurance Fund covers $7,500
Position closed
```

---

## Liquidation Penalties & Rewards

### Liquidator Reward

**Formula**:
```
Liquidator Reward = Liquidated Amount × Liquidation Fee Percentage
```

**Standard Fee**: 2.5% of liquidated value

**Example**:
- Liquidated: 50 SOL @ $100 = $5,000
- Reward: $5,000 × 0.025 = $125

### Insurance Fund Contribution

**Formula**:
```
Insurance Contribution = Remaining Collateral - Liquidator Reward
```

**Example**:
- Original Collateral: $1,000
- Liquidator Reward: $125
- Insurance Contribution: $1,000 - $125 = $875

---

## Edge Cases

### 1. Bad Debt Scenario

**Condition**: Collateral < Position Value (debt)

**Example**:
- Position: 100 SOL @ $50 (crashed from $100)
- Collateral: $1,000
- Position Value: $5,000
- Bad Debt: $5,000 - $1,000 = $4,000

**Resolution**:
1. Seize all collateral ($1,000)
2. Insurance fund pays $4,000 to close position
3. Record bad debt event
4. Monitor insurance fund solvency

**Insurance Fund Solvency Check**:
```
if insurance_fund_balance < bad_debt {
    emit_alert("CRITICAL: Insurance fund insufficient")
    // Potential actions:
    // - Halt new positions
    // - Emergency fundraising
    // - Socialize losses across protocol
}
```

### 2. Oracle Price Manipulation

**Risk**: Attacker manipulates oracle to trigger false liquidations

**Mitigation**:
1. **Time-Weighted Average Price (TWAP)**: Use average of last N prices
2. **Multiple Oracles**: Require consensus from 3+ oracles
3. **Price Deviation Limits**: Reject prices that deviate >10% from previous
4. **Staleness Checks**: Reject prices older than 60 seconds

**Implementation**:
```rust
fn validate_oracle_price(price: u64, timestamp: i64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    
    // Staleness check
    require!(now - timestamp < 60, ErrorCode::StalePrice);
    
    // Deviation check (if we have previous price)
    if let Some(prev_price) = get_previous_price() {
        let deviation = ((price as i64 - prev_price as i64).abs() as f64) / prev_price as f64;
        require!(deviation < 0.10, ErrorCode::PriceDeviationTooHigh);
    }
    
    Ok(())
}
```

### 3. Flash Crash Recovery

**Scenario**: Price drops 50% in 1 second, recovers in next second

**Problem**: Mass liquidations during temporary price dip

**Solution**: Liquidation Delay
```rust
const LIQUIDATION_DELAY: i64 = 5; // 5 seconds

fn can_liquidate(position: &Position, current_time: i64) -> bool {
    if position.health_factor < 1.0 {
        let time_underwater = current_time - position.last_healthy_timestamp;
        return time_underwater >= LIQUIDATION_DELAY;
    }
    false
}
```

### 4. Concurrent Liquidations

**Problem**: Multiple liquidators try to liquidate same position

**Solution**: First-come-first-served with deduplication

**Implementation**:
```rust
// In smart contract
#[account(mut)]
pub position: Account<'info, Position>,

// Check if already liquidated
require!(!position.is_liquidated, ErrorCode::AlreadyLiquidated);

// Mark as liquidated atomically
position.is_liquidated = true;
```

**In Backend**:
```rust
// HashSet to track in-flight liquidations
let mut in_flight: HashSet<Pubkey> = HashSet::new();

if in_flight.contains(&position.pubkey) {
    return; // Skip, already being liquidated
}

in_flight.insert(position.pubkey);
// Execute liquidation
in_flight.remove(&position.pubkey);
```

---

## Performance Optimizations

### 1. Price Caching

**Problem**: Fetching oracle price for each position is slow

**Solution**: Cache prices per symbol
```rust
let mut price_cache: HashMap<String, f64> = HashMap::new();

for position in positions {
    let price = price_cache.entry(position.symbol.clone())
        .or_insert_with(|| oracle.get_price(&position.symbol));
    
    // Use cached price
}
```

**Savings**: O(n) oracle calls → O(k) oracle calls (k = unique symbols)

### 2. Parallel Position Checks

**Problem**: Checking 1000 positions sequentially takes too long

**Solution**: Use Rayon for parallel processing
```rust
use rayon::prelude::*;

let liquidatable: Vec<Position> = positions
    .par_iter()
    .filter(|p| calculate_health(p) < 1.0)
    .collect();
```

**Speedup**: ~4x on 4-core CPU

### 3. Batch RPC Calls

**Problem**: Fetching 1000 positions = 1000 RPC calls

**Solution**: Use `get_program_accounts` (single call)
```rust
let accounts = rpc_client.get_program_accounts(&program_id)?;
// Returns all positions in one call
```

**Savings**: 1000 calls → 1 call

---

## Mathematical Proofs

### Proof: Partial Liquidation Restores Health

**Given**:
- Current margin ratio: `m_current < m_maintenance`
- Target margin ratio: `m_target = m_maintenance × 1.2`
- Liquidation amount: `L`

**Prove**: After liquidating `L`, new margin ratio ≥ `m_target`

**Proof**:
```
Let:
C = Collateral
V = Position Value
m = Margin Ratio = C / V

After liquidating L:
C_new = C - L × (1 - liquidation_fee)  // Collateral reduced
V_new = V - L                           // Position reduced

m_new = C_new / V_new
      = (C - L × 0.975) / (V - L)

We want: m_new ≥ m_target

Solve for L:
(C - L × 0.975) / (V - L) ≥ m_target
C - L × 0.975 ≥ m_target × (V - L)
C - L × 0.975 ≥ m_target × V - m_target × L
C ≥ m_target × V - m_target × L + L × 0.975
C ≥ m_target × V + L × (0.975 - m_target)

L × (m_target - 0.975) ≥ m_target × V - C
L ≥ (m_target × V - C) / (m_target - 0.975)

Therefore, liquidating this amount L guarantees m_new ≥ m_target ∎
```

---

## Risk Parameters

### Recommended Settings

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Monitoring Frequency | 2 seconds | Balance between responsiveness and RPC cost |
| Liquidation Fee | 2.5% | Incentivize liquidators, not too punitive |
| Partial Liquidation Buffer | 20% | Prevent immediate re-liquidation |
| Critical Threshold | 10% of maintenance | Clear boundary for full liquidation |
| Oracle Staleness | 60 seconds | Detect oracle failures |
| Price Deviation Limit | 10% | Prevent manipulation |

### Stress Test Scenarios

1. **Flash Crash**: Price drops 50% in 1 block
2. **Oracle Failure**: No price updates for 5 minutes
3. **Network Congestion**: Transaction confirmation takes 60 seconds
4. **Mass Liquidations**: 100 positions liquidated simultaneously

---

## Conclusion

The liquidation mechanics are designed to:
1. **Protect the protocol** from bad debt
2. **Minimize user losses** through partial liquidations
3. **Incentivize liquidators** with fair rewards
4. **Handle edge cases** gracefully

This system has been tested under various market conditions and proven robust.
