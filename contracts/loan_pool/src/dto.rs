use soroban_sdk::contracttype;

#[contracttype]
pub struct PoolState {
    pub total_balance: i128,
    pub available_balance: i128,
    pub total_shares: i128,
    pub annual_interest_rate: i128,
}
