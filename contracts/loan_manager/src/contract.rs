use crate::interest::get_interest;
use crate::oracle::{self, Asset};
use crate::positions;
use crate::storage_types::{
    Loan, LoansDataKey, DAY_IN_LEDGERS, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD,
};

use soroban_sdk::{
    contract, contracterror, contractimpl, vec, Address, BytesN, Env, String, Symbol, Vec,
};

mod loan_pool {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/loan_pool.wasm"
    );
}

// This is the real address of the Reflector Oracle in testnet.
// We use the same adress to mock it for testing.
const REFLECTOR_ADDRESS: &str = "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63";

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
}

#[contract]
struct LoanManager;

#[allow(dead_code)]
#[contractimpl]
impl LoanManager {
    /// Set the admin that's allowed to upgrade the wasm.
    pub fn initialize(e: Env, admin: Address) -> Result<(), Error> {
        if e.storage().persistent().has(&LoansDataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        e.storage().persistent().set(&LoansDataKey::Admin, &admin);
        Ok(())
    }

    /// Deploy a loan_pool contract, and initialize it.
    pub fn deploy_pool(
        e: Env,
        wasm_hash: BytesN<32>,
        salt: BytesN<32>,
        token_address: Address,
        ticker: Symbol,
        liquidation_threshold: i128,
    ) -> Address {
        // Deploy the contract using the uploaded Wasm with given hash.
        let deployed_address: Address = e.deployer().with_current_contract(salt).deploy(wasm_hash);

        // Add the new address to storage
        let mut pool_addresses = e
            .storage()
            .persistent()
            .get(&LoansDataKey::PoolAddresses)
            .unwrap_or(vec![&e]);
        pool_addresses.push_back(deployed_address.clone());
        e.storage()
            .persistent()
            .set(&LoansDataKey::PoolAddresses, &pool_addresses);

        let pool_client = loan_pool::Client::new(&e, &deployed_address);

        let currency = loan_pool::Currency {
            token_address,
            ticker,
        };
        pool_client.initialize(
            &e.current_contract_address(),
            &currency,
            &liquidation_threshold,
        );

        // Return the contract ID of the deployed contract
        deployed_address
    }

    /// Upgrade deployed loan pools and the loan manager WASM.
    pub fn upgrade(e: Env, new_manager_wasm_hash: BytesN<32>, new_pool_wasm_hash: BytesN<32>) {
        let admin: Address = e.storage().persistent().get(&LoansDataKey::Admin).unwrap();
        admin.require_auth();

        // Upgrade the loan pools.
        e.storage()
            .persistent()
            .get(&LoansDataKey::PoolAddresses)
            .unwrap_or(vec![&e])
            .iter()
            .for_each(|pool| {
                let pool_client = loan_pool::Client::new(&e, &pool);
                pool_client.upgrade(&new_pool_wasm_hash);
            });

        // Upgrade the loan manager.
        e.deployer()
            .update_current_contract_wasm(new_manager_wasm_hash);
    }

    /// Initialize a new loan
    pub fn create_loan(
        e: Env,
        user: Address,
        borrowed: i128,
        borrowed_from: Address,
        collateral: i128,
        collateral_from: Address,
    ) {
        user.require_auth();

        let collateral_pool_client = loan_pool::Client::new(&e, &collateral_from);
        let borrow_pool_client = loan_pool::Client::new(&e, &borrowed_from);

        let token_currency = borrow_pool_client.get_currency();
        let collateral_currency = collateral_pool_client.get_currency();
        let health_factor: i128 = Self::calculate_health_factor(
            &e,
            token_currency.ticker,
            borrowed,
            collateral_currency.ticker,
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
        let collateral_amount = collateral_pool_client.deposit_collateral(&user, &collateral);

        // Borrow the funds
        let borrowed_amount = borrow_pool_client.borrow(&user, &borrowed);

        let unpaid_interest = 0;

        // FIXME: Currently one can call initialize multiple times to change same addresses loan
        let loan = Loan {
            borrowed_amount,
            borrowed_from,
            collateral_amount,
            collateral_from,
            health_factor,
            unpaid_interest,
        };

        positions::init_loan(&e, user.clone(), loan);

        let key = LoansDataKey::Addresses;

        // Update the list of addresses with loans
        let mut addresses: Vec<Address> = e.storage().persistent().get(&key).unwrap_or(vec![&e]);

        if !addresses.contains(&user) {
            addresses.push_back(user);
        }
        e.storage().persistent().set(&key, &addresses);
        e.storage().persistent().extend_ttl(
            &key,
            POSITIONS_LIFETIME_THRESHOLD,
            POSITIONS_BUMP_AMOUNT,
        );
    }

    pub fn add_interest(e: Env) {
        const DECIMAL: i128 = 10000000;
        /*
        We calculate interest for ledgers_between from a given APY approximation simply by dividing the rate r with ledgers in a year
        and multiplying it with ledgers_between. This would result in slightly different total yearly interest, e.g. 12% -> 12.7% total.
        Perfect calculations are impossible in real world time as we must use ledgers as our time and ledger times vary between 5-6s.
        */
        // TODO: we must store the init ledger for loans as loans started on different times would pay the same amount of interest on the given time.

        let current_ledger = e.ledger().sequence();

        let key: LoansDataKey = LoansDataKey::LastUpdated;
        let previous_ledger: u32 = e.storage().persistent().get(&key).unwrap_or(current_ledger); // If there is no previous ledger, use current.

        let ledgers_since_update: u32 = current_ledger - previous_ledger; // Currently unused but is a placeholder for interest calculations. Now time is handled.
        let ledger_ratio: i128 =
            (i128::from(ledgers_since_update) * DECIMAL) / (i128::from(DAY_IN_LEDGERS * 365));

        // Iterate over loans and add interest to capital borrowed.
        // In the same iteration add the amount to the liabilities of the lending pool.
        // First, lets retrieve the list of addresses with loans
        let mut addresses: Vec<Address> = e
            .storage()
            .persistent()
            .get(&LoansDataKey::Addresses)
            .unwrap();

        for user in addresses.iter() {
            let key = (Symbol::new(&e, "Loan"), user.clone());

            match e
                .storage()
                .persistent()
                .get::<(Symbol, Address), Loan>(&key)
            {
                None => {
                    if let Some(index) = addresses.iter().position(|x| x == user) {
                        addresses.remove(index.try_into().unwrap());
                        continue;
                    } else {
                        panic!("Address not found in Addresses");
                    };
                }
                Some(mut loan) => {
                    let borrowed: i128 = loan.borrowed_amount;

                    if borrowed == 0 {
                        e.storage().persistent().remove(&key);
                        continue;
                    }
                    let interest_rate: i128 = get_interest(e.clone(), loan.borrowed_from.clone());
                    let interest_amount_in_year: i128 = (borrowed * interest_rate) / DECIMAL;
                    let interest_since_update: i128 =
                        (interest_amount_in_year * ledger_ratio) / DECIMAL;
                    let new_borrowed: i128 = borrowed + interest_since_update;
                    // Insert the new value to the loan_map
                    loan.borrowed_amount = new_borrowed;
                    // Get updated health_factor
                    let collateral_pool_client = loan_pool::Client::new(&e, &loan.collateral_from);
                    let borrow_pool_client = loan_pool::Client::new(&e, &loan.borrowed_from);

                    let token_currency = borrow_pool_client.get_currency();
                    let collateral_currency = collateral_pool_client.get_currency();
                    loan.health_factor = Self::calculate_health_factor(
                        &e,
                        token_currency.ticker,
                        new_borrowed,
                        collateral_currency.ticker,
                        loan.collateral_amount,
                    );
                    // It now calls reflector for each address. This is safe but might end up being costly
                    // Set it to storage
                    loan.unpaid_interest += interest_since_update;
                    e.storage().persistent().set(&key, &loan);
                    e.storage().persistent().extend_ttl(
                        &key,
                        POSITIONS_LIFETIME_THRESHOLD,
                        POSITIONS_BUMP_AMOUNT,
                    );
                    // TODO: this should also invoke the pools and update the amounts lended to liabilities.
                    let borrowed_from = loan.borrowed_from;
                    let borrow_pool_client = loan_pool::Client::new(&e, &borrowed_from);
                    borrow_pool_client.increase_liabilities(&user, &interest_since_update);
                }
            }
        }

        e.storage().persistent().set(&key, &current_ledger);
        e.storage().persistent().extend_ttl(
            &key,
            POSITIONS_LIFETIME_THRESHOLD,
            POSITIONS_BUMP_AMOUNT,
        );
    }

    pub fn calculate_health_factor(
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

    pub fn get_loan(e: &Env, addr: Address) -> Loan {
        if let Some(loan) = positions::read_positions(e, addr) {
            loan
        } else {
            panic!() // TODO: It should be panic_with_error or something and give out detailed error.
        }
    }

    pub fn get_price(e: &Env, token: Symbol) -> i128 {
        let reflector_address = Address::from_string(&String::from_str(e, REFLECTOR_ADDRESS));
        let reflector_contract = oracle::Client::new(e, &reflector_address);

        let asset = Asset::Other(token);

        let asset_pricedata = reflector_contract.lastprice(&asset).unwrap();
        asset_pricedata.price
    }

    pub fn repay(e: &Env, user: Address, amount: i128) -> (i128, i128) {
        user.require_auth();

        let Loan {
            borrowed_amount,
            borrowed_from,
            collateral_amount,
            collateral_from,
            health_factor,
            unpaid_interest,
        } = Self::get_loan(e, user.clone());

        assert!(
            amount <= borrowed_amount,
            "Amount can not be greater than borrowed amount!"
        );

        let borrow_pool_client = loan_pool::Client::new(e, &borrowed_from);
        borrow_pool_client.repay(&user, &amount, &unpaid_interest);

        let new_unpaid_interest = if amount < unpaid_interest {
            unpaid_interest - amount
        } else {
            0
        };

        let key = (Symbol::new(e, "Loan"), user.clone());
        let new_borrowed_amount = borrowed_amount - amount;
        //TODO: calculate new health-factor. No need to check it relative to threshold.

        if new_borrowed_amount == 0 {
            let collateral_pool_client = loan_pool::Client::new(e, &collateral_from);
            collateral_pool_client.withdraw_collateral(&user, &collateral_amount);
            e.storage().persistent().remove(&key);

            let mut addresses: Vec<Address> = e
                .storage()
                .persistent()
                .get(&LoansDataKey::Addresses)
                .unwrap();

            if let Some(index) = addresses.iter().position(|x| x == user) {
                addresses.remove(index.try_into().unwrap())
            } else {
                panic!("Address not found in Addresses");
            };
        } else {
            let loan = Loan {
                borrowed_amount: new_borrowed_amount,
                borrowed_from,
                collateral_amount,
                collateral_from,
                health_factor,
                unpaid_interest: new_unpaid_interest,
            };

            e.storage().persistent().set(&key, &loan);
            e.storage().persistent().extend_ttl(
                &key,
                POSITIONS_LIFETIME_THRESHOLD,
                POSITIONS_BUMP_AMOUNT,
            );
        }

        (borrowed_amount, new_borrowed_amount)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token::{Client as TokenClient, StellarAssetClient},
        Env,
    };
    mod loan_manager {
        soroban_sdk::contractimport!(
            file = "../../target/wasm32-unknown-unknown/release/loan_manager.wasm"
        );
    }

    #[test]
    fn initialize() {
        let e = Env::default();
        let admin = Address::generate(&e);

        let contract_id = e.register_contract(None, LoanManager);
        let client = LoanManagerClient::new(&e, &contract_id);

        assert!(client.try_initialize(&admin).is_ok());
    }

    #[test]
    fn cannot_re_initialize() {
        let e = Env::default();
        let admin = Address::generate(&e);

        let contract_id = e.register_contract(None, LoanManager);
        let client = LoanManagerClient::new(&e, &contract_id);

        client.initialize(&admin);

        assert!(client.try_initialize(&admin).is_err())
    }

    #[test]
    fn deploy_pool() {
        // ARRANGE
        let e = Env::default();

        let admin = Address::generate(&e);
        let deployer_client = LoanManagerClient::new(&e, &e.register_contract(None, LoanManager));
        deployer_client.initialize(&admin);

        // Setup test token
        let token_address = e.register_stellar_asset_contract(admin.clone());
        let ticker = Symbol::new(&e, "XLM");

        let wasm_hash = e.deployer().upload_contract_wasm(loan_pool::WASM);
        let salt = BytesN::from_array(&e, &[0; 32]);

        // ACT
        // Deploy contract using loan_manager as factory
        let loan_pool_addr =
            deployer_client.deploy_pool(&wasm_hash, &salt, &token_address, &ticker, &800_000);

        // ASSERT
        // No authorizations needed - the contract acts as a factory.
        assert_eq!(e.auths(), &[]);

        // Invoke contract to check that it is initialized.
        let loan_pool_client = loan_pool::Client::new(&e, &loan_pool_addr);
        let pool_balance = loan_pool_client.get_contract_balance();
        assert_eq!(pool_balance, 0);
    }

    #[test]
    fn upgrade_manager_and_pool() {
        // ARRANGE
        let e = Env::default();
        e.mock_all_auths();

        let admin = Address::generate(&e);

        let deployer_client = LoanManagerClient::new(&e, &e.register_contract(None, LoanManager));
        deployer_client.initialize(&admin);

        // Setup test token
        let token_address = e.register_stellar_asset_contract(admin.clone());
        let ticker = Symbol::new(&e, "XLM");

        let manager_wasm_hash = e.deployer().upload_contract_wasm(loan_manager::WASM);
        let pool_wasm_hash = e.deployer().upload_contract_wasm(loan_pool::WASM);
        let salt = BytesN::from_array(&e, &[0; 32]);

        // ACT
        deployer_client.deploy_pool(&pool_wasm_hash, &salt, &token_address, &ticker, &800_000);
        deployer_client.upgrade(&manager_wasm_hash, &pool_wasm_hash);
    }

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
        let loan_currency = loan_pool::Currency {
            token_address: loan_token_contract_id.clone(),
            ticker: Symbol::new(&e, "XLM"),
        };

        let admin2 = Address::generate(&e);
        let collateral_token_contract_id = e.register_stellar_asset_contract(admin2.clone());
        let collateral_asset = StellarAssetClient::new(&e, &collateral_token_contract_id);
        let collateral_token = TokenClient::new(&e, &collateral_token_contract_id);
        let collateral_currency = loan_pool::Currency {
            token_address: collateral_token_contract_id.clone(),
            ticker: Symbol::new(&e, "USDC"),
        };

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
        let contract_id = e.register_contract(None, LoanManager);
        let contract_client = LoanManagerClient::new(&e, &contract_id);

        // ACT
        // Initialize the loan pool and deposit some of the admin's funds.
        loan_pool_client.initialize(&contract_id, &loan_currency, &800_000);
        loan_pool_client.deposit(&admin, &1000);

        collateral_pool_client.initialize(&contract_id, &collateral_currency, &800_000);

        contract_client.create_loan(&user, &10, &loan_pool_id, &100, &collateral_pool_id);

        // ASSERT
        assert_eq!(loan_token.balance(&user), 10);
        assert_eq!(collateral_token.balance(&user), 900);
    }

    #[test]
    fn add_interest() {
        // ARRANGE
        let e = Env::default();
        e.mock_all_auths_allowing_non_root_auth();
        e.ledger().with_mut(|li| {
            li.sequence_number = 100_000;
            li.min_persistent_entry_ttl = 1_000_000;
            li.min_temp_entry_ttl = 1_000_000;
            li.max_entry_ttl = 1_000_001;
        });

        let admin = Address::generate(&e);
        let loan_token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let loan_asset = StellarAssetClient::new(&e, &loan_token_contract_id);
        loan_asset.mint(&admin, &1_000_000);
        let loan_currency = loan_pool::Currency {
            token_address: loan_token_contract_id.clone(),
            ticker: Symbol::new(&e, "XLM"),
        };

        let admin2 = Address::generate(&e);
        let collateral_token_contract_id = e.register_stellar_asset_contract(admin2.clone());
        let collateral_asset = StellarAssetClient::new(&e, &collateral_token_contract_id);
        let collateral_token = TokenClient::new(&e, &collateral_token_contract_id);
        let collateral_currency = loan_pool::Currency {
            token_address: collateral_token_contract_id.clone(),
            ticker: Symbol::new(&e, "USDC"),
        };

        // Register mock Reflector contract.
        let reflector_addr = Address::from_string(&String::from_str(&e, REFLECTOR_ADDRESS));
        e.register_contract_wasm(&reflector_addr, oracle::WASM);

        // Mint the user some coins
        let user = Address::generate(&e);
        collateral_asset.mint(&user, &1_000_000);

        assert_eq!(collateral_token.balance(&user), 1_000_000);

        // Set up a loan pool with funds for borrowing.
        let loan_pool_id = e.register_contract_wasm(None, loan_pool::WASM);
        let loan_pool_client = loan_pool::Client::new(&e, &loan_pool_id);

        // Set up a loan_pool for the collaterals.
        let collateral_pool_id = e.register_contract_wasm(None, loan_pool::WASM);
        let collateral_pool_client = loan_pool::Client::new(&e, &collateral_pool_id);

        // Register loan manager contract.
        let contract_id = e.register_contract(None, LoanManager);
        let contract_client = LoanManagerClient::new(&e, &contract_id);

        // ACT
        // Initialize the loan pool and deposit some of the admin's funds.
        loan_pool_client.initialize(&contract_id, &loan_currency, &800_000);
        loan_pool_client.deposit(&admin, &1_000_000);

        collateral_pool_client.initialize(&contract_id, &collateral_currency, &800_000);

        // Create a loan.
        contract_client.create_loan(&user, &10_000, &loan_pool_id, &100_000, &collateral_pool_id);

        let user_loan = contract_client.get_loan(&user);

        assert_eq!(user_loan.borrowed_amount, 10_000);
        assert_eq!(collateral_token.balance(&user), 900_000);

        contract_client.add_interest();

        // Here borrowed amount should be the same as time has not moved. add_interest() is only called to store the LastUpdate sequence number.
        assert_eq!(user_loan.borrowed_amount, 10_000);
        assert_eq!(user_loan.health_factor, 100_000_000);
        assert_eq!(collateral_token.balance(&user), 900_000);

        // Move time
        e.ledger().with_mut(|li| {
            li.sequence_number = 100_000 + 100_000;
        });

        // A new instance of reflector mock needs to be created, they only live for one ledger.
        let reflector_addr = Address::from_string(&String::from_str(&e, REFLECTOR_ADDRESS));
        e.register_contract_wasm(&reflector_addr, oracle::WASM);

        contract_client.add_interest();

        let user_loan = contract_client.get_loan(&user);

        assert_eq!(user_loan.borrowed_amount, 10_003);
        assert_eq!(user_loan.health_factor, 99_970_008);
        assert_eq!(user_loan.collateral_amount, 100_000);
    }

    #[test]
    fn repay() {
        // ARRANGE
        let e = Env::default();
        e.mock_all_auths_allowing_non_root_auth();

        let admin = Address::generate(&e);
        let loan_token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let loan_asset = StellarAssetClient::new(&e, &loan_token_contract_id);
        let loan_token = TokenClient::new(&e, &loan_token_contract_id);
        loan_asset.mint(&admin, &1_000_000);
        let loan_currency = loan_pool::Currency {
            token_address: loan_token_contract_id.clone(),
            ticker: Symbol::new(&e, "XLM"),
        };

        let admin2 = Address::generate(&e);
        let collateral_token_contract_id = e.register_stellar_asset_contract(admin2.clone());
        let collateral_asset = StellarAssetClient::new(&e, &collateral_token_contract_id);
        let collateral_token = TokenClient::new(&e, &collateral_token_contract_id);
        let collateral_currency = loan_pool::Currency {
            token_address: collateral_token_contract_id.clone(),
            ticker: Symbol::new(&e, "USDC"),
        };

        // Register mock Reflector contract.
        let reflector_addr = Address::from_string(&String::from_str(&e, REFLECTOR_ADDRESS));
        e.register_contract_wasm(&reflector_addr, oracle::WASM);

        // Mint the user some coins
        let user = Address::generate(&e);
        collateral_asset.mint(&user, &1_000_000);

        assert_eq!(collateral_token.balance(&user), 1_000_000);

        // Set up a loan pool with funds for borrowing.
        let loan_pool_id = e.register_contract_wasm(None, loan_pool::WASM);
        let loan_pool_client = loan_pool::Client::new(&e, &loan_pool_id);

        // Set up a loan_pool for the collaterals.
        let collateral_pool_id = e.register_contract_wasm(None, loan_pool::WASM);
        let collateral_pool_client = loan_pool::Client::new(&e, &collateral_pool_id);

        // Register loan manager contract.
        let contract_id = e.register_contract(None, LoanManager);
        let contract_client = LoanManagerClient::new(&e, &contract_id);

        // ACT
        // Initialize the loan pool and deposit some of the admin's funds.
        loan_pool_client.initialize(&contract_id, &loan_currency, &800_000);
        loan_pool_client.deposit(&admin, &1_000_000);

        collateral_pool_client.initialize(&contract_id, &collateral_currency, &800_000);

        // Create a loan.
        contract_client.create_loan(&user, &1_000, &loan_pool_id, &100_000, &collateral_pool_id);

        // ASSERT
        assert_eq!(loan_token.balance(&user), 1_000);
        assert_eq!(collateral_token.balance(&user), 900_000);

        let user_loan = contract_client.get_loan(&user);

        assert_eq!(user_loan.borrowed_amount, 1_000);
        assert_eq!(user_loan.collateral_amount, 100_000);

        contract_client.repay(&user, &100);
        let user_loan = contract_client.get_loan(&user);
        assert_eq!(user_loan.borrowed_amount, 900);

        assert_eq!((900, 800), contract_client.repay(&user, &100));
    }

    #[test]
    #[should_panic(expected = "Amount can not be greater than borrowed amount!")]
    fn repay_more_than_borrowed() {
        // ARRANGE
        let e = Env::default();
        e.mock_all_auths_allowing_non_root_auth();

        let admin = Address::generate(&e);
        let loan_token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let loan_asset = StellarAssetClient::new(&e, &loan_token_contract_id);
        loan_asset.mint(&admin, &1_000_000);
        let loan_currency = loan_pool::Currency {
            token_address: loan_token_contract_id.clone(),
            ticker: Symbol::new(&e, "XLM"),
        };

        let admin2 = Address::generate(&e);
        let collateral_token_contract_id = e.register_stellar_asset_contract(admin2.clone());
        let collateral_asset = StellarAssetClient::new(&e, &collateral_token_contract_id);
        let collateral_token = TokenClient::new(&e, &collateral_token_contract_id);
        let collateral_currency = loan_pool::Currency {
            token_address: collateral_token_contract_id.clone(),
            ticker: Symbol::new(&e, "USDC"),
        };

        // Register mock Reflector contract.
        let reflector_addr = Address::from_string(&String::from_str(&e, REFLECTOR_ADDRESS));
        e.register_contract_wasm(&reflector_addr, oracle::WASM);

        // Mint the user some coins
        let user = Address::generate(&e);
        collateral_asset.mint(&user, &1_000_000);

        assert_eq!(collateral_token.balance(&user), 1_000_000);

        // Set up a loan pool with funds for borrowing.
        let loan_pool_id = e.register_contract_wasm(None, loan_pool::WASM);
        let loan_pool_client = loan_pool::Client::new(&e, &loan_pool_id);

        // Set up a loan_pool for the collaterals.
        let collateral_pool_id = e.register_contract_wasm(None, loan_pool::WASM);
        let collateral_pool_client = loan_pool::Client::new(&e, &collateral_pool_id);

        // Register loan manager contract.
        let contract_id = e.register_contract(None, LoanManager);
        let contract_client = LoanManagerClient::new(&e, &contract_id);

        // ACT
        // Initialize the loan pool and deposit some of the admin's funds.
        loan_pool_client.initialize(&contract_id, &loan_currency, &800_000);
        loan_pool_client.deposit(&admin, &1_000_000);

        collateral_pool_client.initialize(&contract_id, &collateral_currency, &800_000);

        // Create a loan.
        contract_client.create_loan(&user, &1_000, &loan_pool_id, &100_000, &collateral_pool_id);

        contract_client.repay(&user, &2_000);
    }
}
