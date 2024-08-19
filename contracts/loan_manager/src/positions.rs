use crate::storage_types::{LoansDataKey, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD};
use soroban_sdk::{Address, Env, IntoVal, Map, Symbol, Val};

pub fn init_loan(
    e: &Env,
    addr: Address,
    borrowed: i128,
    borrowed_from: Address,
    collateral: i128,
    collateral_from: Address,
) {
    // Here this part has to call health factor calculator but for now:
    let health_factor: i32 = 1000;
    write_positions(
        e,
        addr,
        borrowed,
        borrowed_from,
        collateral,
        collateral_from,
        health_factor,
    );
}

fn write_positions(
    e: &Env,
    addr: Address,
    borrowed: i128,
    borrowed_from: Address,
    collateral: i128,
    collateral_from: Address,
    health_factor: i32,
) {
    let key = LoansDataKey::Loan(addr);
    // Initialize the map with the environment
    let mut positions: Map<Symbol, Val> = Map::new(e);

    // Set position values in the map
    positions.set(Symbol::new(e, "borrowed"), borrowed.into_val(e));
    positions.set(Symbol::new(e, "borrowed_from"), borrowed_from.into_val(e));
    positions.set(Symbol::new(e, "collateral"), collateral.into_val(e));
    positions.set(
        Symbol::new(e, "collateral_from"),
        collateral_from.into_val(e),
    );
    positions.set(Symbol::new(e, "health_factor"), health_factor.into_val(e));

    // Transform the map of positions in to Val so it can be stored
    let val: Val = positions.into_val(e);

    e.storage().persistent().set(&key, &val);
    e.storage()
        .persistent()
        .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}
