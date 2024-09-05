use soroban_sdk::{Address, Env};

mod loan_pool {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/loan_pool.wasm"
    );
}
#[allow(dead_code)]
pub const BASE_INTEREST_RATE: i128 = 200_000; // TODO: This should be based on what pool it is. Current 2 %.

#[allow(dead_code, unused_variables)]

pub fn get_interest(e: Env, pool: Address) -> i128 {
    let pool_client = loan_pool::Client::new(&e, &pool);
    //let available = pool_client.get_available_balance
    //let total = pool_client.get_total_balance

    //let borrowed_rate = (available - total) * decimal / total
    BASE_INTEREST_RATE
}
