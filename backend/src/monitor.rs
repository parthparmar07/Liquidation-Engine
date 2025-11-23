use solana_client::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_sdk::pubkey::Pubkey;
use std::sync::Arc;
use std::collections::HashMap;
use tokio::time::{interval, Duration};
use log::{info, warn, error};
use crate::oracle::PriceOracle;
use crate::queue::LiquidationQueue;
use crate::executor::LiquidationExecutor;
use crate::db::Database;
use crate::websocket::{Broadcaster, WsMessage};
use std::str::FromStr;
use borsh::BorshDeserialize;
use serde::Serialize;

const PROGRAM_ID: &str = "HCJaVaM9GEH4nYoX6UquxWXroXJyjSLp2LLKCa1gg5NJ";

#[derive(Debug, Clone, Serialize)]
pub struct Position {
    pub id: String,
    pub owner: Pubkey,
    pub symbol: String,
    pub size: f64,
    pub collateral: f64,
    pub entry_price: f64,
    pub leverage: u8,
    pub is_long: bool,
}

#[derive(BorshDeserialize, Debug)]
pub struct OnChainPosition {
    pub owner: Pubkey,
    pub symbol: String,
    pub size: u64,
    pub collateral: u64,
    pub entry_price: u64,
    pub leverage: u16,
    pub maintenance_margin: u64,
}

pub struct LiquidationEngine {
    check_interval_ms: u64,
    oracle: Arc<PriceOracle>,
    executor: Arc<LiquidationExecutor>,
    queue: Arc<LiquidationQueue>,
    rpc_client: Arc<RpcClient>,
    broadcaster: Arc<Broadcaster>,
}

impl LiquidationEngine {
    pub async fn new(
        db: Arc<Database>, 
        queue: Arc<LiquidationQueue>,
        broadcaster: Arc<Broadcaster>
    ) -> anyhow::Result<Self> {
        let rpc_url = std::env::var("SOLANA_RPC_URL").unwrap_or_else(|_| "http://127.0.0.1:8899".to_string());
        let rpc_client = Arc::new(RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed()));

        Ok(Self {
            check_interval_ms: 2000,
            oracle: Arc::new(PriceOracle::new()),
            executor: Arc::new(LiquidationExecutor::new(db)),
            queue,
            rpc_client,
            broadcaster,
        })
    }

    pub async fn start(&self) {
        let mut timer = interval(Duration::from_millis(self.check_interval_ms));
        info!("Liquidation Engine monitoring program: {}", PROGRAM_ID);
        
        loop {
            timer.tick().await;
            if let Err(e) = self.check_all_positions().await {
                error!("Error checking positions: {:?}", e);
            }
        }
    }

    async fn check_all_positions(&self) -> anyhow::Result<()> {
        let open_positions = self.fetch_on_chain_positions().await?;
        
        if !open_positions.is_empty() {
            info!("Found {} open positions on-chain.", open_positions.len());
        } else {
             return Ok(());
        }

        let mut price_cache: HashMap<String, f64> = HashMap::new();

        for position in open_positions {
            let mark_price = if let Some(&cached) = price_cache.get(&position.symbol) {
                cached
            } else {
                let price = self.oracle.get_mark_price(&position.symbol).await?;
                price_cache.insert(position.symbol.clone(), price);
                price
            };

            let unrealized_pnl = if position.is_long {
                position.size * (mark_price - position.entry_price)
            } else {
                position.size * (position.entry_price - mark_price)
            };

            let position_value = position.size * mark_price;
            
            if position_value == 0.0 {
                continue;
            }

            let margin_ratio = (position.collateral + unrealized_pnl) / position_value;
            let maintenance_margin_ratio = self.get_maintenance_margin_ratio(position.leverage);
            let warning_threshold = maintenance_margin_ratio * 1.1;
            
            if margin_ratio < maintenance_margin_ratio {
                info!("LIQUIDATION TRIGGERED: Position {}. Margin Ratio: {:.4} < Maintenance: {:.4}", 
                    position.id, margin_ratio, maintenance_margin_ratio);
                
                self.queue.push(position.clone(), margin_ratio).await;
                self.executor.liquidate_position(&position, mark_price, margin_ratio).await?;

                self.broadcaster.send(WsMessage::LiquidationEvent {
                    position_id: position.id.clone(),
                    symbol: position.symbol.clone(),
                    amount: position.size,
                    price: mark_price,
                });
            } else if margin_ratio < warning_threshold {
                warn!("RISK ALERT: Position {} is approaching liquidation. Margin: {:.4}, Threshold: {:.4}", 
                    position.id, margin_ratio, maintenance_margin_ratio);
            }
        }
        Ok(())
    }

    async fn fetch_on_chain_positions(&self) -> anyhow::Result<Vec<Position>> {
        let program_id = Pubkey::from_str(PROGRAM_ID)?;
        let accounts = self.rpc_client.get_program_accounts(&program_id)?;
        let mut positions = Vec::new();

        for (pubkey, account) in accounts {
            if account.data.len() < 8 {
                warn!("Account {} data too short: {}", pubkey, account.data.len());
                continue;
            }

            if pubkey.to_string() == "9K3sRRPZRxfP8ECxkW7mPZ3GiMLbW1PWU2HuBn8seCHS" {
                continue;
            }

            let data_slice = &account.data[8..];
            
            if let Ok(on_chain_pos) = OnChainPosition::try_from_slice(data_slice) {
                let scale = 1_000_000.0;
                
                positions.push(Position {
                    id: pubkey.to_string(),
                    owner: on_chain_pos.owner,
                    symbol: on_chain_pos.symbol,
                    size: on_chain_pos.size as f64 / scale,
                    collateral: on_chain_pos.collateral as f64 / scale,
                    entry_price: on_chain_pos.entry_price as f64 / scale,
                    leverage: on_chain_pos.leverage as u8,
                    is_long: true,
                });
            }
        }

        Ok(positions)
    }

    fn get_maintenance_margin_ratio(&self, leverage: u8) -> f64 {
        match leverage {
            1..=20 => 0.025,
            21..=50 => 0.01,
            51..=100 => 0.005,
            _ => 0.025,
        }
    }
}
