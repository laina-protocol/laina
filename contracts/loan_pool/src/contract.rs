use crate::{
    loan_pool_env_extensions::LoanPoolEnvExtensions,
    positions,
    storage_types::{Currency, Positions, PositionsInput},
};

use soroban_sdk::{contract, contractimpl, contractmeta, token, Address, Env};

// Metadata that is added on to the WASM custom section
contractmeta!(
    key = "Desc",
    val = "Lending pool with variable interest rate."
);

#[contract]
struct LoanPoolContract;

#[allow(dead_code)]
#[contractimpl]
impl LoanPoolContract {
    /// Sets the currency of the pool and initializes its balance.
    pub fn initialize(
        e: Env,
        loan_manager_addr: Address,
        currency: Currency,
        liquidation_threshold: i128,
    ) {
        e.set_loan_manager_address(&loan_manager_addr);
        e.set_currency(currency);
        e.set_liquidation_threshold(liquidation_threshold);
        e.set_total_shares(0);
        e.set_total_balance(0);
        e.set_available_balance(0);
    }

    /// Deposits token. Also, mints pool shares for the "user" Identifier.
    pub fn deposit(e: Env, user: Address, amount: i128) -> Positions {
        user.require_auth(); // Depositor needs to authorize the deposit
        assert!(amount > 0, "Amount must be positive!");

        e.extend_instance_rent();

        let client = token::Client::new(&e, &e.get_currency().token_address);
        client.transfer(&user, &e.current_contract_address(), &amount);

        // TODO: these need to be replaced with increase rather than write so that it wont overwrite the values.
        e.set_total_balance(amount);
        e.set_total_shares(amount);
        e.increase_total_balance(amount);

        // Increase users position in pool as they deposit
        // as this is deposit amount is added to receivables and
        // liabilities & collateral stays intact
        let input = PositionsInput {
            receivables: Some(amount),
            liabilities: None,
            collateral: None,
        };

        positions::update_positions(&e, &user, input)
    }

    /// Transfers share tokens back, burns them and gives corresponding amount of tokens back to user. Returns amount of tokens withdrawn
    pub fn withdraw(e: Env, user: Address, amount: i128) -> Positions {
        user.require_auth();

        // Extend instance storage rent
        e.extend_instance_rent();

        // TODO: Decrease AvailableBalance
        // TODO: Decrease TotalShares
        // TODO: Decrease TotalBalance

        // Decrease users position in pool as they withdraw
        let input = PositionsInput {
            receivables: Some(-amount),
            liabilities: None,
            collateral: None,
        };

        // Transfer tokens from pool to user
        let client = token::Client::new(&e, &e.get_currency().token_address);
        client.transfer(&e.current_contract_address(), &user, &amount);

        positions::update_positions(&e, &user, input)
    }

    /// Borrow tokens from the pool
    pub fn borrow(e: Env, user: Address, amount: i128) -> Positions {
        /*
        Borrow should only be callable from the loans contract. This is as the loans contract will
        include the logic and checks that the borrowing can be actually done. Therefore we need to
        include a check that the caller is the loans contract.
        */
        let loan_manager_addr = e.get_loan_manager_address();
        loan_manager_addr.require_auth();
        user.require_auth();

        // Extend instance storage rent
        e.extend_instance_rent();

        assert!(
            amount < e.get_available_balance(),
            "Borrowed amount has to be less than available balance!"
        );

        // Increase users position in pool as they deposit
        // as this is debt amount is added to liabilities and
        // collateral & receivables stays intact
        let input = PositionsInput {
            receivables: None,
            liabilities: Some(amount),
            collateral: None,
        };

        let client = token::Client::new(&e, &e.get_currency().token_address);
        client.transfer(&e.current_contract_address(), &user, &amount);

        positions::update_positions(&e, &user, input)
    }

    /// Deposit tokens to the pool to be used as collateral
    pub fn deposit_collateral(e: Env, user: Address, amount: i128) -> Positions {
        user.require_auth();
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        e.extend_instance_rent();

        let token_address = e.get_currency().token_address;
        let client = token::Client::new(&e, &token_address);
        client.transfer(&user, &e.current_contract_address(), &amount);

        // Increase users position in pool as they deposit
        // as this is collateral amount is added to collateral and
        // liabilities & receivables stays intact
        let input = PositionsInput {
            receivables: None,
            liabilities: None,
            collateral: Some(amount),
        };
        positions::update_positions(&e, &user, input)
    }

    /// Get contract data entries
    pub fn get_contract_balance(e: Env) -> i128 {
        // Extend instance storage rent
        e.extend_instance_rent();
        e.get_total_balance()
    }
}

#[cfg(test)]
mod test {
    use super::*; // This imports LoanPoolContract and everything else from the parent module
    use soroban_sdk::{
        testutils::Address as _,
        token::{Client as TokenClient, StellarAssetClient},
        Env, Symbol,
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

        contract_client.initialize(
            &Address::generate(&e),
            &currency,
            &TEST_LIQUIDATION_THRESHOLD,
        );
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

        contract_client.initialize(
            &Address::generate(&e),
            &currency,
            &TEST_LIQUIDATION_THRESHOLD,
        );

        let positions = contract_client.deposit(&user, &amount);

        assert_eq!(positions.receivables, amount);
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
        contract_client.initialize(
            &Address::generate(&e),
            &currency,
            &TEST_LIQUIDATION_THRESHOLD,
        );

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

        contract_client.initialize(
            &Address::generate(&e),
            &currency,
            &TEST_LIQUIDATION_THRESHOLD,
        );

        let positions = contract_client.deposit(&user, &amount);

        assert_eq!(positions.receivables, amount);

        let withdraw_result = contract_client.withdraw(&user, &amount);

        assert_eq!(withdraw_result.receivables, 0);
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

        contract_client.initialize(
            &Address::generate(&e),
            &currency,
            &TEST_LIQUIDATION_THRESHOLD,
        );

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

        contract_client.initialize(
            &Address::generate(&e),
            &currency,
            &TEST_LIQUIDATION_THRESHOLD,
        );

        let positions = contract_client.deposit(&user, &amount);

        assert_eq!(positions.receivables, amount);

        contract_client.withdraw(&user, &(amount * 2));
    }
}
