use crate::storage_types::{PoolDataKey, POSITIONS_BUMP_AMOUNT, POSITIONS_LIFETIME_THRESHOLD};
use soroban_sdk::{Address, Env, IntoVal, Map, Symbol, TryFromVal, Val};

pub fn read_positions(e: &Env, addr: Address) -> Val {
    let key = PoolDataKey::Positions(addr);
    // If positions exist, read them and return them as Val
    if let Some(positions) = e.storage().persistent().get::<PoolDataKey, Val>(&key) {
        e.storage().persistent().extend_ttl(
            &key,
            POSITIONS_LIFETIME_THRESHOLD,
            POSITIONS_BUMP_AMOUNT,
        );
        positions
    } else {
        // In case there is no positions yet and we want to read them to increase them
        // we'll need to create one with zeroes

        // Initialize the map with the environment
        let mut empty_positions: Map<Symbol, i128> = Map::new(&e);

        // Set position values as 0
        let receivables: i128 = 0;
        let liabilities: i128 = 0;
        let collateral: i128 = 0;

        empty_positions.set(Symbol::new(&e, "receivables"), receivables);
        empty_positions.set(Symbol::new(&e, "liabilities"), liabilities);
        empty_positions.set(Symbol::new(&e, "collateral"), collateral);

        // Return empty positions as Val
        empty_positions.into_val(e)
    }
}

fn write_positions(e: &Env, addr: Address, receivables: i128, liabilities: i128, collateral: i128) {
    let key: PoolDataKey = PoolDataKey::Positions(addr);
    // Initialize the map with the environment
    let mut positions: Map<Symbol, i128> = Map::new(&e);

    // Set position values in the map
    positions.set(Symbol::new(&e, "receivables"), receivables);
    positions.set(Symbol::new(&e, "liabilities"), liabilities);
    positions.set(Symbol::new(&e, "collateral"), collateral);

    // Transform the map of positions in to Val so it can be stored
    let val: Val = positions.into_val(e);

    e.storage().persistent().set(&key, &val);
    e.storage()
        .persistent()
        .extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);
}

pub fn increase_positions(
    e: &Env,
    addr: Address,
    receivables: i128,
    liabilities: i128,
    collateral: i128,
) {
    // Read the positions (Val) of given address with read_positions
    let positions_val: Val = read_positions(e, addr.clone());
    // Convert the Val back to Map
    let positions_map: Map<Symbol, i128> = Map::try_from_val(e, &positions_val).unwrap();
    // TODO: Might need to use get rather than get_unchecked and convert from Option<V> to V
    // Get current positions from the map
    let receivables_now = positions_map.get_unchecked(Symbol::new(&e, "receivables"));
    let liabilities_now = positions_map.get_unchecked(Symbol::new(&e, "liabilities"));
    let collateral_now = positions_map.get_unchecked(Symbol::new(&e, "collateral"));
    write_positions(
        e,
        addr,
        receivables_now + receivables,
        liabilities_now + liabilities,
        collateral_now + collateral,
    );
}

pub fn decrease_positions(
    e: &Env,
    addr: Address,
    receivables: i128,
    liabilities: i128,
    collateral: i128,
) {
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
    write_positions(
        e,
        addr,
        receivables_now - receivables,
        liabilities_now - liabilities,
        collateral_now - collateral,
    );
}
