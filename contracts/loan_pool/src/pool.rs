use crate::storage_types::PoolDataKey;
use soroban_sdk::{Address, Env};

pub fn write_token(e: &Env, token: Address) {
    let key: PoolDataKey = PoolDataKey::Token;

    e.storage().persistent().set(&key, &token);
}

pub fn write_total_shares(e: &Env, amount: i128) {
    let key: PoolDataKey = PoolDataKey::TotalShares;

    e.storage().persistent().set(&key, &amount);
}

pub fn read_total_shares(e: &Env) -> i128 {
    let key: PoolDataKey = PoolDataKey::TotalShares;

    e.storage().persistent().get(&key).unwrap()
}

pub fn write_total_balance(e: &Env, amount: i128) {
    let key: PoolDataKey = PoolDataKey::TotalBalance;

    e.storage().persistent().set(&key, &amount);
}

pub fn read_total_balance(e: &Env) -> i128 {
    let key: PoolDataKey = PoolDataKey::TotalBalance;

    e.storage().persistent().get(&key).unwrap()
}