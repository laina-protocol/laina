use soroban_sdk::{contracttype, Address};

/* Ledger Thresholds */

pub(crate) const DAY_IN_LEDGERS: u32 = 17280; // if ledger takes 5 seconds

pub(crate) const POSITIONS_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub(crate) const POSITIONS_LIFETIME_THRESHOLD: u32 = POSITIONS_BUMP_AMOUNT - DAY_IN_LEDGERS;

/* Storage Types */
#[derive(Clone)]
#[contracttype]
pub struct Loan {
    pub borrower: Address,
    pub borrowed_amount: i128,
    pub borrowed_from: Address,
    pub collateral_amount: i128,
    pub collateral_from: Address,
    pub health_factor: i128,
    pub unpaid_interest: i128,
    pub last_accrual: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum LoansDataKey {
    Admin,
    PoolAddresses,
    // Users positions in the pool
    Loan(Address),
    Addresses,
    LastUpdated,
}
