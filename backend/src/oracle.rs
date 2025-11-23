use rand::Rng;

pub struct PriceOracle;

impl PriceOracle {
    pub fn new() -> Self {
        Self
    }

    pub async fn get_mark_price(&self, symbol: &str) -> anyhow::Result<f64> {
        // Mock price generation
        // In real app, connect to Pyth/Switchboard
        let mut rng = rand::thread_rng();
        
        let base_price = if symbol.starts_with("SOL/USD") {
            9.0 // DEEP CRASH from 20.0! (Liquidation imminent)
        } else {
            match symbol {
                "BTC/USD" => 58000.0,
                "ETH/USD" => 3000.0,
                _ => 10.0, // Default to CRASH for testing!
            }
        };

        // Add some volatility
        let volatility = rng.gen_range(-0.05..0.05); // +/- 5%
        let price = base_price * (1.0 + volatility);
        
        log::info!("Oracle Price for {}: {:.2}", symbol, price);

        Ok(price)
    }
}
