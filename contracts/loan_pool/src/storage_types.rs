use soroban_sdk::{contracttype, Address, Env};

/* Ledger Thresholds */

pub(crate) const DAY_IN_LEDGERS: u32 = 17280; // if ledger takes 5 seconds

pub(crate) const POSITIONS_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub(crate) const POSITIONS_LIFETIME_THRESHOLD: u32 = POSITIONS_BUMP_AMOUNT - DAY_IN_LEDGERS;

/* Storage Types */

// Config for pool
#[derive(Clone)]
#[contracttype]
pub struct PoolConfig {
    pub oracle: Address, // The contract address for the price oracle
    pub status: u32,     // Status of the pool
}

#[derive(Clone)]
#[contracttype]
pub struct Positions {
    // struct names under 9 characters are marginally more efficient. Need to think if we value marginal efficiency over readibility
    pub receivable_shares: i128,
    pub liabilities: i128,
    pub collateral: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum PoolDataKey {
    // Address of the loan manager for authorization.
    LoanManagerAddress,
    // Pool's token's address & ticker
    Currency,
    // The threshold when a loan should liquidate, unit is one-millionth
    LiquidationThreshold,
    // Users positions in the pool
    Positions(Address),
    // Total amount of shares in circulation
    TotalBalanceShares,
    // Total balance of pool
    TotalBalanceTokens,
    // Available balance of pool
    AvailableBalanceTokens,
    // Pool interest accrual index
    Accrual,
    // Last update ledger of accrual
    AccrualLastUpdate,
    // Interest rate multiplier
    InterestRateMultiplier,
}

/* Persistent ttl bumper */
pub fn extend_persistent(e: Env, key: &PoolDataKey) {
    e.storage()
        .persistent()
        .extend_ttl(key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}
