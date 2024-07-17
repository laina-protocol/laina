#![allow(unused)]
use soroban_sdk::{xdr::ToXdr, Address, Bytes, BytesN, Env};

soroban_sdk::contractimport!(file = "../../target/wasm32-unknown-unknown/release/token.wasm");

pub fn create_contract(e: &Env, token_wasm_hash: BytesN<32>, token: &Address) -> Address {
    let mut salt = Bytes::new(e);
    salt.append(&token.to_xdr(e));
    let salt = e.crypto().sha256(&salt);
    e.deployer()
        .with_current_contract(salt)
        .deploy(token_wasm_hash)
}
