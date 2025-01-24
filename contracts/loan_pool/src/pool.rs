use crate::storage_types::{extend_persistent, PoolDataKey};
use soroban_sdk::{contracterror, contracttype, Address, Env, Symbol};

#[contracttype]
pub struct Currency {
    pub token_address: Address,
    pub ticker: Symbol,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    LoanManager = 1,
    Currency = 2,
    LiquidationThreshold = 3,
    TotalShares = 4,
    TotalBalance = 5,
    AvailableBalance = 6,
    Accrual = 7,
    AccrualLastUpdated = 8,
    OverOrUnderFlow = 9,
    NegativeDeposit = 10,
    WithdrawOverBalance = 11,
    WithdrawIsNegative = 12,
}

pub fn write_loan_manager_addr(e: &Env, loan_manager_addr: Address) {
    let key = PoolDataKey::LoanManagerAddress;

    e.storage().persistent().set(&key, &loan_manager_addr);
    extend_persistent(e.clone(), &key);
}

pub fn read_loan_manager_addr(e: &Env) -> Result<Address, Error> {
    let key = PoolDataKey::LoanManagerAddress;

    if let Some(loan_manager_address) = e.storage().persistent().get(&key) {
        loan_manager_address
    } else {
        Err(Error::LoanManager)
    }
}

pub fn write_currency(e: &Env, currency: Currency) {
    let key = PoolDataKey::Currency;

    e.storage().persistent().set(&key, &currency);
    extend_persistent(e.clone(), &key);
}

pub fn read_currency(e: &Env) -> Result<Currency, Error> {
    let key = PoolDataKey::Currency;

    if let Some(currency) = e.storage().persistent().get(&key) {
        currency
    } else {
        Err(Error::Currency)
    }
}

pub fn write_liquidation_threshold(e: &Env, threshold: i128) {
    let key = PoolDataKey::LiquidationThreshold;

    e.storage().persistent().set(&key, &threshold);
    extend_persistent(e.clone(), &key);
}

pub fn write_total_shares(e: &Env, amount: i128) {
    let key: PoolDataKey = PoolDataKey::TotalBalanceShares;

    e.storage().persistent().set(&key, &amount);
    extend_persistent(e.clone(), &key);
}

pub fn read_total_shares(e: &Env) -> Result<i128, Error> {
    let key: PoolDataKey = PoolDataKey::TotalBalanceShares;

    if let Some(total_shares) = e.storage().persistent().get(&key) {
        total_shares
    } else {
        Err(Error::TotalShares)
    }
}

pub fn change_total_shares(e: &Env, amount: i128) -> Result<i128, Error> {
    let current_balance = read_total_shares(e)?;

    let new_amount = amount
        .checked_add(current_balance)
        .ok_or(Error::OverOrUnderFlow)?;
    write_total_shares(e, new_amount);
    Ok(new_amount)
}

pub fn write_total_balance(e: &Env, amount: i128) {
    let key: PoolDataKey = PoolDataKey::TotalBalanceTokens;

    e.storage().persistent().set(&key, &amount);
    extend_persistent(e.clone(), &key);
}

pub fn read_total_balance(e: &Env) -> Result<i128, Error> {
    let key: PoolDataKey = PoolDataKey::TotalBalanceTokens;

    if let Some(total_balance) = e.storage().persistent().get(&key) {
        total_balance
    } else {
        Err(Error::TotalBalance)
    }
}

pub fn change_total_balance(e: &Env, amount: i128) -> Result<i128, Error> {
    let current_balance = read_total_balance(e)?;

    let new_amount = amount
        .checked_add(current_balance)
        .ok_or(Error::OverOrUnderFlow)?;
    write_total_balance(e, new_amount);
    Ok(new_amount)
}

pub fn write_available_balance(e: &Env, amount: i128) {
    let key: PoolDataKey = PoolDataKey::AvailableBalanceTokens;

    e.storage().persistent().set(&key, &amount);
    extend_persistent(e.clone(), &key);
}

pub fn read_available_balance(e: &Env) -> Result<i128, Error> {
    let key: PoolDataKey = PoolDataKey::AvailableBalanceTokens;

    if let Some(available_balance) = e.storage().persistent().get(&key) {
        available_balance
    } else {
        Err(Error::AvailableBalance)
    }
}

pub fn change_available_balance(e: &Env, amount: i128) -> Result<i128, Error> {
    let current_balance = read_available_balance(e)?;

    let new_amount = amount
        .checked_add(current_balance)
        .ok_or(Error::OverOrUnderFlow)?;
    write_available_balance(e, new_amount);
    Ok(new_amount)
}

pub fn write_accrual(e: &Env, accrual: i128) {
    let key = PoolDataKey::Accrual;

    e.storage().persistent().set(&key, &accrual);
    extend_persistent(e.clone(), &key);
}

pub fn read_accrual(e: &Env) -> Result<i128, Error> {
    let key = PoolDataKey::Accrual;

    if let Some(accrual) = e.storage().persistent().get(&key) {
        accrual
    } else {
        Err(Error::Accrual)
    }
}

pub fn write_accrual_last_updated(e: &Env, sequence: u64) -> u64 {
    let key = PoolDataKey::AccrualLastUpdate;

    e.storage().persistent().set(&key, &sequence);
    extend_persistent(e.clone(), &key);

    sequence
}

pub fn read_accrual_last_updated(e: &Env) -> Result<u64, Error> {
    let key = PoolDataKey::AccrualLastUpdate;

    if let Some(accrual_last_updated) = e.storage().persistent().get(&key) {
        accrual_last_updated
    } else {
        Err(Error::AccrualLastUpdated)
    }
}
