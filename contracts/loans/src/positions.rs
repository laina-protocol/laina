use crate::storage_types::{LoansDataKey, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD};
use soroban_sdk::{Address, Env, IntoVal, Map, Symbol, TryFromVal, Val};

pub fn init_loan(e: &Env, addr: Address, borrowed: i128, borrowed_from: Address, collateral: i128, collateral_from: Address) {
    // Here this part has to call health factor calculator but for now:
    let health_factor: i32 = 1000;
    write_positions(&e, addr, borrowed, borrowed_from, collateral, collateral_from, health_factor);
}

pub fn read_positions(e: &Env, addr: Address) -> Val {
    let key: LoansDataKey = LoansDataKey::Loan(addr);
    // If positions exist, read them and return them as Val
    if let Some(loan) = e.storage().persistent().get::<LoansDataKey, Val>(&key) {
        e.storage()
            .persistent()
            .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
        loan
    } else {
        0.into_val(e)
        // Some sort of error as in this case there is no way to be empty loan. maybe use try catch
    }
}

fn write_positions(e: &Env, addr: Address, borrowed: i128, borrowed_from: Address, collateral: i128, collateral_from: Address, health_factor: i32) {
    let key = LoansDataKey::Loan(addr);
    // Initialize the map with the environment
    let mut positions: Map<Symbol, Val> = Map::new(&e);

    // Set position values in the map
    positions.set(Symbol::new(&e,"borrowed"), borrowed.into_val(e));
    positions.set(Symbol::new(&e, "borrowed_from"), borrowed_from.into_val(e));
    positions.set(Symbol::new(&e,"collateral"), collateral.into_val(e));
    positions.set(Symbol::new(&e,"collateral_from"), collateral_from.into_val(e));
    positions.set(Symbol::new(&e,"health_factor"), health_factor.into_val(e));

    // Transform the map of positions in to Val so it can be stored
    let val: Val= positions.into_val(e);

    e.storage().persistent().set(&key, &val);
        e.storage()
            .persistent()
            .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}

pub fn increase_positions(e: &Env, addr: Address, receivables: i128, liabilities: i128, collateral: i128) {
    // Read the positions (Val) of given address with read_positions
    let positions_val: Val = read_positions(e, addr.clone());
    // Convert the Val back to Map
    let positions_map: Map<Symbol, i128> = Map::try_from_val(e, &positions_val).unwrap();
    // TODO: Might need to use get rather than get_unchecked and convert from Option<V> to V
    // Get current positions from the map
    let receivables_now = positions_map.get_unchecked(Symbol::new(&e, "receivables"));
    let liabilities_now = positions_map.get_unchecked(Symbol::new(&e, "liabilities"));
    let collateral_now = positions_map.get_unchecked(Symbol::new(&e, "collateral"));
    //write_positions(e, addr, receivables_now + receivables, liabilities_now + liabilities, collateral_now + collateral);
}

pub fn decrease_positions(e: &Env, addr: Address, receivables: i128, liabilities: i128, collateral: i128) {
    // Read the positions (Val) of given address with read_positions
    let positions_val = read_positions(e, addr.clone());
    // Convert the Val back to Map
    let positions_map: Map<Symbol, i128> = Map::try_from_val(e, &positions_val).unwrap();
    // TODO: Might need to use get rather than get_unchecked and convert from Option<V> to V
    // Get current positions from the map
    let receivables_now = positions_map.get_unchecked(Symbol::new(&e, "receivables"));
    let liabilities_now = positions_map.get_unchecked(Symbol::new(&e, "liabilities"));
    let collateral_now = positions_map.get_unchecked(Symbol::new(&e, "collateral"));

    if receivables_now < receivables {
        panic!("insufficient receivables");
    }
    if liabilities_now < liabilities {
        panic!("insufficient liabilities");
    }
    if collateral_now < collateral {
        panic!("insufficient collateral");
    }
    //write_positions(e, addr, receivables_now - receivables, liabilities_now - liabilities, collateral_now - collateral);
}
