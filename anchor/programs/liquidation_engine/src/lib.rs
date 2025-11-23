use anchor_lang::prelude::*;

declare_id!("HCJaVaM9GEH4nYoX6UquxWXroXJyjSLp2LLKCa1gg5NJ");

#[program]
pub mod liquidation_engine {
    use super::*;

    pub fn open_position(
        ctx: Context<OpenPosition>,
        symbol: String,
        size: u64,
        collateral: u64,
        entry_price: u64,
        leverage: u16,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.owner.key();
        position.symbol = symbol;
        position.size = size;
        position.collateral = collateral;
        position.entry_price = entry_price;
        position.leverage = leverage;
        // Set initial maintenance margin (e.g., 5% of notional value for demo)
        position.maintenance_margin = (size * entry_price) / 20; 
        Ok(())
    }

    pub fn initialize_insurance_fund(ctx: Context<InitializeInsuranceFund>) -> Result<()> {
        let insurance_fund = &mut ctx.accounts.insurance_fund;
        insurance_fund.authority = ctx.accounts.authority.key();
        insurance_fund.balance = 0;
        insurance_fund.total_contributions = 0;
        insurance_fund.total_bad_debt_covered = 0;
        insurance_fund.utilization_ratio = 0;
        Ok(())
    }

    pub fn liquidate_partial(
        ctx: Context<LiquidatePartial>,
        liquidation_amount: u64,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let liquidator = &mut ctx.accounts.liquidator;
        let insurance_fund = &mut ctx.accounts.insurance_fund;
        
        // 1. Verify position is liquidatable
        // In a real app, we would fetch price from an Oracle account passed in ctx
        // For this demo, we assume the caller provides the correct state or we check an oracle here.
        // Let's assume we have an oracle account.
        
        // Placeholder for oracle price check
        // let price = get_price(&ctx.accounts.oracle)?;
        // let margin_ratio = calculate_margin_ratio(position, price);
        // require!(margin_ratio < position.maintenance_margin, LiquidationError::NotLiquidatable);

        // 2. Reduce position size
        require!(liquidation_amount <= position.size, LiquidationError::InvalidLiquidationAmount);
        
        // Logic to reduce position size
        position.size = position.size.checked_sub(liquidation_amount).unwrap();

        // 3. Calculate and distribute liquidation fee
        // Reward = 2.5% of liquidated value
        // For simplicity, let's say 1 unit of size = 1 USDC for now, or we use the price.
        // let reward = (liquidation_amount * price * 0.025)
        let reward = liquidation_amount / 40; // 2.5% approximation
        
        // Transfer reward from position collateral to liquidator
        // This usually involves CPI to a token program, but we'll update internal state for this demo
        position.collateral = position.collateral.checked_sub(reward).unwrap();
        
        // Update liquidator stats (if we were tracking them on-chain, or just emit event)
        
        // 4. Emit event
        emit!(LiquidationEvent {
            position_owner: position.owner,
            liquidator: liquidator.key(),
            symbol: position.symbol.clone(),
            liquidated_size: liquidation_amount,
            liquidation_price: 100, // Placeholder
            margin_before: 1000, // Placeholder
            margin_after: 1200, // Placeholder
            liquidator_reward: reward,
            bad_debt: 0,
            timestamp: Clock::get()?.unix_timestamp,
            is_full: false,
        });

        Ok(())
    }

    pub fn liquidate_full(ctx: Context<LiquidateFull>) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let insurance_fund = &mut ctx.accounts.insurance_fund;
        let liquidator = &mut ctx.accounts.liquidator;

        // 1. Close entire position
        let size = position.size;
        position.size = 0;

        // 2. Calculate remaining margin
        // let pnl = calculate_pnl(position, price);
        // let remaining_margin = position.collateral + pnl;
        
        let remaining_margin: i64 = 100; // Placeholder positive margin
        
        if remaining_margin >= 0 {
            // Pay liquidator fee
            let reward = size / 40; // 2.5%
            // Transfer reward...
        } else {
            // Bad debt
            let bad_debt = remaining_margin.abs() as u64;
            insurance_fund.balance = insurance_fund.balance.checked_sub(bad_debt).unwrap_or(0);
            insurance_fund.total_bad_debt_covered += bad_debt;
        }

        emit!(LiquidationEvent {
            position_owner: position.owner,
            liquidator: liquidator.key(),
            symbol: position.symbol.clone(),
            liquidated_size: size,
            liquidation_price: 100, // Placeholder
            margin_before: 500, // Placeholder
            margin_after: 0,
            liquidator_reward: 10, // Placeholder
            bad_debt: 0, // Placeholder
            timestamp: Clock::get()?.unix_timestamp,
            is_full: true,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(symbol: String)]
pub struct OpenPosition<'info> {
    #[account(
        init, 
        payer = owner, 
        space = 8 + 32 + 4 + symbol.len() + 8 + 8 + 8 + 2 + 8,
        seeds = [b"position", owner.key().as_ref(), symbol.as_bytes()], 
        bump
    )]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeInsuranceFund<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + 8 + 8 + 8 + 8,
        seeds = [b"insurance_fund"], 
        bump
    )]
    pub insurance_fund: Account<'info, InsuranceFund>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LiquidatePartial<'info> {
    #[account(mut)]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub insurance_fund: Account<'info, InsuranceFund>,
    #[account(mut)]
    pub liquidator: Signer<'info>,
}

#[derive(Accounts)]
pub struct LiquidateFull<'info> {
    #[account(mut)]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub insurance_fund: Account<'info, InsuranceFund>,
    #[account(mut)]
    pub liquidator: Signer<'info>,
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub symbol: String,
    pub size: u64,
    pub collateral: u64,
    pub entry_price: u64,
    pub leverage: u16,
    pub maintenance_margin: u64,
}

#[account]
pub struct InsuranceFund {
    pub authority: Pubkey,
    pub balance: u64,
    pub total_contributions: u64,
    pub total_bad_debt_covered: u64,
    pub utilization_ratio: u64, // basis points
}

#[event]
pub struct LiquidationEvent {
    pub position_owner: Pubkey,
    pub liquidator: Pubkey,
    pub symbol: String,
    pub liquidated_size: u64,
    pub liquidation_price: u64,
    pub margin_before: u64,
    pub margin_after: u64,
    pub liquidator_reward: u64,
    pub bad_debt: u64,
    pub timestamp: i64,
    pub is_full: bool,
}

#[error_code]
pub enum LiquidationError {
    #[msg("Position is not liquidatable")]
    NotLiquidatable,
    #[msg("Invalid liquidation amount")]
    InvalidLiquidationAmount,
}
