#![no_std]

use soroban_sdk::{contract, contractimpl, Address, ConversionError, Env, TryFromVal, Val};

mod loan_pool {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/loan_pool.wasm"
    );
}

#[derive(Clone, Copy)]
#[repr(u32)]
pub enum DataKey {
    TokenBorrowed = 0,
    TokenCollateral = 1,
    BorrowedAmount = 3,
    CollateralAmount = 4,
    // Owner = 5,
}

impl TryFromVal<Env, DataKey> for Val {
    type Error = ConversionError;

    fn try_from_val(_env: &Env, v: &DataKey) -> Result<Self, Self::Error> {
        Ok((*v as u32).into())
    }
}

fn get_token_borrowed(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::TokenBorrowed).unwrap()
}

fn get_token_collateral(e: &Env) -> Address {
    e.storage()
        .instance()
        .get(&DataKey::TokenCollateral)
        .unwrap()
}

fn get_borrowed_amount(e: &Env) -> i128 {
    e.storage()
        .instance()
        .get(&DataKey::BorrowedAmount)
        .unwrap()
}

fn get_collateral_amount(e: &Env) -> i128 {
    e.storage()
        .instance()
        .get(&DataKey::CollateralAmount)
        .unwrap()
}

//fn get_owner(e: &Env) -> Address {
//    e.storage().instance().get(&DataKey::Owner).unwrap()
//}

fn set_token_borrowed(e: &Env, contract: Address) {
    e.storage()
        .instance()
        .set(&DataKey::TokenBorrowed, &contract);
}

fn set_token_collateral(e: &Env, contract: Address) {
    e.storage()
        .instance()
        .set(&DataKey::TokenCollateral, &contract);
}

fn set_borrowed_amount(e: &Env, amount: i128) {
    e.storage()
        .instance()
        .set(&DataKey::BorrowedAmount, &amount);
}

fn set_collateral_amount(e: &Env, amount: i128) {
    e.storage()
        .instance()
        .set(&DataKey::CollateralAmount, &amount);
}

//fn set_owner(e: &Env, owner: Address) {
//    e.storage().instance().set(&DataKey::Owner, &owner);
//}

pub trait LoanTrait {
    // Sets all of the needed information to the contract storage and creates the loan.
    fn initialize(
        e: Env,
        pool: Address,
        collateral: Address,
        amount: i128,
        collateral_amount: i128
    );
}

#[contract]
pub struct LoanContract;

#[contractimpl]
impl LoanTrait for LoanContract {
    // TODO: Borrow functionality needs to be built in to the loan_pool and then be cross-contract called from the separate loan contract.
    fn initialize(
        e: Env,
        pool: Address,
        collateral: Address,
        amount: i128,
        collateral_amount: i128
    ) {
        // TODO: Check that collateral amount is large enough to allow initialization.
        // TODO: Currently it is most likely possible to create a loan for someone else. This needs to be fixed with authentication.
        set_token_borrowed(&e, pool);
        set_borrowed_amount(&e, amount);
        set_token_collateral(&e, collateral);
        set_collateral_amount(&e, collateral_amount);
        // set_owner(&e, owner);
    }
}
