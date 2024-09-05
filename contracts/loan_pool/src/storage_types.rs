use soroban_sdk::{contracttype, Address, Symbol};

/* Storage Types */

// Config for pool
#[derive(Clone)]
#[contracttype]
pub struct PoolConfig {
    pub oracle: Address, // The contract address for the price oracle
    pub status: u32,     // Status of the pool
}

#[contracttype]
pub struct Currency {
    pub token_address: Address,
    pub ticker: Symbol,
}

#[derive(Clone)]
#[contracttype]
pub struct Positions {
    // struct names under 9 characters are marginally more efficient. Need to think if we value marginal efficiency over readibility
    pub receivables: i128,
    pub liabilities: i128,
    pub collateral: i128,
}

/* Input types */

pub struct PositionsInput {
    pub receivables: Option<i128>,
    pub liabilities: Option<i128>,
    pub collateral: Option<i128>,
}
