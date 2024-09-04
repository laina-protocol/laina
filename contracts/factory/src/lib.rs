#![no_std]

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, Symbol};

mod loan_pool {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/loan_pool.wasm"
    );
}

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
        token_address: Address,
        ticker: Symbol,
        liquidation_threshold: i128,
    ) -> Address {
        // Deploy the contract using the uploaded Wasm with given hash.
        let deployed_address: Address =
            env.deployer().with_current_contract(salt).deploy(wasm_hash);

        let pool_client = loan_pool::Client::new(&env, &deployed_address);

        let currency = loan_pool::Currency {
            token_address,
            ticker,
        };
        pool_client.initialize(&currency, &liquidation_threshold);

        // Return the contract ID of the deployed contract
        deployed_address
    }
}
