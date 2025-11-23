use sqlx::{SqlitePool, Pool, Sqlite};
use chrono::{DateTime, Utc};
use anyhow::Result;

#[derive(Debug, Clone, serde::Serialize)]
pub struct LiquidationRecord {
    pub id: i64,
    pub position_pubkey: String,
    pub owner_pubkey: String,
    pub symbol: String,
    pub liquidated_size: i64,
    pub liquidation_price: i64,
    pub liquidator_pubkey: String,
    pub liquidator_reward: i64,
    pub bad_debt: i64,
    pub health_factor_before: f64,
    pub is_full_liquidation: bool,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PositionSnapshot {
    pub id: i64,
    pub position_pubkey: String,
    pub owner_pubkey: String,
    pub symbol: String,
    pub size: i64,
    pub collateral: i64,
    pub entry_price: i64,
    pub current_price: i64,
    pub health_factor: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct InsuranceFundTransaction {
    pub id: i64,
    pub amount: i64,
    pub transaction_type: String, // "DEPOSIT", "WITHDRAWAL", "BAD_DEBT_COVER"
    pub reason: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FailedLiquidation {
    pub id: i64,
    pub position_pubkey: String,
    pub error_message: String,
    pub retry_count: i32,
    pub timestamp: DateTime<Utc>,
}

pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(database_path: &str) -> Result<Self> {
        let pool = SqlitePool::connect(database_path).await?;
        Ok(Self { pool })
    }

    /// Initialize database schema
    pub async fn init_schema(&self) -> Result<()> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS liquidations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                position_pubkey TEXT NOT NULL,
                owner_pubkey TEXT NOT NULL,
                symbol TEXT NOT NULL,
                liquidated_size INTEGER NOT NULL,
                liquidation_price INTEGER NOT NULL,
                liquidator_pubkey TEXT NOT NULL,
                liquidator_reward INTEGER NOT NULL,
                bad_debt INTEGER NOT NULL,
                health_factor_before REAL NOT NULL,
                is_full_liquidation INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_liquidations_timestamp 
                ON liquidations(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_liquidations_symbol 
                ON liquidations(symbol);
            CREATE INDEX IF NOT EXISTS idx_liquidations_owner 
                ON liquidations(owner_pubkey);
            "#
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS position_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                position_pubkey TEXT NOT NULL,
                owner_pubkey TEXT NOT NULL,
                symbol TEXT NOT NULL,
                size INTEGER NOT NULL,
                collateral INTEGER NOT NULL,
                entry_price INTEGER NOT NULL,
                current_price INTEGER NOT NULL,
                health_factor REAL NOT NULL,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_snapshots_position_time 
                ON position_snapshots(position_pubkey, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp 
                ON position_snapshots(timestamp DESC);
            "#
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS insurance_fund_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount INTEGER NOT NULL,
                transaction_type TEXT NOT NULL,
                reason TEXT NOT NULL,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_insurance_timestamp 
                ON insurance_fund_transactions(timestamp DESC);
            "#
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS failed_liquidations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                position_pubkey TEXT NOT NULL,
                error_message TEXT NOT NULL,
                retry_count INTEGER NOT NULL,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_failed_timestamp 
                ON failed_liquidations(timestamp DESC);
            "#
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Record a liquidation event
    pub async fn record_liquidation(
        &self,
        position_pubkey: &str,
        owner_pubkey: &str,
        symbol: &str,
        liquidated_size: i64,
        liquidation_price: i64,
        liquidator_pubkey: &str,
        liquidator_reward: i64,
        bad_debt: i64,
        health_factor_before: f64,
        is_full_liquidation: bool,
    ) -> Result<i64> {
        let timestamp = Utc::now().to_rfc3339();
        let is_full = if is_full_liquidation { 1 } else { 0 };
        
        let record = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT INTO liquidations (
                position_pubkey, owner_pubkey, symbol, liquidated_size,
                liquidation_price, liquidator_pubkey, liquidator_reward,
                bad_debt, health_factor_before, is_full_liquidation, timestamp
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
            "#
        )
        .bind(position_pubkey)
        .bind(owner_pubkey)
        .bind(symbol)
        .bind(liquidated_size)
        .bind(liquidation_price)
        .bind(liquidator_pubkey)
        .bind(liquidator_reward)
        .bind(bad_debt)
        .bind(health_factor_before)
        .bind(is_full)
        .bind(timestamp)
        .fetch_one(&self.pool)
        .await?;

        Ok(record)
    }

    /// Save a position snapshot for historical tracking
    pub async fn save_position_snapshot(
        &self,
        position_pubkey: &str,
        owner_pubkey: &str,
        symbol: &str,
        size: i64,
        collateral: i64,
        entry_price: i64,
        current_price: i64,
        health_factor: f64,
    ) -> Result<i64> {
        let timestamp = Utc::now().to_rfc3339();
        
        let record = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT INTO position_snapshots (
                position_pubkey, owner_pubkey, symbol, size,
                collateral, entry_price, current_price, health_factor, timestamp
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
            "#
        )
        .bind(position_pubkey)
        .bind(owner_pubkey)
        .bind(symbol)
        .bind(size)
        .bind(collateral)
        .bind(entry_price)
        .bind(current_price)
        .bind(health_factor)
        .bind(timestamp)
        .fetch_one(&self.pool)
        .await?;

        Ok(record)
    }

    /// Record insurance fund transaction
    pub async fn record_insurance_fund_transaction(
        &self,
        amount: i64,
        transaction_type: &str,
        reason: &str,
    ) -> Result<i64> {
        let timestamp = Utc::now().to_rfc3339();
        
        let record = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT INTO insurance_fund_transactions (
                amount, transaction_type, reason, timestamp
            )
            VALUES (?, ?, ?, ?)
            RETURNING id
            "#
        )
        .bind(amount)
        .bind(transaction_type)
        .bind(reason)
        .bind(timestamp)
        .fetch_one(&self.pool)
        .await?;

        Ok(record)
    }

    /// Record failed liquidation
    pub async fn record_failed_liquidation(
        &self,
        position_pubkey: &str,
        error_message: &str,
        retry_count: i32,
    ) -> Result<i64> {
        let timestamp = Utc::now().to_rfc3339();
        
        let record = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT INTO failed_liquidations (
                position_pubkey, error_message, retry_count, timestamp
            )
            VALUES (?, ?, ?, ?)
            RETURNING id
            "#
        )
        .bind(position_pubkey)
        .bind(error_message)
        .bind(retry_count)
        .bind(timestamp)
        .fetch_one(&self.pool)
        .await?;

        Ok(record)
    }

    /// Get recent liquidations
    pub async fn get_recent_liquidations(&self, limit: i64) -> Result<Vec<LiquidationRecord>> {
        let records = sqlx::query_as::<_, LiquidationRecord>(
            r#"
            SELECT id, position_pubkey, owner_pubkey, symbol, liquidated_size,
                   liquidation_price, liquidator_pubkey, liquidator_reward,
                   bad_debt, health_factor_before, is_full_liquidation, timestamp
            FROM liquidations
            ORDER BY timestamp DESC
            LIMIT ?
            "#
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }

    /// Get liquidation statistics for a time period
    pub async fn get_liquidation_stats(&self, hours: i32) -> Result<LiquidationStats> {
        let stats = sqlx::query_as::<_, LiquidationStats>(
            r#"
            SELECT 
                COUNT(*) as total_liquidations,
                SUM(liquidated_size) as total_volume,
                SUM(liquidator_reward) as total_rewards,
                SUM(bad_debt) as total_bad_debt,
                AVG(health_factor_before) as avg_health_factor
            FROM liquidations
            WHERE datetime(timestamp) > datetime('now', '-' || ? || ' hours')
            "#
        )
        .bind(hours)
        .fetch_one(&self.pool)
        .await?;

        Ok(stats)
    }

    /// Get position health history
    pub async fn get_position_health_history(
        &self,
        position_pubkey: &str,
        limit: i64,
    ) -> Result<Vec<PositionSnapshot>> {
        let snapshots = sqlx::query_as::<_, PositionSnapshot>(
            r#"
            SELECT id, position_pubkey, owner_pubkey, symbol, size,
                   collateral, entry_price, current_price, health_factor, timestamp
            FROM position_snapshots
            WHERE position_pubkey = ?
            ORDER BY timestamp DESC
            LIMIT ?
            "#
        )
        .bind(position_pubkey)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(snapshots)
    }

    /// Get insurance fund history
    pub async fn get_insurance_fund_history(&self, limit: i64) -> Result<Vec<InsuranceFundTransaction>> {
        let records = sqlx::query_as::<_, InsuranceFundTransaction>(
            r#"
            SELECT id, amount, transaction_type, reason, timestamp
            FROM insurance_fund_transactions
            ORDER BY timestamp DESC
            LIMIT ?
            "#
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct LiquidationStats {
    pub total_liquidations: Option<i64>,
    pub total_volume: Option<i64>,
    pub total_rewards: Option<i64>,
    pub total_bad_debt: Option<i64>,
    pub avg_health_factor: Option<f64>,
}

// Implement FromRow for custom types
impl sqlx::FromRow<'_, sqlx::sqlite::SqliteRow> for LiquidationRecord {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        use sqlx::Row;
        let is_full: i64 = row.try_get("is_full_liquidation")?;
        let timestamp_str: String = row.try_get("timestamp")?;
        let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc);
            
        Ok(Self {
            id: row.try_get("id")?,
            position_pubkey: row.try_get("position_pubkey")?,
            owner_pubkey: row.try_get("owner_pubkey")?,
            symbol: row.try_get("symbol")?,
            liquidated_size: row.try_get("liquidated_size")?,
            liquidation_price: row.try_get("liquidation_price")?,
            liquidator_pubkey: row.try_get("liquidator_pubkey")?,
            liquidator_reward: row.try_get("liquidator_reward")?,
            bad_debt: row.try_get("bad_debt")?,
            health_factor_before: row.try_get("health_factor_before")?,
            is_full_liquidation: is_full == 1,
            timestamp,
        })
    }
}

impl sqlx::FromRow<'_, sqlx::sqlite::SqliteRow> for PositionSnapshot {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        use sqlx::Row;
        let timestamp_str: String = row.try_get("timestamp")?;
        let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc);
            
        Ok(Self {
            id: row.try_get("id")?,
            position_pubkey: row.try_get("position_pubkey")?,
            owner_pubkey: row.try_get("owner_pubkey")?,
            symbol: row.try_get("symbol")?,
            size: row.try_get("size")?,
            collateral: row.try_get("collateral")?,
            entry_price: row.try_get("entry_price")?,
            current_price: row.try_get("current_price")?,
            health_factor: row.try_get("health_factor")?,
            timestamp,
        })
    }
}

impl sqlx::FromRow<'_, sqlx::sqlite::SqliteRow> for InsuranceFundTransaction {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        use sqlx::Row;
        let timestamp_str: String = row.try_get("timestamp")?;
        let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc);
            
        Ok(Self {
            id: row.try_get("id")?,
            amount: row.try_get("amount")?,
            transaction_type: row.try_get("transaction_type")?,
            reason: row.try_get("reason")?,
            timestamp,
        })
    }
}

impl sqlx::FromRow<'_, sqlx::sqlite::SqliteRow> for FailedLiquidation {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        use sqlx::Row;
        let timestamp_str: String = row.try_get("timestamp")?;
        let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc);
            
        Ok(Self {
            id: row.try_get("id")?,
            position_pubkey: row.try_get("position_pubkey")?,
            error_message: row.try_get("error_message")?,
            retry_count: row.try_get("retry_count")?,
            timestamp,
        })
    }
}
