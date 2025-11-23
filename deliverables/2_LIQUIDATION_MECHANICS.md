# Liquidation Mechanics Documentation

## Overview

This document provides detailed specifications for the liquidation mechanics, including when positions become liquidatable, partial vs full liquidation criteria, reward calculations, and bad debt handling.

---

## 1. When Positions Become Liquidatable

### Health Factor Definition

A position becomes liquidatable when its **health factor** falls below 1.0.

**Formula**:
```
Health Factor = (Collateral + Unrealized PnL) / (Position Value × Maintenance Margin Ratio)
```

**Alternative (Margin Ratio)**:
```
Margin Ratio = (Collateral + Unrealized PnL) / Position Value

Position is liquidatable when: Margin Ratio < Maintenance Margin Ratio
```

### Calculation Steps

#### Step 1: Calculate Unrealized PnL

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
- Current Price: $95
- **PnL** = 100 × ($95 - $100) = **-$500** (loss)

#### Step 2: Calculate Position Value

```
Position Value = Position Size × Current Price
```

**Example**:
- Position: 100 SOL
- Current Price: $95
- **Position Value** = 100 × $95 = **$9,500**

#### Step 3: Calculate Margin Ratio

```
Margin Ratio = (Collateral + Unrealized PnL) / Position Value
```

**Example**:
- Collateral: $1,000
- Unrealized PnL: -$500
- Position Value: $9,500
- **Margin Ratio** = ($1,000 - $500) / $9,500 = **0.0526** = **5.26%**

#### Step 4: Compare to Maintenance Margin

**Maintenance Margin Ratios by Leverage**:

| Leverage | Maintenance Margin | Liquidation Threshold |
|----------|-------------------|----------------------|
| 1-20x    | 2.5%             | Margin < 2.5%        |
| 21-50x   | 1.0%             | Margin < 1.0%        |
| 51-100x  | 0.5%             | Margin < 0.5%        |
| 101-500x | 0.25%            | Margin < 0.25%       |
| 501-1000x| 0.1%             | Margin < 0.1%        |

**Example**:
- Margin Ratio: 5.26%
- Leverage: 10x
- Maintenance Margin: 2.5%
- **Status**: 5.26% > 2.5% → **HEALTHY** (not liquidatable)

**Example 2 (Liquidatable)**:
- Current Price drops to $85
- Unrealized PnL: 100 × ($85 - $100) = -$1,500
- Margin Ratio: ($1,000 - $1,500) / $8,500 = -0.0588 = **-5.88%**
- **Status**: -5.88% < 2.5% → **LIQUIDATABLE**

### Liquidation Price Calculation

The price at which a position becomes liquidatable:

**Formula**:
```
Liquidation Price = Entry Price × (1 - (Collateral / Position Size) + Maintenance Margin)
```

**For Long Position**:
```
Liquidation Price = Entry Price × (1 - (Collateral / (Size × Entry Price)) + Maintenance Margin)
```

**Example**:
- Entry Price: $100
- Size: 100 SOL
- Collateral: $1,000
- Leverage: 10x
- Maintenance Margin: 2.5%

```
Liquidation Price = $100 × (1 - ($1,000 / (100 × $100)) + 0.025)
                  = $100 × (1 - 0.1 + 0.025)
                  = $100 × 0.925
                  = $92.50
```

**Verification**:
- At $92.50: PnL = 100 × ($92.50 - $100) = -$750
- Margin Ratio = ($1,000 - $750) / $9,250 = 0.027 = 2.7%
- Just above 2.5% threshold ✓

---

## 2. Partial vs Full Liquidation Criteria

### Decision Tree

```
Position is Liquidatable (Margin < Maintenance)
    │
    ▼
Calculate Critical Threshold = Maintenance × 0.1
    │
    ▼
Is Margin < Critical Threshold?
    │
    ├─ YES → FULL LIQUIDATION
    │         (High risk, close entire position)
    │
    └─ NO  → PARTIAL LIQUIDATION
              (Moderate risk, restore health)
```

### Full Liquidation Criteria

**Trigger Conditions**:
1. Margin Ratio < (Maintenance Margin × 0.1), **OR**
2. Equity is negative (Collateral + PnL < 0), **OR**
3. Position cannot be partially liquidated (too small)

**Example**:
- Leverage: 10x
- Maintenance Margin: 2.5%
- Critical Threshold: 2.5% × 0.1 = **0.25%**
- Current Margin: -5.88%
- **Decision**: -5.88% < 0.25% → **FULL LIQUIDATION**

**Process**:
1. Calculate total position value
2. Seize all collateral
3. Close entire position on-chain
4. If collateral < debt → Insurance fund covers difference
5. Transfer remaining collateral to insurance fund
6. Emit liquidation event

**Code Implementation**:
```rust
fn should_full_liquidate(margin_ratio: f64, maintenance: f64) -> bool {
    let critical_threshold = maintenance * 0.1;
    margin_ratio < critical_threshold
}
```

---

### Partial Liquidation Criteria

**Trigger Conditions**:
1. Margin Ratio < Maintenance Margin, **AND**
2. Margin Ratio >= (Maintenance Margin × 0.1), **AND**
3. Position is large enough to partially liquidate

**Example**:
- Leverage: 10x
- Maintenance Margin: 2.5%
- Critical Threshold: 0.25%
- Current Margin: 1.8%
- **Decision**: 0.25% < 1.8% < 2.5% → **PARTIAL LIQUIDATION**

**Target Margin**: Restore to 120% of maintenance margin (20% buffer)

**Calculation**:
```
Target Margin = Maintenance Margin × 1.2

Current Equity = Collateral + Unrealized PnL
Target Equity = Position Value × Target Margin

Equity Needed = Target Equity - Current Equity
Liquidation Amount = Equity Needed / (Current Price × (1 - Liquidation Fee))
```

**Example**:
- Position: 100 SOL @ $95
- Collateral: $1,000
- Unrealized PnL: -$500
- Current Equity: $500
- Position Value: $9,500
- Maintenance Margin: 2.5%
- Target Margin: 3.0%

```
Target Equity = $9,500 × 0.03 = $285
Current Equity = $500

Wait, current equity ($500) > target equity ($285), so position is actually healthy.

Let me recalculate with worse scenario:
Current Price: $90
Unrealized PnL: 100 × ($90 - $100) = -$1,000
Current Equity: $1,000 - $1,000 = $0
Position Value: 100 × $90 = $9,000
Margin Ratio: $0 / $9,000 = 0%

Target Equity = $9,000 × 0.03 = $270
Equity Needed = $270 - $0 = $270

Liquidation Amount = $270 / ($90 × 0.975) = $270 / $87.75 = 3.08 SOL
```

**Simplified Implementation** (current):
```rust
fn calculate_partial_amount(position: &Position) -> f64 {
    position.size * 0.5  // Liquidate 50% for simplicity
}
```

**Note**: In production, implement precise calculation based on target margin.

---

## 3. Liquidator Reward Calculation

### Reward Formula

```
Liquidator Reward = Liquidated Value × Liquidation Fee Percentage
```

**Standard Liquidation Fee**: 2.5% of liquidated value

### Full Liquidation Reward

**Example**:
- Position: 100 SOL @ $90
- Position Value: $9,000
- Liquidation Fee: 2.5%

```
Liquidator Reward = $9,000 × 0.025 = $225
```

**Distribution**:
- Liquidator receives: $225
- Insurance fund receives: Remaining collateral - Reward
  - If collateral = $1,000
  - Insurance gets: $1,000 - $225 = $775

### Partial Liquidation Reward

**Example**:
- Liquidated Amount: 50 SOL @ $90
- Liquidated Value: $4,500
- Liquidation Fee: 2.5%

```
Liquidator Reward = $4,500 × 0.025 = $112.50
```

### Reward Tiers (Optional Enhancement)

To incentivize quick liquidations:

| Time to Liquidate | Reward Multiplier |
|------------------|-------------------|
| < 5 seconds      | 1.5x (3.75%)     |
| 5-30 seconds     | 1.0x (2.5%)      |
| 30-60 seconds    | 0.8x (2.0%)      |
| > 60 seconds     | 0.5x (1.25%)     |

**Not currently implemented** but recommended for production.

### Gas Fee Reimbursement

Liquidator pays transaction fees upfront:
- Base fee: ~0.000005 SOL
- Priority fee: 0.001 SOL (configurable)
- **Total**: ~0.001005 SOL per liquidation

**Profitability Check**:
```
Minimum Liquidation Value = Gas Fee / Liquidation Fee %
                          = 0.001005 SOL / 0.025
                          = 0.0402 SOL
                          = ~$3.62 @ $90/SOL
```

Positions smaller than this may not be profitable to liquidate.

---

## 4. Bad Debt Handling Process

### What is Bad Debt?

**Definition**: When a position's debt exceeds its collateral.

```
Bad Debt = Position Value - Collateral (when result > 0 and equity < 0)
```

**Example**:
- Position: 100 SOL @ $50 (crashed from $100)
- Position Value: $5,000
- Collateral: $1,000
- **Bad Debt**: $5,000 - $1,000 = **$4,000**

### Detection

```rust
fn calculate_bad_debt(position: &Position, current_price: f64) -> f64 {
    let position_value = position.size * current_price;
    let equity = position.collateral + calculate_pnl(position, current_price);
    
    if equity < 0.0 {
        position_value - position.collateral
    } else {
        0.0
    }
}
```

### Handling Process

#### Step 1: Identify Bad Debt

During liquidation execution:
```rust
let position_value = position.size * current_price;
let collateral = position.collateral;

if collateral < position_value {
    let bad_debt = position_value - collateral;
    // Handle bad debt
}
```

#### Step 2: Insurance Fund Coverage

```rust
async fn cover_bad_debt(bad_debt: u64) -> Result<()> {
    let insurance_balance = get_insurance_balance().await?;
    
    if insurance_balance >= bad_debt {
        // Deduct from insurance fund
        insurance_fund.withdraw(bad_debt)?;
        
        // Record transaction
        db.record_bad_debt_coverage(bad_debt).await?;
        
        // Emit event
        broadcaster.send(WsMessage::BadDebtCovered { amount: bad_debt });
        
        Ok(())
    } else {
        // CRITICAL: Insurance fund insufficient
        handle_insolvency(bad_debt, insurance_balance).await
    }
}
```

#### Step 3: Insolvency Handling

If insurance fund cannot cover bad debt:

**Option 1: Halt Protocol**
```rust
async fn handle_insolvency(bad_debt: u64, available: u64) -> Result<()> {
    // Emit critical alert
    emit_alert(AlertLevel::Critical, "Insurance fund insufficient");
    
    // Halt new positions
    protocol.set_status(ProtocolStatus::Halted)?;
    
    // Notify governance
    governance.propose_emergency_action(bad_debt - available)?;
    
    Ok(())
}
```

**Option 2: Socialize Losses**
```rust
async fn socialize_losses(bad_debt: u64) -> Result<()> {
    let total_collateral = get_total_protocol_collateral().await?;
    let loss_ratio = bad_debt / total_collateral;
    
    // Reduce all positions proportionally
    for position in get_all_positions().await? {
        let loss = position.collateral * loss_ratio;
        position.collateral -= loss;
        position.update().await?;
    }
    
    Ok(())
}
```

**Option 3: Emergency Fundraising**
```rust
async fn emergency_fundraise(target: u64) -> Result<()> {
    // Create fundraising campaign
    let campaign = InsuranceFundCampaign {
        target,
        deadline: now() + 7_days,
        contributors: vec![],
    };
    
    // Offer incentives (e.g., governance tokens)
    campaign.set_reward(target * 0.1)?;
    
    campaign.launch().await
}
```

### Bad Debt Prevention

**Proactive Measures**:

1. **Early Liquidation Warnings**:
   ```rust
   if margin_ratio < maintenance_margin * 1.3 {
       send_warning_to_user(position.owner);
   }
   ```

2. **Liquidation Delay** (prevent flash crashes):
   ```rust
   const LIQUIDATION_DELAY: Duration = Duration::from_secs(5);
   
   if position.time_underwater() < LIQUIDATION_DELAY {
       return; // Wait before liquidating
   }
   ```

3. **Circuit Breakers** (halt trading on extreme moves):
   ```rust
   if price_change_1min > 0.10 {  // 10% in 1 minute
       halt_trading();
   }
   ```

4. **Insurance Fund Monitoring**:
   ```rust
   const MIN_INSURANCE_RATIO: f64 = 0.05; // 5% of TVL
   
   if insurance_balance < total_tvl * MIN_INSURANCE_RATIO {
       emit_alert(AlertLevel::Warning, "Insurance fund low");
   }
   ```

### Insurance Fund Replenishment

**Sources**:
1. Liquidation fees (2.5% of liquidated value)
2. Trading fees (0.1% of volume)
3. Protocol revenue sharing
4. Governance-approved contributions
5. Emergency fundraising

**Target Balance**: 5-10% of Total Value Locked (TVL)

---

## 5. Edge Cases

### Case 1: Oracle Failure

**Scenario**: Oracle stops providing prices

**Detection**:
```rust
if price_timestamp.elapsed() > Duration::from_secs(60) {
    return Err(Error::StalePrice);
}
```

**Handling**:
- Use last known price with warning
- Halt liquidations if staleness > 5 minutes
- Switch to backup oracle (Pyth, Chainlink)

### Case 2: Network Congestion

**Scenario**: Solana network congested, transactions failing

**Handling**:
- Increase priority fee dynamically
- Retry with exponential backoff
- Queue liquidations for later execution
- Alert operators if backlog grows

### Case 3: Concurrent Liquidations

**Scenario**: Multiple liquidators attempt same position

**Prevention**:
```rust
// Deduplication in backend
let mut in_flight: HashSet<Pubkey> = HashSet::new();

if in_flight.contains(&position_id) {
    return; // Skip
}

// On-chain check
require!(!position.is_liquidated, ErrorCode::AlreadyLiquidated);
position.is_liquidated = true;
```

### Case 4: Dust Positions

**Scenario**: Position too small to profitably liquidate

**Handling**:
```rust
const MIN_LIQUIDATION_VALUE: f64 = 10.0; // $10

if position_value < MIN_LIQUIDATION_VALUE {
    // Auto-close with insurance fund
    insurance_fund.close_dust_position(position)?;
}
```

---

## 6. Monitoring & Alerts

### Key Metrics

1. **Liquidation Rate**: Liquidations per hour
2. **Bad Debt Ratio**: Bad debt / Total liquidations
3. **Insurance Fund Ratio**: Balance / TVL
4. **Average Liquidation Latency**: Time to execute
5. **Failed Liquidation Rate**: Failures / Attempts

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Insurance Fund Ratio | < 5% | < 2% |
| Bad Debt Ratio | > 5% | > 10% |
| Failed Liquidation Rate | > 5% | > 10% |
| Avg Latency | > 100ms | > 500ms |

---

## Conclusion

The liquidation mechanics are designed to:
1. **Protect the protocol** from bad debt
2. **Minimize user losses** through partial liquidations
3. **Incentivize liquidators** with fair rewards
4. **Handle edge cases** gracefully

This system balances user protection with protocol solvency.
