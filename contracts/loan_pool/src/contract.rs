use crate::pool;
use crate::positions;
use crate::storage_types::extend_instance;

use soroban_sdk::{
    contract, contractimpl, contractmeta, token, Address, Env, Map, String, Symbol, TryFromVal,
};

// Metadata that is added on to the WASM custom section
contractmeta!(
    key = "Desc",
    val = "Lending pool with variable interest rate."
);

pub trait LoanPoolTrait {
    // Sets the token contract address for the pool
    fn initialize(e: Env, token: Address);

    // Deposits token. Also, mints pool shares for the "user" Identifier.
    fn deposit(e: Env, user: Address, amount: i128);

    // Transfers share tokens back, burns them and gives corresponding amount of tokens back to user. Returns amount of tokens withdrawn
    fn withdraw(e: Env, user: Address, share_amount: i128) -> (i128, i128);

    // Borrow tokens from the pool
    fn borrow(e: Env, user: Address, amount: i128) -> i128;

    // Deposit tokens to the pool to be used as collateral
    fn deposit_collateral(e: Env, user: Address, amount: i128) -> i128;

    // Get contract data entries
    fn get_contract_balance(e: Env) -> i128;
}

#[contract]
struct LoanPoolContract;

#[contractimpl]
impl LoanPoolTrait for LoanPoolContract {
    fn initialize(e: Env, token: Address) {
        pool::write_token(&e, token);
        pool::write_total_shares(&e, 0);
    }

    fn deposit(e: Env, user: Address, amount: i128) {
        user.require_auth(); // Depositor needs to authorize the deposit
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        extend_instance(e.clone());

        let client = token::Client::new(&e, &pool::read_token(&e));
        client.transfer(&user, &e.current_contract_address(), &amount);

        // Increase users position in pool as they deposit
        // as this is deposit amount is added to receivables and
        // liabilities & collateral stays intact
        let liabilities: i128 = 0; // temp test param
        let collateral: i128 = 0; // temp test param
        positions::increase_positions(&e, user.clone(), amount.clone(), liabilities, collateral);
    }

    fn withdraw(e: Env, user: Address, amount: i128) -> (i128, i128) {
        user.require_auth();

        // Extend instance storage rent
        extend_instance(e.clone());

        let positions_val = positions::read_positions(&e, user.clone());
        let positions_map: Map<Symbol, i128> = Map::try_from_val(&e, &positions_val).unwrap();
        // Get current positions from the map
        let balance = positions_map.get_unchecked(Symbol::new(&e, "receivables"));

        let balance_shares = pool::read_total_shares(&e);

        let total_balance = pool::read_total_balance(&e);

        // Now calculate the withdraw amounts
        let out = (balance * balance_shares) / total_balance;

        // Decrease users position in pool as they withdraw
        // TEMP positions::decrease_positions(&e, user.clone(), amount.clone());

        let client = token::Client::new(&e, &pool::read_token(&e));
        client.transfer(&e.current_contract_address(), &user, &amount);

        (out, total_balance)
    }

    fn borrow(e: Env, user: Address, amount: i128) -> i128 {
        /*
        Borrow should only be callable from the loans contract. This is as the loans contract will
        include the logic and checks that the borrowing can be actually done. Therefore we need to
        include a check that the caller is the loans contract.
        */
        let address = String::from_str(
            &e,
            "CCR7ARWZN4WODMEWVTRCMPPJJQKE2MBKUPJBSYWCDEOT3OLBPAPEGLPH",
        );
        let contract: Address = Address::from_string(&address);
        contract.require_auth();
        user.require_auth();

        // Extend instance storage rent
        extend_instance(e.clone());

        let balance = pool::read_available_balance(&e);
        assert!(
            amount < balance,
            "Borrowed amount has to be less than available balance!"
        ); // Check that there is enough available balance

        // Increase users position in pool as they deposit
        // as this is debt amount is added to liabilities and
        // collateral & receivables stays intact
        let collateral: i128 = 0; // temp test param
        let receivables: i128 = 0; // temp test param
        positions::increase_positions(&e, user.clone(), receivables, amount.clone(), collateral);

        let client = token::Client::new(&e, &pool::read_token(&e));
        client.transfer(&e.current_contract_address(), &user, &amount);

        amount
    }

    fn deposit_collateral(e: Env, user: Address, amount: i128) -> i128 {
        user.require_auth();
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        extend_instance(e.clone());

        let client = token::Client::new(&e, &pool::read_token(&e));
        client.transfer(&user, &e.current_contract_address(), &amount);

        // Increase users position in pool as they deposit
        // as this is collateral amount is added to collateral and
        // liabilities & receivables stays intact
        let liabilities: i128 = 0; // temp test param
        let receivables: i128 = 0; // temp test param
        positions::increase_positions(&e, user.clone(), receivables, liabilities, amount.clone());

        amount
    }

    fn get_contract_balance(e: Env) -> i128 {
        // Extend instance storage rent
        extend_instance(e.clone());

        let balance = pool::read_total_balance(&e);
        balance
    }
}