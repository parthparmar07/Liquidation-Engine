use anyhow::Result;
use chrono::{Utc, Duration};
use rand::Rng;

mod db;
use db::Database;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();
    
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:liquidation_engine.db".to_string());

    println!("Connecting to database...");
    let db = Database::new(&database_url).await?;

    println!("Initializing schema...");
    db.init_schema().await?;

    println!("Populating with mock data...");
    
    let mut rng = rand::thread_rng();
    let symbols = vec!["SOL/USD", "BTC/USD", "ETH/USD", "AVAX/USD"];
    
    // Create 50 mock liquidations over the past 7 days
    for i in 0..50 {
        let hours_ago = rng.gen_range(0..168); // 7 days
        let symbol = symbols[rng.gen_range(0..symbols.len())];
        
        let liquidated_size = rng.gen_range(100_000..10_000_000);
        let liquidation_price = match symbol {
            "SOL/USD" => rng.gen_range(18_000_000..25_000_000),
            "BTC/USD" => rng.gen_range(40_000_000_000..50_000_000_000),
            "ETH/USD" => rng.gen_range(2_000_000_000..2_500_000_000),
            _ => rng.gen_range(30_000_000..40_000_000),
        };
        
        let health_factor = rng.gen_range(0.85..1.09);
        let is_full = health_factor < 0.95;
        
        db.record_liquidation(
            &format!("Pos{}...{}", i, rng.gen_range(1000..9999)),
            &format!("Own{}...{}", i, rng.gen_range(1000..9999)),
            symbol,
            liquidated_size,
            liquidation_price,
            &format!("Liq{}...{}", i, rng.gen_range(1000..9999)),
            liquidated_size / 40, // 2.5% reward
            if is_full { rng.gen_range(0..100_000) } else { 0 },
            health_factor,
            is_full,
        ).await?;
        
        println!("Created liquidation {}/50", i + 1);
    }

    // Create position snapshots for 8 positions over past 24 hours
    let positions = vec![
        ("Pos1...2a3b", "Own1...4c5d", "SOL/USD", 850_000, 12_450_000, 21_500_000),
        ("Pos2...6e7f", "Own2...8g9h", "BTC/USD", 1_200_000, 45_200_000, 44_500_000_000),
        ("Pos3...0i1j", "Own3...2k3l", "ETH/USD", 15_500_000, 28_900_000, 2_350_000_000),
        ("Pos4...4m5n", "Own4...6o7p", "SOL/USD", 520_000, 8_750_000, 22_100_000),
        ("Pos5...8q9r", "Own5...0s1t", "AVAX/USD", 580_000, 15_600_000, 35_800_000),
        ("Pos6...2u3v", "Own6...4w5x", "BTC/USD", 1_800_000, 67_300_000, 44_200_000_000),
        ("Pos7...6y7z", "Own7...8a9b", "ETH/USD", 10_200_000, 19_400_000, 2_420_000_000),
        ("Pos8...0c1d", "Own8...2e3f", "SOL/USD", 1_150_000, 22_100_000, 21_800_000),
    ];

    for (pos, owner, symbol, size, collateral, entry_price) in positions {
        // Create 24 snapshots (one per hour for past day)
        for hour in 0..24 {
            let price_variation = rng.gen_range(0.95..1.05);
            let current_price = (entry_price as f64 * price_variation) as i64;
            
            // Calculate health factor
            let position_value = (size as f64 * current_price as f64) / 1_000_000.0;
            let health_factor = (collateral as f64 / position_value) * 2.0;
            
            db.save_position_snapshot(
                pos,
                owner,
                symbol,
                size,
                collateral,
                entry_price,
                current_price,
                health_factor,
            ).await?;
        }
        println!("Created snapshots for position {}", pos);
    }

    println!("\n✅ Database populated successfully!");
    println!("\nYou can now query:");
    println!("  - Recent liquidations: SELECT * FROM liquidations ORDER BY timestamp DESC LIMIT 10;");
    println!("  - Position snapshots: SELECT * FROM position_snapshots ORDER BY timestamp DESC LIMIT 10;");
    println!("\nOr use the backend API to fetch this data!");

    Ok(())
}
