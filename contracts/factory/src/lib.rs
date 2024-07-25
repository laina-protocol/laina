#![no_std]

use soroban_sdk::{contract, contractimpl, vec, Address, BytesN, Env, Symbol, TryFromVal, Val, Vec};

#[contract]
pub struct Deployer;

#[contractimpl]
impl Deployer {
    /// Deploy the contract Wasm and after deployment invoke the init function
    /// of the contract with the given arguments.
    ///
    /// This has to be authorized by `deployer` (unless the `Deployer` instance
    /// itself is used as deployer). This way the whole operation is atomic
    /// and it's not possible to frontrun the contract initialization.
    ///
    /// Returns the contract address and result of the init function.
    pub fn deploy(
        env: Env,
        wasm_hash: BytesN<32>,
        salt: BytesN<32>,
        init_fn: Symbol,
        token_wasm_hash: BytesN<32>,
        token_contract: Address,
    ) -> Address {
        //convert the arguments to Val
        let token_wasm_hash_raw = Val::try_from_val(&env, &token_wasm_hash).unwrap();
        let token_contract_raw = Val::try_from_val(&env, &token_contract).unwrap();

        // Construct the init_args
        let init_args = vec![&env, token_wasm_hash_raw, token_contract_raw];

        // Deploy the contract using the uploaded Wasm with given hash.
        let deployed_address = env
            .deployer()
            .with_current_contract(salt)
            .deploy(wasm_hash);


        // Invoke the init function with the given arguments.
        let _res: Val = env.invoke_contract(&deployed_address, &init_fn, init_args);
        // Return the contract ID of the deployed contract
        deployed_address
    }
}
