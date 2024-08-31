#![cfg(test)]

// use super::*;
// use soroban_sdk::{symbol_short, vec, Env};
//
// #[test]
// fn test() {
//     let env = Env::default();
//     let contract_id = env.register_contract(None, MockPriceOracleContract);
//     let client = MockPriceOracleContractClient::new(&env, &contract_id);
//
//     let words = client.lastprice(&Asset::Other());
//     assert_eq!(
//         words,
//         Some(PriceData {
//             price: 1,
//             timestamp: 1
//         })
//     );
// }
