use crate::pool;
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

#[allow(dead_code)]
pub trait LoanPoolTrait {
    // Sets the token contract address for the pool
    fn initialize(e: Env, token: Address);

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
    fn initialize(e: Env, token: Address) {
        pool::write_token(&e, token);
        pool::write_total_shares(&e, 0);
        pool::write_total_balance(&e, 0);
        pool::write_available_balance(&e, 0);
    }

    fn deposit(e: Env, user: Address, amount: i128) -> i128 {
        user.require_auth(); // Depositor needs to authorize the deposit
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        extend_instance(e.clone());

        let client = token::Client::new(&e, &pool::read_token(&e));
        client.transfer(&user, &e.current_contract_address(), &amount);

        // TODO: these need to be replaced with increase rather than write so that it wont overwrite the values.
        pool::write_available_balance(&e, amount);
        pool::write_total_shares(&e, amount);
        pool::write_total_balance(&e, amount);

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
        let client = token::Client::new(&e, &pool::read_token(&e));
        client.transfer(&e.current_contract_address(), &user, &amount);

        (amount, amount)
    }

    fn borrow(e: Env, user: Address, amount: i128) -> i128 {
        /*
        Borrow should only be callable from the loans contract. This is as the loans contract will
        include the logic and checks that the borrowing can be actually done. Therefore we need to
        include a check that the caller is the loans contract.
        */
        let address = String::from_str(
            &e,
            "CB6MHNR6FJMQHJZDWOKAU4KESR4OARLPZ4RMN57R55P2QUBH4QJENHLY",
        );
        let contract: Address = Address::from_string(&address);
        contract.require_auth();
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

        let client = token::Client::new(&e, &pool::read_token(&e));
        client.transfer(&e.current_contract_address(), &user, &amount);

        amount
    }

    fn deposit_collateral(e: Env, user: Address, amount: i128) -> i128 {
        user.require_auth();
        assert!(amount > 0, "Amount must be positive!");

        // Extend instance storage rent
        extend_instance(e.clone());

        let client = token::Client::new(&e, &pool::read_token(&e));
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
mod tests {
    use super::*; // This imports LoanPoolContract and everything else from the parent module
    use soroban_sdk::{
        testutils::Address as _,
        token::{Client as TokenClient, StellarAssetClient},
        vec, Env, IntoVal,
    };

    #[test]
    fn good_deposit() {
        let e: Env = Env::default();
        e.mock_all_auths();

        let admin: Address = Address::generate(&e);
        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let stellar_asset = StellarAssetClient::new(&e, &token_contract_id);
        let token = TokenClient::new(&e, &token_contract_id);

        let user = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);

        let contract_id = e.register_contract(None, LoanPoolContract);
        let amount_i: i128 = 100;
        let amount: Val = amount_i.into_val(&e);

        let args: soroban_sdk::Vec<Val> = vec![&e, user.to_val(), amount];
        let init_args: soroban_sdk::Vec<Val> = vec![&e, token_contract_id.to_val()];

        let _init_result: () =
            e.invoke_contract(&contract_id, &Symbol::new(&e, "initialize"), init_args);

        let result: i128 = e.invoke_contract(&contract_id, &Symbol::new(&e, "deposit"), args);

        assert_eq!(result, amount_i);

        // Add assertions to validate expected behavior
    }

    #[test]
    fn good_withdraw() {
        let e: Env = Env::default();
        e.mock_all_auths();

        let admin: Address = Address::generate(&e);
        let token_contract_id = e.register_stellar_asset_contract(admin.clone());
        let stellar_asset = StellarAssetClient::new(&e, &token_contract_id);
        let token = TokenClient::new(&e, &token_contract_id);

        let user = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);

        let contract_id = e.register_contract(None, LoanPoolContract);
        let amount_i: i128 = 100;
        let amount: Val = amount_i.into_val(&e);

        let args: soroban_sdk::Vec<Val> = vec![&e, user.to_val(), amount];
        let init_args: soroban_sdk::Vec<Val> = vec![&e, token_contract_id.to_val()];

        let _init_result: () =
            e.invoke_contract(&contract_id, &Symbol::new(&e, "initialize"), init_args);

        let result: i128 = e.invoke_contract(&contract_id, &Symbol::new(&e, "deposit"), args);

        assert_eq!(result, amount_i);

        let withdraw_args = vec![&e, user.to_val(), amount];
        let withdraw_result: (i128, i128) =
            e.invoke_contract(&contract_id, &Symbol::new(&e, "withdraw"), withdraw_args);

        assert_eq!(withdraw_result, (amount_i, amount_i));
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

        let user = Address::generate(&e);
        stellar_asset.mint(&user, &1000);
        assert_eq!(token.balance(&user), 1000);

        let contract_id = e.register_contract(None, LoanPoolContract);
        let amount_i: i128 = 100;
        let amount: Val = amount_i.into_val(&e);

        let args: soroban_sdk::Vec<Val> = vec![&e, user.to_val(), amount];
        let init_args: soroban_sdk::Vec<Val> = vec![&e, token_contract_id.to_val()];

        let _init_result: () =
            e.invoke_contract(&contract_id, &Symbol::new(&e, "initialize"), init_args);

        let result: i128 = e.invoke_contract(&contract_id, &Symbol::new(&e, "deposit"), args);

        assert_eq!(result, amount_i);

        let amount_i_2: i128 = 200;
        let amount_2: Val = amount_i_2.into_val(&e);

        let withdraw_args = vec![&e, user.to_val(), amount_2];
        let _withdraw_result: (i128, i128) =
            e.invoke_contract(&contract_id, &Symbol::new(&e, "withdraw"), withdraw_args);
    }
}
