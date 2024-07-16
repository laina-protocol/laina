#![cfg(test)]
extern crate std;

use crate::{token, LoanPoolContractClient};

use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    Address, BytesN, Env, IntoVal,
};

fn create_token_contract<'a>(e: &Env, admin: &Address) -> token::Client<'a> {
    token::Client::new(e, &e.register_stellar_asset_contract(admin.clone()))
}

fn create_loanpool_contract<'a>(
    e: &Env,
    token_wasm_hash: &BytesN<32>,
    token: &Address,
) -> LoanPoolContractClient<'a> {
    let loanpool = 
        LoanPoolContractClient::new(e, &e.register_contract(None, crate::LoanPoolContract {}));
    loanpool.initialize(token_wasm_hash, token);
    loanpool
}

fn install_token_wasm(e: &Env) -> BytesN<32> {
    soroban_sdk::contractimport!(file = "../../target/wasm32-unknown-
    unknown/release/token.wasm");
    e.deployer().upload_contract_wasm(WASM)
}

#[test]
fn pool_token_minted_and_deposited() {
    let e = Env::default();
    e.mock_all_auths();

    let admin1 = Address::generate(&e);

    let token = create_token_contract(&e, &admin1);

    let user1 = Address::generate(&e);
    let loanpool = create_loanpool_contract(&e, &install_token_wasm(&e), &token.address);

    let token_share = token::Client::new(&e, &loanpool.share_id());

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    loanpool.deposit(&user1, &100);
    assert_eq!(
        e.auths(),
        std::vec![(
            user1.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    loanpool.address.clone(),
                    symbol_short!("deposit"),
                    (&user1, 100_i128).into_val(&e)
                )),
                sub_invocations: std::vec![AuthorizedInvocation {
                    function: AuthorizedFunction::Contract((
                        token.address.clone(),
                        symbol_short!("transfer"),
                        (&user1, &loanpool.address, 100_i128).into_val(&e)
                    )),
                    sub_invocations: std::vec![]
                }]
            }
        )]
    );

    assert_eq!(token_share.balance(&user1), 100);
    assert_eq!(token_share.balance(&loanpool.address), 0);
    assert_eq!(token.balance(&user1), 900);
    assert_eq!(token.balance(&loanpool.address), 100);
}
