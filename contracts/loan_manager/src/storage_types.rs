use soroban_sdk::{contracttype, Address};

/* Ledger Thresholds */

pub(crate) const DAY_IN_LEDGERS: u32 = 17280; // if ledger takes 5 seconds

pub(crate) const POSITIONS_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub(crate) const POSITIONS_LIFETIME_THRESHOLD: u32 = POSITIONS_BUMP_AMOUNT - DAY_IN_LEDGERS;

/* Storage Types */

#[derive(Clone)]
#[contracttype]
pub enum LoansDataKey {
    // Users positions in the pool
    Loan(Address),
    Addresses,
}
