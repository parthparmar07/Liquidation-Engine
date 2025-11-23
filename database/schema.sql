-- Liquidation History
CREATE TABLE liquidations (
    id SERIAL PRIMARY KEY,
    position_id VARCHAR(64) NOT NULL,
    user_address VARCHAR(64) NOT NULL,
    liquidator_address VARCHAR(64) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    liquidated_size DECIMAL NOT NULL,
    liquidation_price DECIMAL NOT NULL,
    margin_before DECIMAL NOT NULL,
    margin_after DECIMAL NOT NULL,
    reward DECIMAL NOT NULL,
    is_full_liquidation BOOLEAN NOT NULL,
    tx_signature VARCHAR(128) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bad Debt Events
CREATE TABLE bad_debt_events (
    id SERIAL PRIMARY KEY,
    liquidation_id INTEGER REFERENCES liquidations(id),
    amount DECIMAL NOT NULL,
    covered_by_insurance BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Fund Transactions
CREATE TABLE insurance_fund_transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'COVER_BAD_DEBT'
    amount DECIMAL NOT NULL,
    balance_after DECIMAL NOT NULL,
    tx_signature VARCHAR(128),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Liquidator Performance
CREATE TABLE liquidator_rewards (
    liquidator_address VARCHAR(64) PRIMARY KEY,
    total_liquidations INTEGER DEFAULT 0,
    total_rewards DECIMAL DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE
);
