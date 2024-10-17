use soroban_sdk::{Address, Env};

mod loan_pool {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/loan_pool.wasm"
    );
}
#[allow(dead_code)]
// These are mockup numbers that should be set to each pool based on the token.
pub const BASE_INTEREST_RATE: i128 = 200_000; // 2%
pub const INTEREST_RATE_AT_PANIC: i128 = 1_000_000; // 10%
pub const MAX_INTEREST_RATE: i128 = 3_000_000; // 30%
pub const PANIC_BASE_RATE: i128 = -17_000_000;

#[allow(dead_code, unused_variables)]

pub fn get_interest(e: Env, pool: Address) -> i128 {
    const PANIC_RATES_THRESHOLD: i128 = 90_000_000;
    let pool_client = loan_pool::Client::new(&e, &pool);
    let available = pool_client.get_available_balance();
    let total = pool_client.get_contract_balance();

    let slope_before_panic =
        (INTEREST_RATE_AT_PANIC - BASE_INTEREST_RATE) * 10_000_000 / PANIC_RATES_THRESHOLD;
    let slope_after_panic = (MAX_INTEREST_RATE - INTEREST_RATE_AT_PANIC) * 10_000_000
        / (100_000_000 - PANIC_RATES_THRESHOLD);

    let ratio_of_balances = ((total - available) * 100_000_000) / total; // correct

    if ratio_of_balances < PANIC_RATES_THRESHOLD {
        (slope_before_panic * ratio_of_balances) / 10_000_000 + BASE_INTEREST_RATE
    } else {
        (slope_after_panic * ratio_of_balances) / 10_000_000 + PANIC_BASE_RATE
    }
}
