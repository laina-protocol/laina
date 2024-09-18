use crate::storage_types::PoolDataKey;
use soroban_sdk::{contracttype, Address, Env, Symbol};

#[contracttype]
pub struct Currency {
    pub token_address: Address,
    pub ticker: Symbol,
}

pub fn write_loan_manager_addr(e: &Env, loan_manager_addr: Address) {
    let key = PoolDataKey::LoanManagerAddress;

    e.storage().persistent().set(&key, &loan_manager_addr);
}

pub fn read_loan_manager_addr(e: &Env) -> Address {
    let key = PoolDataKey::LoanManagerAddress;

    e.storage().persistent().get(&key).unwrap()
}

pub fn write_currency(e: &Env, currency: Currency) {
    let key = PoolDataKey::Currency;

    e.storage().persistent().set(&key, &currency);
}

pub fn read_currency(e: &Env) -> Currency {
    let key = PoolDataKey::Currency;

    e.storage().persistent().get(&key).unwrap()
}

pub fn write_liquidation_threshold(e: &Env, threshold: i128) {
    let key = PoolDataKey::LiquidationThreshold;

    e.storage().persistent().set(&key, &threshold);
}

pub fn write_total_shares(e: &Env, amount: i128) {
    let key: PoolDataKey = PoolDataKey::TotalShares;

    e.storage().persistent().set(&key, &amount);
}

pub fn write_total_balance(e: &Env, amount: i128) {
    let key: PoolDataKey = PoolDataKey::TotalBalance;

    e.storage().persistent().set(&key, &amount);
}

pub fn read_total_balance(e: &Env) -> i128 {
    let key: PoolDataKey = PoolDataKey::TotalBalance;

    e.storage().persistent().get(&key).unwrap()
}

pub fn write_available_balance(e: &Env, amount: i128) {
    let key: PoolDataKey = PoolDataKey::AvailableBalance;

    e.storage().persistent().set(&key, &amount);
}

pub fn read_available_balance(e: &Env) -> i128 {
    let key: PoolDataKey = PoolDataKey::AvailableBalance;

    e.storage().persistent().get(&key).unwrap()
}

pub fn increase_total_balance(e: &Env, amount: i128) {
    let current_balance = read_total_balance(e);

    write_total_balance(e, amount + current_balance);
}
