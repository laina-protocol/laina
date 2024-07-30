use crate::storage_types::{PoolDataKey, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD};
use soroban_sdk::{Address, Env};

pub fn read_positions(e: &Env, addr: Address) -> i128 {
    let key = PoolDataKey::Positions(addr);
    if let Some(positions) = e.storage().persistent().get::<PoolDataKey, i128>(&key) {
        e.storage()
            .persistent()
            .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
        positions
    } else {
        0
    }
}

fn write_positions(e: &Env, addr: Address, amount: i128) {
    let key = PoolDataKey::Positions(addr);
    e.storage().persistent().set(&key, &amount);
    e.storage()
        .persistent()
        .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}

pub fn increase_positions(e: &Env, addr: Address, amount: i128) {
    let positions = read_positions(e, addr.clone());
    write_positions(e, addr, positions + amount);
}

pub fn decrease_positions(e: &Env, addr: Address, amount: i128) {
    let positions = read_positions(e, addr.clone());
    if positions < amount {
        panic!("insufficient positions");
    }
    write_positions(e, addr, positions - amount);
}