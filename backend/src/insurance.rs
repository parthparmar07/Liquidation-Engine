use std::sync::Arc;
use tokio::time::{interval, Duration};
use log::{info, warn, error};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{pubkey::Pubkey, commitment_config::CommitmentConfig};
use borsh::BorshDeserialize;
use crate::db::Database;
use std::str::FromStr;

// Program ID
const PROGRAM_ID: &str = "HCJaVaM9GEH4nYoX6UquxWXroXJyjSLp2LLKCa1gg5NJ";

#[derive(BorshDeserialize, Debug)]
pub struct OnChainInsuranceFund {
    pub authority: Pubkey,
    pub balance: u64,
    pub total_contributions: u64,
    pub total_bad_debt_covered: u64,
    pub utilization_ratio: u64,
}

use crate::websocket::{Broadcaster, WsMessage};

pub struct InsuranceFundManager {
    rpc_client: Arc<RpcClient>,
    db: Arc<Database>,
    broadcaster: Arc<Broadcaster>,
    check_interval_ms: u64,
    last_balance: u64,
}

impl InsuranceFundManager {
    pub fn new(db: Arc<Database>, broadcaster: Arc<Broadcaster>) -> Self {
        let rpc_url = std::env::var("SOLANA_RPC_URL").unwrap_or_else(|_| "http://127.0.0.1:8899".to_string());
        let rpc_client = Arc::new(RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed()));

        Self {
            rpc_client,
            db,
            broadcaster,
            check_interval_ms: 5000, // Check every 5 seconds
            last_balance: 0,
        }
    }

    pub async fn start(&mut self) {
        let mut timer = interval(Duration::from_millis(self.check_interval_ms));
        info!("Insurance Fund Manager started.");

        let program_id = Pubkey::from_str(PROGRAM_ID).unwrap();
        let (insurance_fund_pda, _) = Pubkey::find_program_address(&[b"insurance_fund"], &program_id);

        loop {
            timer.tick().await;
            
            match self.rpc_client.get_account_data(&insurance_fund_pda) {
                Ok(data) => {
                    if data.len() < 8 {
                        continue;
                    }
                    // Skip discriminator
                    let account_data = &data[8..];
                    
                    match OnChainInsuranceFund::try_from_slice(account_data) {
                        Ok(fund) => {
                            self.check_fund_health(&fund).await;
                        }
                        Err(e) => {
                            error!("Failed to deserialize Insurance Fund account: {}", e);
                        }
                    }
                }
                Err(e) => {
                    // It's possible the account doesn't exist yet if not initialized
                    // warn!("Failed to fetch Insurance Fund account: {}", e);
                }
            }
        }
    }

    async fn check_fund_health(&mut self, fund: &OnChainInsuranceFund) {
        // Check for balance changes
        if fund.balance != self.last_balance {
            let diff = fund.balance as i64 - self.last_balance as i64;
            let reason = if diff > 0 { "Deposit/Fee" } else { "Bad Debt Cover" };
            let tx_type = if diff > 0 { "DEPOSIT" } else { "WITHDRAWAL" };

            info!("Insurance Fund Balance changed: {} -> {} (Diff: {})", self.last_balance, fund.balance, diff);

            // Record to DB
            if let Err(e) = self.db.record_insurance_fund_transaction(
                diff.abs(),
                tx_type,
                reason
            ).await {
                error!("Failed to record insurance fund transaction: {}", e);
            }

            self.last_balance = fund.balance;

            // Broadcast update
            self.broadcaster.send(WsMessage::InsuranceFundUpdate {
                balance: fund.balance,
            });
        }

        // Check for low balance alert
        let min_threshold = 1_000_000; // Example threshold
        if fund.balance < min_threshold {
            warn!("CRITICAL: Insurance Fund balance is LOW! Current: {}", fund.balance);
            // In a real system, send PagerDuty/Slack alert here
        }
    }
}
