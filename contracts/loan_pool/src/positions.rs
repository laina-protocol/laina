use crate::storage_types::{extend_persistent, PoolDataKey, Positions};
use soroban_sdk::{Address, Env, IntoVal, TryFromVal, Val};

pub fn read_positions(e: &Env, addr: Address) -> Val {
    let key = PoolDataKey::Positions(addr);
    // If positions exist, read them and return them as Val
    if let Some(positions) = e.storage().persistent().get::<PoolDataKey, Val>(&key) {
        extend_persistent(e.clone(), &key);
        positions
    } else {
        let positions: Positions = Positions {
            receivables: 0,
            liabilities: 0,
            collateral: 0,
        };

        positions.into_val(e)
    }
}

fn write_positions(e: &Env, addr: Address, receivables: i128, liabilities: i128, collateral: i128) {
    let key: PoolDataKey = PoolDataKey::Positions(addr);

    let positions: Positions = Positions {
        receivables,
        liabilities,
        collateral,
    };

    let val: Val = positions.into_val(e);

    e.storage().persistent().set(&key, &val);

    extend_persistent(e.clone(), &key);
}

pub fn increase_positions(
    e: &Env,
    addr: Address,
    receivables: i128,
    liabilities: i128,
    collateral: i128,
) {
    let positions_val: Val = read_positions(e, addr.clone());

    let positions: Positions = Positions::try_from_val(e, &positions_val).unwrap();

    let receivables_now: i128 = positions.receivables;
    let liabilities_now: i128 = positions.liabilities;
    let collateral_now = positions.collateral;
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
    let positions_val = read_positions(e, addr.clone());

    let positions: Positions = Positions::try_from_val(e, &positions_val).unwrap();
    // TODO: Might need to use get rather than get_unchecked and convert from Option<V> to V
    let receivables_now = positions.receivables;
    let liabilities_now = positions.liabilities;
    let collateral_now = positions.collateral;

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
