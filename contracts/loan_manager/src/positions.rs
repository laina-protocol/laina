use crate::storage_types::{
    Loan, LoansDataKey, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD,
};
use soroban_sdk::{Address, Env, IntoVal, Val};

pub fn init_loan(
    e: &Env,
    addr: Address,
    borrowed_amount: i128,
    borrowed_from: Address,
    collateral_amount: i128,
    collateral_from: Address,
    health_factor: i128,
) {
    write_positions(
        e,
        addr,
        borrowed_amount,
        borrowed_from,
        collateral_amount,
        collateral_from,
        health_factor,
    );
}

fn write_positions(
    e: &Env,
    addr: Address,
    borrowed_amount: i128,
    borrowed_from: Address,
    collateral_amount: i128,
    collateral_from: Address,
    health_factor: i128,
) {
    let key = LoansDataKey::Loan(addr);

    let loan: Loan = Loan {
        borrowed_amount,
        borrowed_from,
        collateral_amount,
        collateral_from,
        health_factor,
    };

    let val: Val = loan.into_val(e);

    e.storage().persistent().set(&key, &val);

    e.storage()
        .persistent()
        .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}

pub fn read_positions(e: &Env, addr: Address) -> Option<Loan> {
    let key = LoansDataKey::Loan(addr);

    let value: Option<Loan> = e.storage().persistent().get(&key)?;

    value
}
