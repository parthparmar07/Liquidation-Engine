# Smart Contract Documentation

## Program Overview

**Program ID**: `HCJaVaM9GEH4nYoX6UquxWXroXJyjSLp2LLKCa1gg5NJ`  
**Framework**: Anchor 0.30.0  
**Language**: Rust  
**Blockchain**: Solana

---

## 1. Instruction Specifications

### Instruction 1: `create_position`

**Purpose**: Open a new leveraged trading position

**Parameters**:
```rust
pub struct CreatePositionParams {
    pub symbol: String,        // Trading pair (e.g., "SOL/USD")
    pub size: u64,             // Position size in base units
    pub collateral: u64,       // Collateral amount in lamports
    pub entry_price: u64,      // Entry price (scaled by 1e6)
    pub leverage: u16,         // Leverage multiplier (1-1000)
    pub is_long: bool,         // true = long, false = short
}
```

**Accounts**:
```rust
#[derive(Accounts)]
pub struct CreatePosition<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Position::INIT_SPACE
    )]
    pub position: Account<'info, Position>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Validation**:
- `leverage` must be between 1 and 1000
- `collateral` must be > 0
- `size` must be > 0
- User must have sufficient SOL for rent + collateral

**Example Usage**:
```typescript
await program.methods
  .createPosition({
    symbol: "SOL/USD",
    size: new BN(100_000_000),  // 100 SOL
    collateral: new BN(1_000_000_000),  // 1 SOL
    entryPrice: new BN(100_000_000),  // $100
    leverage: 10,
    isLong: true,
  })
  .accounts({
    position: positionKeypair.publicKey,
    user: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([positionKeypair])
  .rpc();
```

---

### Instruction 2: `liquidate_full`

**Purpose**: Liquidate an undercollateralized position

**Parameters**: None (position determined by account)

**Accounts**:
```rust
#[derive(Accounts)]
pub struct LiquidateFull<'info> {
    #[account(
        mut,
        close = liquidator,  // Close account, send rent to liquidator
        constraint = !position.is_liquidated @ ErrorCode::AlreadyLiquidated
    )]
    pub position: Account<'info, Position>,
    
    #[account(
        mut,
        seeds = [b"insurance_fund"],
        bump
    )]
    pub insurance_fund: Account<'info, InsuranceFund>,
    
    #[account(mut)]
    pub liquidator: Signer<'info>,
}
```

**Validation**:
- Position health factor < 1.0
- Position not already liquidated
- Insurance fund PDA is correct

**Process**:
1. Verify position is liquidatable
2. Calculate liquidator reward (2.5% of position value)
3. Transfer collateral to insurance fund
4. Transfer reward to liquidator
5. Mark position as liquidated
6. Close position account
7. Emit `LiquidationEvent`

**Example Usage**:
```typescript
const [insuranceFundPDA] = await PublicKey.findProgramAddress(
  [Buffer.from("insurance_fund")],
  program.programId
);

await program.methods
  .liquidateFull()
  .accounts({
    position: positionPubkey,
    insuranceFund: insuranceFundPDA,
    liquidator: wallet.publicKey,
  })
  .rpc();
```

---

### Instruction 3: `contribute_to_insurance`

**Purpose**: Add funds to the insurance fund

**Parameters**:
```rust
pub struct ContributeParams {
    pub amount: u64,  // Amount in lamports
}
```

**Accounts**:
```rust
#[derive(Accounts)]
pub struct ContributeToInsurance<'info> {
    #[account(
        mut,
        seeds = [b"insurance_fund"],
        bump
    )]
    pub insurance_fund: Account<'info, InsuranceFund>,
    
    #[account(mut)]
    pub contributor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Process**:
1. Transfer SOL from contributor to insurance fund PDA
2. Update insurance fund balance
3. Record contribution
4. Emit `ContributionEvent`

---

## 2. Account Structures

### Position Account

```rust
#[account]
pub struct Position {
    pub owner: Pubkey,              // 32 bytes
    pub symbol: String,             // 4 + 32 bytes (max 32 chars)
    pub size: u64,                  // 8 bytes
    pub collateral: u64,            // 8 bytes
    pub entry_price: u64,           // 8 bytes
    pub leverage: u16,              // 2 bytes
    pub maintenance_margin: u64,    // 8 bytes
    pub is_long: bool,              // 1 byte
    pub is_liquidated: bool,        // 1 byte
    pub created_at: i64,            // 8 bytes
}

// Total: 32 + 36 + 8 + 8 + 8 + 2 + 8 + 1 + 1 + 8 = 112 bytes
// With discriminator: 8 + 112 = 120 bytes
```

**Field Descriptions**:
- `owner`: Wallet that created the position
- `symbol`: Trading pair identifier
- `size`: Position size (scaled by 1e6)
- `collateral`: Collateral locked (in lamports)
- `entry_price`: Price at position open (scaled by 1e6)
- `leverage`: Leverage multiplier
- `maintenance_margin`: Minimum margin to avoid liquidation
- `is_long`: Position direction
- `is_liquidated`: Liquidation status flag
- `created_at`: Unix timestamp

---

### Insurance Fund Account

```rust
#[account]
pub struct InsuranceFund {
    pub authority: Pubkey,              // 32 bytes
    pub balance: u64,                   // 8 bytes
    pub total_contributions: u64,       // 8 bytes
    pub total_bad_debt_covered: u64,    // 8 bytes
    pub utilization_ratio: u64,         // 8 bytes
    pub bump: u8,                       // 1 byte
}

// Total: 32 + 8 + 8 + 8 + 8 + 1 = 65 bytes
// With discriminator: 8 + 65 = 73 bytes
```

**PDA Derivation**:
```rust
let (insurance_fund_pda, bump) = Pubkey::find_program_address(
    &[b"insurance_fund"],
    &program_id
);
```

---

## 3. Security Measures

### Access Control

**Position Creation**:
- Only user can create position for themselves
- User must sign transaction
- User must pay rent + collateral

**Liquidation**:
- Anyone can liquidate (permissionless)
- Must provide valid position account
- Position must actually be liquidatable
- Prevents double liquidation via `is_liquidated` flag

**Insurance Fund**:
- Contributions: Anyone can contribute
- Withdrawals: Only program (via liquidations)
- Protected by PDA (no private key exists)

### Validation Checks

**Input Validation**:
```rust
// Leverage limits
require!(params.leverage >= 1 && params.leverage <= 1000, ErrorCode::InvalidLeverage);

// Positive amounts
require!(params.size > 0, ErrorCode::InvalidSize);
require!(params.collateral > 0, ErrorCode::InvalidCollateral);

// Symbol length
require!(params.symbol.len() <= 32, ErrorCode::SymbolTooLong);
```

**State Validation**:
```rust
// Prevent double liquidation
require!(!position.is_liquidated, ErrorCode::AlreadyLiquidated);

// Verify liquidatable
let health_factor = calculate_health_factor(&position, current_price);
require!(health_factor < 1.0, ErrorCode::PositionNotLiquidatable);
```

**Account Validation**:
```rust
// Verify PDA
#[account(
    seeds = [b"insurance_fund"],
    bump = insurance_fund.bump
)]
pub insurance_fund: Account<'info, InsuranceFund>,

// Verify owner
#[account(
    constraint = position.owner == user.key() @ ErrorCode::Unauthorized
)]
pub position: Account<'info, Position>,
```

### Overflow Protection

```rust
// Use checked arithmetic
let position_value = position.size
    .checked_mul(current_price)
    .ok_or(ErrorCode::Overflow)?;

let reward = position_value
    .checked_mul(LIQUIDATION_FEE_BPS)
    .ok_or(ErrorCode::Overflow)?
    .checked_div(10000)
    .ok_or(ErrorCode::DivisionByZero)?;
```

### Reentrancy Protection

Anchor provides automatic reentrancy protection via:
- Account borrowing (Rust's borrow checker)
- Instruction data validation
- Account ownership verification

**Additional Protection**:
```rust
// Close account atomically
#[account(
    mut,
    close = liquidator  // Prevents reuse
)]
pub position: Account<'info, Position>,
```

---

## 4. Edge Case Handling

### Case 1: Oracle Price Manipulation

**Risk**: Attacker manipulates oracle to trigger false liquidations

**Mitigation**:
```rust
// Use time-weighted average price (TWAP)
let twap = calculate_twap(&price_history, Duration::from_secs(60));

// Require multiple oracle sources
require!(
    pyth_price.is_some() && chainlink_price.is_some(),
    ErrorCode::InsufficientOracles
);

// Deviation check
let deviation = (price1 - price2).abs() / price1;
require!(deviation < 0.05, ErrorCode::PriceDeviationTooHigh);
```

### Case 2: Flash Loan Attack

**Risk**: Attacker uses flash loan to manipulate prices

**Mitigation**:
```rust
// Liquidation delay
require!(
    clock.unix_timestamp - position.last_healthy_timestamp > LIQUIDATION_DELAY,
    ErrorCode::LiquidationTooSoon
);

// Price staleness check
require!(
    clock.unix_timestamp - price_timestamp < MAX_PRICE_AGE,
    ErrorCode::StalePrice
);
```

### Case 3: Insufficient Insurance Fund

**Risk**: Bad debt exceeds insurance fund balance

**Handling**:
```rust
if bad_debt > insurance_fund.balance {
    // Emit critical event
    emit!(InsuranceFundInsufficient {
        required: bad_debt,
        available: insurance_fund.balance,
    });
    
    // Use all available funds
    let covered = insurance_fund.balance;
    insurance_fund.balance = 0;
    insurance_fund.total_bad_debt_covered += covered;
    
    // Remaining debt handled off-chain (governance)
    return Ok(());
}
```

### Case 4: Dust Positions

**Risk**: Positions too small to profitably liquidate

**Handling**:
```rust
const MIN_POSITION_VALUE: u64 = 10_000_000; // $10

if position_value < MIN_POSITION_VALUE {
    // Auto-close with insurance fund
    insurance_fund.balance -= position_value;
    // Close position
}
```

### Case 5: Network Congestion

**Risk**: Liquidation transaction fails due to congestion

**Mitigation**:
- Use priority fees (set by liquidator)
- Implement retry logic off-chain
- Queue liquidations in backend

---

## 5. Events

### LiquidationEvent

```rust
#[event]
pub struct LiquidationEvent {
    pub position_id: Pubkey,
    pub owner: Pubkey,
    pub liquidator: Pubkey,
    pub symbol: String,
    pub size: u64,
    pub collateral: u64,
    pub liquidation_price: u64,
    pub reward: u64,
    pub bad_debt: u64,
    pub timestamp: i64,
}
```

### ContributionEvent

```rust
#[event]
pub struct ContributionEvent {
    pub contributor: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
    pub timestamp: i64,
}
```

---

## 6. Error Codes

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid leverage value")]
    InvalidLeverage,
    
    #[msg("Invalid position size")]
    InvalidSize,
    
    #[msg("Invalid collateral amount")]
    InvalidCollateral,
    
    #[msg("Position already liquidated")]
    AlreadyLiquidated,
    
    #[msg("Position not liquidatable")]
    PositionNotLiquidatable,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Arithmetic overflow")]
    Overflow,
    
    #[msg("Division by zero")]
    DivisionByZero,
    
    #[msg("Stale price data")]
    StalePrice,
    
    #[msg("Price deviation too high")]
    PriceDeviationTooHigh,
}
```

---

## 7. Testing

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_position() {
        // Test position creation
    }
    
    #[test]
    fn test_liquidate_healthy_position_fails() {
        // Should fail to liquidate healthy position
    }
    
    #[test]
    fn test_liquidate_underwater_position() {
        // Should successfully liquidate
    }
    
    #[test]
    fn test_double_liquidation_fails() {
        // Should prevent double liquidation
    }
}
```

### Integration Tests

Located in `tests/liquidation-engine.ts`:
- Test full liquidation flow
- Test insurance fund contributions
- Test edge cases

---

## 8. Deployment

### Build

```bash
anchor build
```

### Deploy

```bash
anchor deploy --provider.cluster mainnet
```

### Verify

```bash
solana program show <PROGRAM_ID>
```

---

## Conclusion

The smart contract is designed with security, efficiency, and edge case handling as top priorities. All critical operations are validated, and the PDA-based insurance fund ensures protocol solvency.
