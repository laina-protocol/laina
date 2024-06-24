#![no_std]

mod token;

use soroban_sdk::{contract, contractimpl, contractmeta, Address, Val, ConversionError, Env, TryFromVal, BytesN, IntoVal};
use token::create_contract;

#[derive(Clone, Copy)]
#[repr(u32)]
pub enum DataKey {
    Token = 0,
    TokenShare = 1,
    TotalShares = 3,
}

impl TryFromVal<Env, DataKey> for Val {
    type Error = ConversionError;

    fn try_from_val(_env: &Env, v: &DataKey) -> Result<Self, Self::Error> {
        Ok((*v as u32).into())
    }
}

fn get_token(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::Token).unwrap()
}

fn get_token_share(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::TokenShare).unwrap()
}

fn get_total_shares(e: &Env) -> i128 {
    e.storage().instance().get(&DataKey::TotalShares).unwrap()
}

fn get_balance(e: &Env, contract: Address) -> i128 {
    token::Client::new(e, &contract).balance(&e.current_contract_address())
}

fn get_balance_a(e: &Env) -> i128 {
    get_balance(e, get_token(e))
}

fn get_balance_shares(e: &Env) -> i128 {
    get_balance(e, get_token_share(e))
}

fn put_token(e: &Env, contract: Address) {
    e.storage().instance().set(&DataKey::Token, &contract);
}

fn put_token_share(e: &Env, contract: Address) {
    e.storage().instance().set(&DataKey::TokenShare, &contract);
}

fn put_total_shares(e: &Env, amount: i128) {
    e.storage().instance().set(&DataKey::TotalShares, &amount)
}

fn burn_shares(e: &Env, amount: i128) {
    let total = get_total_shares(e);
    let share_contract = get_token_share(e);

    token::Client::new(e, &share_contract).burn(&e.current_contract_address(), &amount);
    put_total_shares(e, total - amount);
}

fn mint_shares(e: &Env, to: Address, amount: i128) {
    let total = get_total_shares(e);
    let share_contract_id = get_token_share(e);

    token::Client::new(e, &share_contract_id).mint(&to, &amount);

    put_total_shares(e, total + amount);
}

fn transfer_a(e: &Env, to: Address, amount: i128) {
    transfer(e, get_token(e), to, amount);
}

fn transfer(e: &Env, token: Address, to: Address, amount: i128) {
    token::Client::new(e, &token).transfer(&e.current_contract_address(), &to, &amount);
}

//#[allow(non_upper_case_globals)]
// Metadata that is added on to the WASM custom section
contractmeta!(
    key = "Description",
    val = "Lending pool with variable interest rate."
);

pub trait LoanPoolTrait {
    // Sets the token contract address for the pool
    fn initialize(e: Env, token_wasm_hash: BytesN<32>, token: Address);

    // Returns the token contract address for the pool share token
    fn share_id(e: Env) -> Address;

    // Deposits token. Also, mints pool shares for the "user" Identifier.
    fn deposit(e: Env, user: Address, amount: i128);

    // Transfers share tokens back, burns them and gives corresponding amount of tokens back to user. Returns amount of tokens withdrawn
    fn withdraw(e: Env, user: Address, share_amount: i128) -> (i128, i128);
}

#[contract]
struct LoanPoolContract;

#[contractimpl]
impl LoanPoolTrait for LoanPoolContract {

    fn initialize(e: Env, token_wasm_hash: BytesN<32>, token: Address) {
        let share_contract = create_contract(&e, token_wasm_hash, &token);
        token::Client::new(&e, &share_contract).initialize(
            &e.current_contract_address(), 
            &7u32, 
            &"XLM Pool Share Token".into_val(&e), 
            &"pXLM".into_val(&e),
        );

        put_token(&e, token);
        put_token_share(&e, share_contract.try_into().unwrap());
        put_total_shares(&e, 0);
    }

    fn share_id(e: Env) -> Address {
        get_token_share(&e)
    }

    fn deposit(e: Env, user: Address, amount: i128 ) {
        user.require_auth(); // Depositor needs to authorize the deposit
        assert!(amount > 0, "Amount must be positive!");

        let client = token::Client::new(&e, &get_token(&e));
        client.transfer(&user, &e.current_contract_address(), &amount);

        mint_shares(&e, user, amount);
    }

    fn withdraw(e: Env, user: Address, amount: i128) -> (i128, i128) {
        user.require_auth();
        
        // First transfer the pool shares that need to be redeemed
        let share_token_client = token::Client::new(&e, &get_token_share(&e));
        share_token_client.transfer(&user, &e.current_contract_address(), &amount);

        let balance= get_balance_a(&e);
        let balance_shares = get_balance_shares(&e);

        let total_shares = get_total_shares(&e);

        // Now calculate the withdraw amounts
        let out = (balance * balance_shares) / total_shares;

        burn_shares(&e, balance_shares);
        transfer_a(&e, user.clone(), out);

        (out, out)
    }
}

mod test;