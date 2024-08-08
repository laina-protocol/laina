use crate::storage_types::{self, extend_instance, LoansDataKey, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD};
use crate::positions;

use soroban_sdk::{
    contract, contractimpl, vec, Address, BytesN, ConversionError, Env, IntoVal, Symbol, TryFromVal, Val
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
        // Require user authorization
        user.require_auth();

        // First thing should be to check if the collateral is enough => health factor large enough
        // Create args for collateral deposit
        let user_val: Val = Val::try_from_val(&e, &user).unwrap();
        let collateral_val: Val = Val::try_from_val(&e, &collateral).unwrap();
        let args: soroban_sdk::Vec<Val> = vec![&e, user_val, collateral_val];
        // Function to be called
        let func: Symbol = Symbol::new(&e, "deposit_collateral");
        // Deposit collateral
        let deposited_collateral: i128 = e.invoke_contract(&collateral_from, &func, args);

        // Create args for borrow
        let borrowed_val: Val = Val::try_from_val(&e, &borrowed).unwrap();
        let args_borrow: soroban_sdk::Vec<Val> = vec![&e, user_val.clone(), borrowed_val];
        // Function to be called
        let func2: Symbol = Symbol::new(&e, "borrow");
        // Borrow the funds
        let borrowed_funds: i128 = e.invoke_contract(&borrowed_from, &func2, args_borrow);

        // FIXME: Currently one can call initialize multiple times to change same addresses loan
        positions::init_loan(&e, user, borrowed_funds, borrowed_from, deposited_collateral, collateral_from);
    }
}