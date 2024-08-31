use crate::oracle::{self, Asset};
use crate::positions;
use crate::storage_types::{LoansDataKey, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD};

use soroban_sdk::{
    contract, contractimpl, vec, Address, Env, IntoVal, Map, String, Symbol, TryFromVal, Val, Vec,
};

mod loan_pool {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/loan_pool.wasm"
    );
}

// This is the real address of the Reflector Oracle in testnet.
// We use the same adress to mock it for testing.
const REFLECTOR_ADDRESS: &str = "CBKZFI26PDCZUJ5HYYKVB5BWCNYUSNA5LVL4R2JTRVSOB4XEP7Y34OPN";

#[allow(dead_code)]
pub trait LoansTrait {
    fn initialize(
        e: Env,
        user: Address,
        borrowed: i128,
        borrowed_from: Address,
        collateral: i128,
        collateral_from: Address,
    );
    fn add_interest(e: Env);
    fn calculate_health_factor(
        e: &Env,
        token_ticker: Symbol,
        token_amount: i128,
        token_collateral_ticker: Symbol,
        token_collateral_amount: i128,
    ) -> i128;
}

#[allow(dead_code)]
#[contract]
struct LoansContract;

#[contractimpl]
impl LoansTrait for LoansContract {
    fn initialize(
        e: Env,
        user: Address,
        borrowed: i128,
        borrowed_from: Address,
        collateral: i128,
        collateral_from: Address,
    ) {
        user.require_auth();

        let token_ticker: Symbol = Symbol::new(&e, "USDC"); // temporary
        let collateral_ticker: Symbol = Symbol::new(&e, "XLM"); // temporary
        let health_factor: i128 = Self::calculate_health_factor(
            &e,
            token_ticker,
            borrowed,
            collateral_ticker,
            collateral,
        );

        // Health factor has to be over 1.2 for the loan to be initialized.
        // Health factor is defined as so: 1.0 = 10000000_i128
        const HEALTH_FACTOR_THRESHOLD: i128 = 12000000;
        assert!(
            health_factor > HEALTH_FACTOR_THRESHOLD,
            "Health factor must be over {HEALTH_FACTOR_THRESHOLD} to create a new loan!"
        );

        // Deposit collateral
        let collateral_pool_client = loan_pool::Client::new(&e, &collateral_from);
        let deposited_collateral = collateral_pool_client.deposit_collateral(&user, &collateral);

        // Borrow the funds
        let borrow_pool_client = loan_pool::Client::new(&e, &borrowed_from);
        let borrowed_funds = borrow_pool_client.borrow(&user, &borrowed);

        // FIXME: Currently one can call initialize multiple times to change same addresses loan
        positions::init_loan(
            &e,
            user.clone(),
            borrowed_funds,
            borrowed_from,
            deposited_collateral,
            collateral_from,
            health_factor,
        );

        // Update the list of addresses with loans
        let mut addresses: Vec<Address> = e
            .storage()
            .persistent()
            .get(&Symbol::new(&e, "Addresses"))
            .unwrap_or(vec![&e]);

        if !addresses.contains(&user) {
            addresses.push_back(user);
        }
        e.storage()
            .persistent()
            .set(&Symbol::new(&e, "Addresses"), &addresses);
    }

    fn add_interest(e: Env) {
        /*
        We calculate interest for ledgers_between from a given APY approximation simply by dividing the rate r with ledgers in a year
        and multiplying it with ledgers_between. This would result in slightly different total yearly interest, e.g. 12% -> 12.7% total.
        Perfect calculations are impossible in real world time as we must use ledgers as our time and ledger times vary between 5-6s.
        */
        // TODO: we must store the init ledger for loans as loans started on different times would pay the same amount of interest on the given time.

        let current_ledger = e.ledger().sequence();

        let key: LoansDataKey = LoansDataKey::LastUpdated;
        let previous_ledger_val: Val = e
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(current_ledger.into_val(&e)); // If there is no previous ledger, use current.
        let previous_ledger: u32 =
            u32::try_from_val(&e, &previous_ledger_val).expect("Failed to convert Val to u32");

        let _ledgers_since_update: u32 = current_ledger - previous_ledger; // Currently unused but is a placeholder for interest calculations. Now time is handled.

        // Update current ledger as the new 'last time'

        // Iterate over loans and add interest to capital borrowed.
        // In the same iteration add the amount to the liabilities of the lending pool.
        // First, lets retrieve the list of addresses with loans
        let addresses: Vec<Address> = e
            .storage()
            .persistent()
            .get(&Symbol::new(&e, "Addresses"))
            .unwrap();
        for user in addresses.iter() {
            let key = (Symbol::new(&e, "Loan"), user.clone());

            let loan: Val = e
                .storage()
                .persistent()
                .get::<(Symbol, Address), Val>(&key)
                .unwrap();

            let mut loan_map: Map<Symbol, Val> =
                Map::try_from_val(&e, &loan).expect("Failed to convert Val to Map");

            let borrowed: Val = loan_map.get(Symbol::new(&e, "borrowed")).unwrap();
            let borrowed_as_int: i128 =
                i128::try_from_val(&e, &borrowed).expect("Failed to convert Val to i128");

            // FIXME: the calculation doesn't work, perhaps because of the change in types. OR it could be that the value is not retrieved properly
            let interest_rate: i128 = 12000;
            let interest_amount: i128 = borrowed_as_int * interest_rate;
            let new_borrowed: i128 = borrowed_as_int + interest_amount;
            // Insert the new value to the loan_map
            loan_map.set(Symbol::new(&e, "borrowed"), new_borrowed.into_val(&e));
            // Transform the Map back to Val
            let new_loan: Val = loan_map.into_val(&e);
            // Set it to storage
            e.storage().persistent().set(&key, &new_loan);
            e.storage().persistent().extend_ttl(
                &key,
                POSITIONS_LIFETIME_THRESHOLD,
                POSITIONS_BUMP_AMOUNT,
            );
            // TODO: this should also invoke the pools and update the amounts lended to liabilities.
        }

        e.storage().persistent().set(&key, &current_ledger);
    }

    fn calculate_health_factor(
        e: &Env,
        token_ticker: Symbol,
        token_amount: i128,
        token_collateral_ticker: Symbol,
        token_collateral_amount: i128,
    ) -> i128 {
        let reflector_address = Address::from_string(&String::from_str(e, REFLECTOR_ADDRESS));
        let reflector_contract = oracle::Client::new(e, &reflector_address);

        // get the price and calculate the value of the collateral
        let collateral_asset = Asset::Other(token_collateral_ticker);

        let collateral_asset_price = reflector_contract.lastprice(&collateral_asset).unwrap();
        let collateral_value = collateral_asset_price.price * token_collateral_amount;

        // get the price and calculate the value of the borrowed asset
        let borrowed_asset = Asset::Other(token_ticker);
        let asset_price = reflector_contract.lastprice(&borrowed_asset).unwrap();
        let borrowed_value = asset_price.price * token_amount;

        const DECIMAL_TO_INT_MULTIPLIER: i128 = 10000000;
        collateral_value * DECIMAL_TO_INT_MULTIPLIER / borrowed_value
    }
}

#[cfg(test)]
#[allow(dead_code, unused_imports)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        token::{Client as TokenClient, StellarAssetClient},
        Env, TryIntoVal,
    };

    #[test]
    fn create_loan() {
        // ARRANGE
        let e = Env::default();
        e.mock_all_auths_allowing_non_root_auth();

        let admin = Address::generate(&e);
        let loan_token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let loan_asset = StellarAssetClient::new(&e, &loan_token_contract_id);
        let loan_token = TokenClient::new(&e, &loan_token_contract_id);
        loan_asset.mint(&admin, &1000);

        let admin2 = Address::generate(&e);
        let collateral_token_contract_id = e.register_stellar_asset_contract(admin2.clone());
        let collateral_asset = StellarAssetClient::new(&e, &collateral_token_contract_id);
        let collateral_token = TokenClient::new(&e, &collateral_token_contract_id);

        // Register mock Reflector contract.
        let reflector_addr = Address::from_string(&String::from_str(&e, REFLECTOR_ADDRESS));
        e.register_contract_wasm(&reflector_addr, oracle::WASM);

        // Mint the user some coins
        let user = Address::generate(&e);
        collateral_asset.mint(&user, &1000);

        assert_eq!(collateral_token.balance(&user), 1000);

        // Set up a loan pool with funds for borrowing.
        let loan_pool_id = e.register_contract_wasm(None, loan_pool::WASM);
        let loan_pool_client = loan_pool::Client::new(&e, &loan_pool_id);

        // Set up a loan_pool for the collaterals.
        let collateral_pool_id = e.register_contract_wasm(None, loan_pool::WASM);
        let collateral_pool_client = loan_pool::Client::new(&e, &collateral_pool_id);

        // Register loan manager contract.
        let contract_id = e.register_contract(None, LoansContract);
        let contract_client = LoansContractClient::new(&e, &contract_id);

        // ACT
        // Initialize the loan pool and deposit some of the admin's funds.
        loan_pool_client.initialize(&loan_token_contract_id);
        loan_pool_client.deposit(&admin, &1000);

        collateral_pool_client.initialize(&collateral_token_contract_id);

        // Create a loan.
        contract_client.initialize(&user, &10, &loan_pool_id, &100, &collateral_pool_id);

        // ASSERT
        assert_eq!(loan_token.balance(&user), 10);
        assert_eq!(collateral_token.balance(&user), 900);
    }
}
