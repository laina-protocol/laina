use soroban_sdk::{contracttype, Address, Env, TryFromVal, Val};

/* Ledger Thresholds */

pub(crate) const DAY_IN_LEDGERS: u32 = 17280; // if ledger takes 5 seconds

pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

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
pub enum PoolDataKey {
    // Pools tokens address
    Token(Address),
    // Users positions in the pool
    Positions(Address),
    // Total amount of shares in circulation
    TotalShares(i128),
}

/* Instance rent bumper */
pub fn extend_instance(e: Env) {
    e.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}
