use crate::{
    loan_pool_env_extensions::LoanPoolEnvExtensions,
    storage_types::{Positions, PositionsInput},
};
use soroban_sdk::{Address, Env};

pub fn update_positions(e: &Env, user: &Address, input: PositionsInput) -> Positions {
    let Positions {
        receivables,
        liabilities,
        collateral,
    } = e.get_positions(user);

    // Calculate the new positions.
    let receivables = input.receivables.map_or(receivables, |r| receivables + r);
    let liabilities = input.liabilities.map_or(liabilities, |l| liabilities + l);
    let collateral = input.collateral.map_or(collateral, |c| collateral + c);

    if receivables < 0 {
        panic!("Insufficient receivables");
    }
    if liabilities < 0 {
        panic!("insufficient liabilities");
    }
    if collateral < 0 {
        panic!("insufficient collateral");
    }

    let new_positions = Positions {
        receivables,
        liabilities,
        collateral,
    };

    e.set_positions(user, &new_positions);

    new_positions
}
