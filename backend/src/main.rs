mod monitor;
mod executor;
mod queue;
mod oracle;
mod db;
mod server;
mod websocket;
mod insurance;
#[cfg(test)]
mod tests;

use dotenv::dotenv;
use log::{info, error};
use monitor::LiquidationEngine;
use db::Database;
use queue::LiquidationQueue;
use websocket::Broadcaster;
use insurance::InsuranceFundManager;
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    env_logger::init();

    info!("Starting Liquidation Engine Service...");

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:liquidation_engine.db".to_string());
    
    info!("Connecting to database: {}", database_url);
    let db = match Database::new(&database_url).await {
        Ok(db) => {
            info!("Database connected successfully");
            if let Err(e) = db.init_schema().await {
                log::warn!("Failed to initialize database schema: {}", e);
            } else {
                info!("Database schema initialized");
            }
            Arc::new(db)
        }
        Err(e) => {
            error!("Database connection failed: {}", e);
            return Err(anyhow::anyhow!("Database connection failed"));
        }
    };

    let queue = Arc::new(LiquidationQueue::new());
    let broadcaster = Arc::new(Broadcaster::new());

    let engine = LiquidationEngine::new(db.clone(), queue.clone(), broadcaster.clone()).await?;
    let mut insurance_manager = InsuranceFundManager::new(db.clone(), broadcaster.clone());

    // Start insurance manager in background
    tokio::spawn(async move {
        insurance_manager.start().await;
    });

    // Start server and engine concurrently
    tokio::select! {
        result = server::start_server(db.clone(), queue.clone(), broadcaster.clone()) => {
            if let Err(e) = result {
                error!("API Server failed: {}", e);
            }
        }
        _ = engine.start() => {
            info!("Liquidation Engine stopped");
        }
    }

    Ok(())
}
