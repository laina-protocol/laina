use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::error::LoanManagerError;

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
}

#[derive(Clone)]
#[contracttype]
enum LoanManagerDataKey {
    Admin,
    PoolAddresses,
    Loan(Address),
    BorrowerAddresses,
    LastUpdated,
}

pub fn write_admin(e: &Env, admin: &Address) {
    e.storage()
        .persistent()
        .set(&LoanManagerDataKey::Admin, admin)
}

pub fn admin_exists(e: &Env) -> bool {
    e.storage().persistent().has(&LoanManagerDataKey::Admin)
}

pub fn read_admin(e: &Env) -> Result<Address, LoanManagerError> {
    e.storage()
        .persistent()
        .get(&LoanManagerDataKey::Admin)
        .ok_or(LoanManagerError::NotInitialized)
}

pub fn write_loan(e: &Env, addr: Address, loan: Loan) {
    let key = LoanManagerDataKey::Loan(addr);

    e.storage().persistent().set(&key, &loan);

    e.storage()
        .persistent()
        .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}

pub fn user_loan_exists(e: &Env, user: Address) -> bool {
    e.storage()
        .persistent()
        .has(&LoanManagerDataKey::Loan(user))
}

pub fn read_loan(e: &Env, addr: Address) -> Result<Loan, LoanManagerError> {
    e.storage()
        .persistent()
        .get(&LoanManagerDataKey::Loan(addr))
        .ok_or(LoanManagerError::InvalidLoanInStorage)
}

pub fn delete_loan(e: &Env, user: Address) {
    e.storage()
        .persistent()
        .remove(&LoanManagerDataKey::Loan(user))
}

pub fn read_pool_addresses(e: &Env) -> Option<Vec<Address>> {
    e.storage()
        .persistent()
        .get(&LoanManagerDataKey::PoolAddresses)
}

pub fn write_pool_addresses(e: &Env, pool_addresses: &Vec<Address>) {
    e.storage()
        .persistent()
        .set(&LoanManagerDataKey::PoolAddresses, pool_addresses)
}

pub fn write_borrowers(e: &Env, borrowers: Vec<Address>) {
    let key = LoanManagerDataKey::BorrowerAddresses;
    e.storage().persistent().set(&key, &borrowers);
    e.storage()
        .persistent()
        .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}

pub fn read_borrowers(e: &Env) -> Result<Vec<Address>, LoanManagerError> {
    e.storage()
        .persistent()
        .get(&LoanManagerDataKey::BorrowerAddresses)
        .ok_or(LoanManagerError::NotInitialized)
}

pub fn append_borrower(e: &Env, user: Address) -> Result<(), LoanManagerError> {
    let mut borrowers = read_borrowers(e)?;

    if !borrowers.contains(&user) {
        borrowers.push_back(user);
    }

    write_borrowers(e, borrowers);
    Ok(())
}

pub fn read_last_updated(e: &Env) -> Option<u32> {
    e.storage()
        .persistent()
        .get(&LoanManagerDataKey::LastUpdated)
}

pub fn write_last_updated(e: &Env, ledger: &u32) {
    let key = LoanManagerDataKey::LastUpdated;

    e.storage().persistent().set(&key, ledger);
    e.storage()
        .persistent()
        .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}
