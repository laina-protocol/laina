use crate::storage_types::{
    Loan, LoansDataKey, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD,
};
use soroban_sdk::{Address, Env};

pub fn init_loan(e: &Env, addr: Address, loan: Loan) {
    write_positions(e, addr, loan);
}

fn write_positions(e: &Env, addr: Address, loan: Loan) {
    let key = LoansDataKey::Loan(addr);

    e.storage().persistent().set(&key, &loan);

    e.storage()
        .persistent()
        .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}

pub fn read_positions(e: &Env, addr: Address) -> Option<Loan> {
    let key = LoansDataKey::Loan(addr);

    let value: Option<Loan> = e.storage().persistent().get(&key)?;

    value
}
