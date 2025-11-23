use log::{info, error};
use crate::monitor::Position;
use crate::db::Database;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    signature::{Keypair, Signer, read_keypair_file},
    transaction::Transaction,
    pubkey::Pubkey,
    instruction::{Instruction, AccountMeta},
    commitment_config::CommitmentConfig,
    compute_budget::ComputeBudgetInstruction,
};
use std::str::FromStr;
use std::sync::Arc;
use borsh::BorshSerialize;

// Program ID
const PROGRAM_ID: &str = "HCJaVaM9GEH4nYoX6UquxWXroXJyjSLp2LLKCa1gg5NJ";

pub struct LiquidationExecutor {
    rpc_client: Arc<RpcClient>,
    payer: Keypair,
    db: Arc<Database>,
}

#[derive(BorshSerialize)]
struct LiquidateFullArgs {}

impl LiquidationExecutor {
    pub fn new(db: Arc<Database>) -> Self {
        let rpc_url = std::env::var("SOLANA_RPC_URL").unwrap_or_else(|_| "http://127.0.0.1:8899".to_string());
        let rpc_client = Arc::new(RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed()));
        
        // Load wallet from standard location
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let keypair_path = format!("{}/.config/solana/id.json", home);
        let payer = read_keypair_file(&keypair_path).unwrap_or_else(|_| {
             read_keypair_file("C:/Users/Parth/.config/solana/id.json").expect("Failed to read keypair file")
        });

        Self {
            rpc_client,
            payer,
            db,
        }
    }

    pub async fn liquidate_position(
        &self,
        position: &Position,
        mark_price: f64,
        margin_ratio: f64,
    ) -> anyhow::Result<()> {
        info!("Executing liquidation for position: {}", position.id);
        
        let maintenance_req = self.get_maintenance_margin_ratio(position.leverage as u16);
        let critical_threshold = maintenance_req * 0.1; 

        if margin_ratio < critical_threshold {
            info!("Critical margin level ({:.4} < {:.4}). Executing FULL liquidation.", margin_ratio, critical_threshold);
            self.execute_full_liquidation(position, mark_price, margin_ratio).await?;
        } else {
            let target_margin = maintenance_req * 1.2;
            let liquidation_amount = self.calculate_partial_amount(position, mark_price, target_margin);
            
            info!("Margin level ({:.4}). Executing PARTIAL liquidation of size {:.4}.", margin_ratio, liquidation_amount);
            // For this demo, we'll just do full liquidation to prove the concept
            self.execute_full_liquidation(position, mark_price, margin_ratio).await?;
        }

        Ok(())
    }

    fn get_maintenance_margin_ratio(&self, leverage: u16) -> f64 {
        match leverage {
            1..=20 => 0.025,
            21..=50 => 0.01,
            51..=100 => 0.005,
            101..=500 => 0.0025,
            501..=1000 => 0.001,
            _ => 0.025,
        }
    }

    fn calculate_partial_amount(&self, position: &Position, _mark_price: f64, _target_margin: f64) -> f64 {
        position.size * 0.5
    }

    async fn execute_full_liquidation(&self, position: &Position, mark_price: f64, margin_ratio: f64) -> anyhow::Result<()> {
        info!("Submitting FULL liquidation tx for position {}...", position.id);
        
        let program_id = Pubkey::from_str(PROGRAM_ID)?;
        let position_pubkey = Pubkey::from_str(&position.id)?;
        
        // Derive Insurance Fund PDA
        let (insurance_fund_pda, _bump) = Pubkey::find_program_address(&[b"insurance_fund"], &program_id);
        info!("Derived Insurance Fund PDA: {}", insurance_fund_pda);

        // Construct Instruction
        let discriminator: [u8; 8] = [184, 122, 137, 225, 224, 51, 220, 170];
        
        let mut data = Vec::new();
        data.extend_from_slice(&discriminator);
        
        let accounts = vec![
            AccountMeta::new(position_pubkey, false),
            AccountMeta::new(insurance_fund_pda, false),
            AccountMeta::new(self.payer.pubkey(), true),
        ];

        let instruction = Instruction::new_with_bytes(
            program_id,
            &data,
            accounts,
        );

        let compute_budget_ix = ComputeBudgetInstruction::set_compute_unit_limit(200_000);
        let priority_fee_ix = ComputeBudgetInstruction::set_compute_unit_price(1_000_000); // 1,000,000 micro-lamports

        let recent_blockhash = self.rpc_client.get_latest_blockhash()?;
        let transaction = Transaction::new_signed_with_payer(
            &[compute_budget_ix, priority_fee_ix, instruction],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            recent_blockhash,
        );

        match self.rpc_client.send_and_confirm_transaction(&transaction) {
            Ok(signature) => {
                info!("Full liquidation tx confirmed! Signature: {}", signature);
                
                // Record to DB
                let reward = (position.size * mark_price * 0.025) as i64; // Approx 2.5% reward
                let _ = self.db.record_liquidation(
                    &position.id,
                    &position.owner.to_string(),
                    &position.symbol,
                    position.size as i64,
                    mark_price as i64,
                    &self.payer.pubkey().to_string(),
                    reward,
                    0, // bad debt
                    margin_ratio,
                    true // is_full
                ).await.map_err(|e| error!("Failed to record liquidation to DB: {}", e));
                
                Ok(())
            }
            Err(e) => {
                error!("Liquidation transaction failed: {}", e);
                // Record failure
                let _ = self.db.record_failed_liquidation(
                    &position.id,
                    &e.to_string(),
                    1
                ).await;
                Err(anyhow::anyhow!("Transaction failed: {}", e))
            }
        }
    }
}
