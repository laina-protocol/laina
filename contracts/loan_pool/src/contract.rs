use crate::pool;
use crate::pool::Currency;
use crate::positions;
use crate::storage_types::extend_instance;

use soroban_sdk::{
    contract, contractimpl, contractmeta, token, Address, Env, Map, String, Symbol, TryFromVal, Val,
};

// Metadata that is added on to the WASM custom section
contractmeta!(
    key = "Desc",
    val = "Lending pool with variable interest rate."
);

// TODO: get this dynamically when creating the contract.
const LOAN_MANAGER_ADDRESS: &str = "CDIK5MXMF5F3TRW7XHPMUXGHDKBH2SESVDSG2RFGOP2GHXOPCDHTC7VO";

#[allow(dead_code)]
pub trait LoanPoolTrait {
    // Sets the token contract address for the pool
    fn initialize(e: Env, currency: Currency, liquidation_threshold: i128);

    // Deposits token. Also, mints pool shares for the "user" Identifier.
    fn deposit(e: Env, user: Address, amount: i128) -> i128;

    // Transfers share tokens back, burns them and gives corresponding amount of tokens back to user. Returns amount of tokens withdrawn
    fn withdraw(e: Env, user: Address, share_amount: i128) -> (i128, i128);

    // Borrow tokens from the pool
    fn borrow(e: Env, user: Address, amount: i128) -> i128;

    // Deposit tokens to the pool to be used as collateral
    fn deposit_collateral(e: Env, user: Address, amount: i128) -> i128;

    // Get contract data entries
    fn get_contract_balance(e: Env) -> i128;
}

#[allow(dead_code)]
#[contract]
struct LoanPoolContract;

#[contractimpl]
impl LoanPoolTrait for LoanPoolContract {
    fn initialize(e: Env, currency: Currency, liquidation_threshold: i128) {
        pool::write_currency(&e, currency);
        pool::write_liquidation_threshold(&e, liquidation_threshold);
        pool::write_total_shares(&e, 0);
        pool::write_total_balance(&e, 0);
        pool::write_available_balance(&e, 0);
    }

    fn deposit(e: Env, user: Address, amount: i128) -> i128 {
        user.require_auth(); // Depositor needs to authorize the deposit
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        extend_instance(e.clone());

        let client = token::Client::new(&e, &pool::read_currency(&e).token_address);
        client.transfer(&user, &e.current_contract_address(), &amount);

        // TODO: these need to be replaced with increase rather than write so that it wont overwrite the values.
        pool::write_available_balance(&e, amount);
        pool::write_total_shares(&e, amount);
        pool::increase_total_balance(&e, amount);

        // Increase users position in pool as they deposit
        // as this is deposit amount is added to receivables and
        // liabilities & collateral stays intact
        let liabilities: i128 = 0; // temp test param
        let collateral: i128 = 0; // temp test param
        positions::increase_positions(&e, user.clone(), amount, liabilities, collateral);

        amount
    }

    fn withdraw(e: Env, user: Address, amount: i128) -> (i128, i128) {
        user.require_auth();

        // Extend instance storage rent
        extend_instance(e.clone());

        // Get users receivables
        let receivables_val: Val = positions::read_positions(&e, user.clone());
        let receivables_map: Map<Symbol, i128> = Map::try_from_val(&e, &receivables_val).unwrap();
        let receivables: i128 = receivables_map.get_unchecked(Symbol::new(&e, "receivables"));

        // Check that user is not trying to move more than receivables (TODO: also include collateral?)
        assert!(
            amount <= receivables,
            "Amount can not be greater than receivables!"
        );

        // TODO: Decrease AvailableBalance
        // TODO: Decrease TotalShares
        // TODO: Decrease TotalBalance

        // Decrease users position in pool as they withdraw
        let liabilities: i128 = 0;
        let collateral: i128 = 0;
        positions::decrease_positions(&e, user.clone(), amount, liabilities, collateral);

        // Transfer tokens from pool to user
        let token_address = &pool::read_currency(&e).token_address;
        let client = token::Client::new(&e, token_address);
        client.transfer(&e.current_contract_address(), &user, &amount);

        (amount, amount)
    }

    fn borrow(e: Env, user: Address, amount: i128) -> i128 {
        /*
        Borrow should only be callable from the loans contract. This is as the loans contract will
        include the logic and checks that the borrowing can be actually done. Therefore we need to
        include a check that the caller is the loans contract.
        */
        let loan_manager_addr = Address::from_string(&String::from_str(&e, LOAN_MANAGER_ADDRESS));
        loan_manager_addr.require_auth();
        user.require_auth();

        // Extend instance storage rent
        extend_instance(e.clone());

        let balance = pool::read_available_balance(&e);
        assert!(
            amount < balance,
            "Borrowed amount has to be less than available balance!"
        ); // Check that there is enough available balance

        // Increase users position in pool as they deposit
        // as this is debt amount is added to liabilities and
        // collateral & receivables stays intact
        let collateral: i128 = 0; // temp test param
        let receivables: i128 = 0; // temp test param
        positions::increase_positions(&e, user.clone(), receivables, amount, collateral);

        let token_address = &pool::read_currency(&e).token_address;
        let client = token::Client::new(&e, token_address);
        client.transfer(&e.current_contract_address(), &user, &amount);

        amount
    }

    fn deposit_collateral(e: Env, user: Address, amount: i128) -> i128 {
        user.require_auth();
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        extend_instance(e.clone());

        let token_address = &pool::read_currency(&e).token_address;
        let client = token::Client::new(&e, token_address);
        client.transfer(&user, &e.current_contract_address(), &amount);

        // Increase users position in pool as they deposit
        // as this is collateral amount is added to collateral and
        // liabilities & receivables stays intact
        let liabilities: i128 = 0; // temp test param
        let receivables: i128 = 0; // temp test param
        positions::increase_positions(&e, user.clone(), receivables, liabilities, amount);

        amount
    }

    fn get_contract_balance(e: Env) -> i128 {
        // Extend instance storage rent
        extend_instance(e.clone());

        pool::read_total_balance(&e)
    }
}

#[cfg(test)]
mod test {

    use super::*; // This imports LoanPoolContract and everything else from the parent module
    use soroban_sdk::{
        testutils::Address as _,
        token::{Client as TokenClient, StellarAssetClient},
        Env,
    };

    const TEST_LIQUIDATION_THRESHOLD: i128 = 800_000;

    #[test]
    fn initialize() {
        let e: Env = Env::default();
        e.mock_all_auths();

        let admin: Address = Address::generate(&e);
        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let stellar_asset = StellarAssetClient::new(&e, &token_contract_id);
        let token = TokenClient::new(&e, &token_contract_id);
        let currency = Currency {
            token_address: token_contract_id,
            ticker: Symbol::new(&e, "XLM"),
        };

        let user = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);

        let contract_id = e.register_contract(None, LoanPoolContract);
        let contract_client = LoanPoolContractClient::new(&e, &contract_id);

        contract_client.initialize(&currency, &TEST_LIQUIDATION_THRESHOLD);
    }

    #[test]
    fn deposit() {
        let e: Env = Env::default();
        e.mock_all_auths();

        let admin: Address = Address::generate(&e);
        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let stellar_asset = StellarAssetClient::new(&e, &token_contract_id);
        let token = TokenClient::new(&e, &token_contract_id);
        let currency = Currency {
            token_address: token_contract_id,
            ticker: Symbol::new(&e, "XLM"),
        };

        let user = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);

        let contract_id = e.register_contract(None, LoanPoolContract);
        let contract_client = LoanPoolContractClient::new(&e, &contract_id);
        let amount: i128 = 100;

        contract_client.initialize(&currency, &TEST_LIQUIDATION_THRESHOLD);

        let result: i128 = contract_client.deposit(&user, &amount);

        assert_eq!(result, amount);
    }

    #[test]
    fn borrow() {
        let e = Env::default();
        e.mock_all_auths();

        let admin = Address::generate(&e);

        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let asset = StellarAssetClient::new(&e, &token_contract_id);

        let token_client = TokenClient::new(&e, &token_contract_id);
        let currency = Currency {
            token_address: token_contract_id,
            ticker: Symbol::new(&e, "XLM"),
        };

        let contract_id = e.register_contract(None, LoanPoolContract);
        let contract_client = LoanPoolContractClient::new(&e, &contract_id);
        contract_client.initialize(&currency, &TEST_LIQUIDATION_THRESHOLD);

        // Deposit funds for the borrower to loan.
        let depositer = Address::generate(&e);
        asset.mint(&depositer, &100);
        contract_client.deposit(&depositer, &100);

        // Borrow some of those funds
        let borrower = Address::generate(&e);
        contract_client.borrow(&borrower, &50);

        // Did the funds move?
        assert_eq!(token_client.balance(&depositer), 0);
        assert_eq!(token_client.balance(&borrower), 50);
    }

    #[test]
    fn withdraw() {
        let e: Env = Env::default();
        e.mock_all_auths();

        let admin: Address = Address::generate(&e);
        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let stellar_asset = StellarAssetClient::new(&e, &token_contract_id);
        let token = TokenClient::new(&e, &token_contract_id);
        let currency = Currency {
            token_address: token_contract_id,
            ticker: Symbol::new(&e, "XLM"),
        };

        let user = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);

        let contract_id = e.register_contract(None, LoanPoolContract);
        let contract_client = LoanPoolContractClient::new(&e, &contract_id);
        let amount: i128 = 100;

        contract_client.initialize(&currency, &TEST_LIQUIDATION_THRESHOLD);

        let result: i128 = contract_client.deposit(&user, &amount);

        assert_eq!(result, amount);

        let withdraw_result: (i128, i128) = contract_client.withdraw(&user, &amount);

        assert_eq!(withdraw_result, (amount, amount));
    }

    #[test]
    #[should_panic]
    fn deposit_more_than_account_balance() {
        let e: Env = Env::default();
        e.mock_all_auths();

        let admin: Address = Address::generate(&e);
        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let stellar_asset = StellarAssetClient::new(&e, &token_contract_id);
        let token = TokenClient::new(&e, &token_contract_id);
        let currency = Currency {
            token_address: token_contract_id,
            ticker: Symbol::new(&e, "XLM"),
        };

        let user = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);

        let contract_id = e.register_contract(None, LoanPoolContract);
        let contract_client = LoanPoolContractClient::new(&e, &contract_id);
        let amount: i128 = 2000;

        contract_client.initialize(&currency, &TEST_LIQUIDATION_THRESHOLD);

        contract_client.deposit(&user, &amount);
    }

    #[test]
    #[should_panic(expected = "Amount can not be greater than receivables!")]
    fn withdraw_more_than_balance() {
        let e: Env = Env::default();
        e.mock_all_auths();

        let admin: Address = Address::generate(&e);
        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let stellar_asset = StellarAssetClient::new(&e, &token_contract_id);
        let token = TokenClient::new(&e, &token_contract_id);
        let currency = Currency {
            token_address: token_contract_id,
            ticker: Symbol::new(&e, "XLM"),
        };

        let user = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);

        let contract_id = e.register_contract(None, LoanPoolContract);
        let contract_client = LoanPoolContractClient::new(&e, &contract_id);
        let amount: i128 = 100;

        contract_client.initialize(&currency, &TEST_LIQUIDATION_THRESHOLD);

        let result: i128 = contract_client.deposit(&user, &amount);

        assert_eq!(result, amount);

        contract_client.withdraw(&user, &(amount * 2));
    }
}
