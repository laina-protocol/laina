use crate::positions;
use crate::storage_types::{
    self, extend_instance, PoolDataKey, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD,
};

use soroban_sdk::{
    contract, contractimpl, contractmeta, Address, BytesN, ConversionError, Env, IntoVal, String,
    TryFromVal, Val,
};

// Metadata that is added on to the WASM custom section
contractmeta!(
    key = "Desc",
    val = "Lending pool with variable interest rate."
);

pub trait LoanPoolTrait {
    // Sets the token contract address for the pool
    fn initialize(e: Env, token: Address);

    // Returns the token contract address for the pool share token
    fn share_id(e: Env) -> Address;

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
        put_token(&e, token);
        put_total_shares(&e, 0);
    }

    fn share_id(e: Env) -> Address {
        // Extend instance storage rent
        extend_instance(e.clone());

        get_token_share(&e)
    }

    fn deposit(e: Env, user: Address, amount: i128) {
        user.require_auth(); // Depositor needs to authorize the deposit
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        extend_instance(e.clone());

        transfer(&e, &user, &e.current_contract_address(), &amount);

        // Increase users position in pool as they deposit
        // as this is deposit amount is added to receivables and
        // liabilities & collateral stays intact
        let liabilities: i128 = 0; // temp test param
        let collateral: i128 = 0; // temp test param
        positions::increase_positions(&e, user.clone(), amount.clone(), liabilities, collateral);

        mint_shares(&e, user, amount);
    }

    fn withdraw(e: Env, user: Address, amount: i128) -> (i128, i128) {
        user.require_auth();

        // Extend instance storage rent
        extend_instance(e.clone());

        // First transfer the pool shares that need to be redeemed
        let share_token_client = token::Client::new(&e, &get_token_share(&e));
        share_token_client.transfer(&user, &e.current_contract_address(), &amount);

        let balance = get_balance_a(&e);
        let balance_shares = get_balance_shares(&e);

        let total_shares = get_total_shares(&e);

        // Now calculate the withdraw amounts
        let out = (balance * balance_shares) / total_shares;

        // Decrease users position in pool as they withdraw
        // TEMP positions::decrease_positions(&e, user.clone(), amount.clone());

        burn_shares(&e, balance_shares);
        transfer_a(&e, user.clone(), out);

        (out, total_shares)
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

        let balance = get_balance_a(&e);
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

        transfer_a(&e, user.clone(), amount);

        amount
    }

    fn deposit_collateral(e: Env, user: Address, amount: i128) -> i128 {
        user.require_auth();
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        extend_instance(e.clone());

        let client = token::Client::new(&e, &get_token(&e));
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

        let balance = get_total_shares(&e);
        balance
    }
}

#[derive(Clone, Copy)]
#[repr(u32)]
pub enum DataKey {
    Token = 0,
    TokenShare = 1,
    TotalShares = 2,
}

impl TryFromVal<Env, DataKey> for Val {
    type Error = ConversionError;

    fn try_from_val(_env: &Env, v: &DataKey) -> Result<Self, Self::Error> {
        Ok((*v as u32).into())
    }
}

fn get_token(e: &Env) -> Address {
    // Extend instance storage rent
    extend_instance(e.clone());

    e.storage().instance().get(&DataKey::Token).unwrap()
}

fn get_token_share(e: &Env) -> Address {
    // Extend instance storage rent
    extend_instance(e.clone());

    e.storage().instance().get(&DataKey::TokenShare).unwrap()
}

fn get_total_shares(e: &Env) -> i128 {
    // Extend instance storage rent
    extend_instance(e.clone());

    e.storage().instance().get(&DataKey::TotalShares).unwrap()
}

fn get_balance(e: &Env, contract: Address) -> i128 {
    // Extend instance storage rent
    extend_instance(e.clone());

    token::Client::new(e, &contract).balance(&e.current_contract_address())
}

fn get_balance_a(e: &Env) -> i128 {
    // Extend instance storage rent
    extend_instance(e.clone());

    get_balance(e, get_token(e))
}

fn get_balance_shares(e: &Env) -> i128 {
    // Extend instance storage rent
    extend_instance(e.clone());

    get_balance(e, get_token_share(e))
}

fn put_token(e: &Env, contract: Address) {
    // Extend instance storage rent
    extend_instance(e.clone());

    e.storage().instance().set(&DataKey::Token, &contract);
}

fn put_token_share(e: &Env, contract: Address) {
    // Extend instance storage rent
    extend_instance(e.clone());

    e.storage().instance().set(&DataKey::TokenShare, &contract);
}

fn put_total_shares(e: &Env, amount: i128) {
    // Extend instance storage rent
    extend_instance(e.clone());

    e.storage().instance().set(&DataKey::TotalShares, &amount)
}

fn burn_shares(e: &Env, amount: i128) {
    // Extend instance storage rent
    extend_instance(e.clone());

    let total = get_total_shares(e);
    let share_contract = get_token_share(e);

    token::Client::new(e, &share_contract).burn(&e.current_contract_address(), &amount);
    put_total_shares(e, total - amount);
}

fn mint_shares(e: &Env, to: Address, amount: i128) {
    // Extend instance storage rent
    extend_instance(e.clone());

    let total = get_total_shares(e);
    let share_contract_id = get_token_share(e);

    token::Client::new(e, &share_contract_id).mint(&to, &amount);

    put_total_shares(e, total + amount);
}

fn transfer_a(e: &Env, to: Address, amount: i128) {
    // Extend instance storage rent
    extend_instance(e.clone());

    transfer(e, get_token(e), to, amount);
}

fn transfer(e: &Env, token: Address, to: Address, amount: i128) {
    // Extend instance storage rent
    extend_instance(e.clone());

    token::Client::new(e, &token).transfer(&e.current_contract_address(), &to, &amount);
}
