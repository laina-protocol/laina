use crate::oracle::{self, Asset};
use crate::positions;
use crate::storage_types::{LoansDataKey, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD};

use soroban_sdk::{
    contract, contractimpl, vec, Address, Env, IntoVal, Map, String, Symbol, TryFromVal, Val, Vec,
};

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
        reflector_contract_id: Address,
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

        let reflector_id: String = String::from_str(
            &e,
            "CBKZFI26PDCZUJ5HYYKVB5BWCNYUSNA5LVL4R2JTRVSOB4XEP7Y34OPN",
        );
        let token_ticker: Symbol = Symbol::new(&e, "USDC"); // temporary
        let collateral_ticker: Symbol = Symbol::new(&e, "XLM"); // temporary
        let health_factor: i128 = Self::calculate_health_factor(
            &e,
            Address::from_string(&reflector_id),
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

        let user_val: Val = Val::try_from_val(&e, &user).unwrap();
        let collateral_val: Val = Val::try_from_val(&e, &collateral).unwrap();
        let args: soroban_sdk::Vec<Val> = vec![&e, user_val, collateral_val];
        // Function to be called
        let func: Symbol = Symbol::new(&e, "deposit_collateral");
        // Deposit collateral
        let deposited_collateral: i128 = e.invoke_contract(&collateral_from, &func, args);

        // Create args for borrow
        let borrowed_val: Val = Val::try_from_val(&e, &borrowed).unwrap();
        let args_borrow: soroban_sdk::Vec<Val> = vec![&e, user_val, borrowed_val];
        // Function to be called
        let func2: Symbol = Symbol::new(&e, "borrow");
        // Borrow the funds
        let borrowed_funds: i128 = e.invoke_contract(&borrowed_from, &func2, args_borrow);

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
        reflector_contract_id: Address,
        token_ticker: Symbol,
        token_amount: i128,
        token_collateral_ticker: Symbol,
        token_collateral_amount: i128,
    ) -> i128 {
        const DECIMAL_TO_INT_MULTIPLIER: i128 = 10000000;
        let reflector_contract: oracle::Client = oracle::Client::new(e, &reflector_contract_id);

        // get the price and calculate the value of the collateral
        let collateral_asset: Asset = Asset::Other(token_collateral_ticker);

        let collateral_asset_price: oracle::PriceData =
            reflector_contract.lastprice(&collateral_asset).unwrap();
        let collateral_value: i128 = collateral_asset_price.price * token_collateral_amount;

        // get the price and calculate the value of the borrowed asset
        let borrowed_asset: Asset = Asset::Other(token_ticker);
        let asset_price: oracle::PriceData = reflector_contract.lastprice(&borrowed_asset).unwrap();
        let borrowed_value: i128 = asset_price.price * token_amount;

        let health_ratio: i128 = collateral_value * DECIMAL_TO_INT_MULTIPLIER / borrowed_value;

        health_ratio
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

    #[derive(Clone, Debug, Eq, PartialEq)]
    pub struct PriceData {
        // The price in contracts' base asset and decimals.
        pub price: i128,
        // The timestamp of the price.
        pub timestamp: u64,
    }

    impl TryFromVal<Env, Val> for PriceData {
        type Error = soroban_sdk::Error;

        fn try_from_val(env: &Env, val: &Val) -> Result<Self, Self::Error> {
            // Assuming `val` is a tuple with two elements: (price, timestamp)
            let tuple: (i128, u64) = val.try_into_val(env)?;
            Ok(PriceData {
                price: tuple.0,
                timestamp: tuple.1,
            })
        }
    }

    impl TryIntoVal<Env, Val> for PriceData {
        type Error = soroban_sdk::Error;

        fn try_into_val(&self, env: &Env) -> Result<Val, Self::Error> {
            // Convert `PriceData` into a tuple and then into `Val`
            let tuple: (i128, u64) = (self.price, self.timestamp);
            tuple.try_into_val(env)
        }
    }

    #[contract]
    pub struct MockBorrowContract;

    #[contractimpl]
    impl MockBorrowContract {
        pub fn borrow(_e: Env, _user: Address, _amount: i128) {}
    }

    #[contract]
    pub struct MockCollateralContract;

    #[contractimpl]
    impl MockCollateralContract {
        pub fn deposit_collateral(_e: Env, _user: Address, _collateral_amount: i128) {}
    }

    #[contract]
    pub struct MockValueContract;

    #[contractimpl]
    impl MockValueContract {
        pub fn lastprice(ticker: Asset) -> Option<PriceData> {
            let _ticker_lended = ticker;
            let price_data = PriceData {
                price: 1,
                timestamp: 1,
            };
            Some(price_data)
        }
    }

    #[test]
    fn create_loan() {
        let e: Env = Env::default();
        e.mock_all_auths();
        /*
        let admin: Address = Address::generate(&e);
        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let stellar_asset = StellarAssetClient::new(&e, &token_contract_id);
        let token = TokenClient::new(&e, &token_contract_id);

        let admin2: Address = Address::generate(&e);
        let token_contract_id2 = e.register_stellar_asset_contract(admin2.clone());
        let stellar_asset2 = StellarAssetClient::new(&e, &token_contract_id2);
        let collateral_token = TokenClient::new(&e, &token_contract_id);

        let user: Address = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        stellar_asset2.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);
        assert_eq!(collateral_token.balance(&user), 1000);

        let contract_id: Address = e.register_contract(None, LoansContract);
        let contract_client: LoansContractClient = LoansContractClient::new(&e, &contract_id);
        let mock_borrow_contract_id = e.register_contract(None, MockBorrowContract);
        let mock_collateral_contract_id = e.register_contract(None, MockCollateralContract);
        let reflector_id: String = String::from_str(&e, "CBKZFI26PDCZUJ5HYYKVB5BWCNYUSNA5LVL4R2JTRVSOB4XEP7Y34OPN");
        let reflector_address: Address = Address::from_string(&reflector_id);
        e.register_contract(&reflector_address, MockValueContract);

        contract_client.initialize(&user, &10_i128, &mock_borrow_contract_id, &1000_i128, &mock_collateral_contract_id);
        */
        //TODO: study how to create loan_pools for testing as one can not initialize without it. for now this should pass but it doesn't test anything
    }
}
