use crate::storage_types::{self, extend_instance, LoansDataKey, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD};
use crate::positions;

use soroban_sdk::{
    contract, contractimpl, contractmeta, Address, BytesN, ConversionError, Env, IntoVal, TryFromVal, Val
};

pub trait LoansTrait {
    // Initialize new loan
    fn initialize(e: Env, user: Address, borrowed: i128, borrowed_from: Address, collateral: i128, collateral_from: Address);
}

#[contract]
struct LoansContract;

#[contractimpl]
impl LoansTrait for LoansContract {
    fn initialize(e: Env, user: Address, borrowed: i128, borrowed_from: Address, collateral: i128, collateral_from: Address) {
        positions::init_loan(&e, user, borrowed, borrowed_from, collateral, collateral_from);
    }
}