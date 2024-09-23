use crate::storage_types::{Currency, Positions};
use soroban_sdk::{contracttype, Address, Env};

/* Ledger Thresholds */
pub(crate) const DAY_IN_LEDGERS: u32 = 17280; // if ledger takes 5 seconds

pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

pub(crate) const POSITIONS_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub(crate) const POSITIONS_LIFETIME_THRESHOLD: u32 = POSITIONS_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
pub enum PoolDataKey {
    // Address of the loan manager for authorization.
    LoanManagerAddress,
    // Pool's token's address & ticker
    Currency,
    // The threshold when a loan should liquidate, unit is one-millionth
    LiquidationThreshold,
    // Users positions in the pool
    Positions(Address),
    // Total amount of shares in circulation
    TotalShares,
    // Total balance of pool
    TotalBalance,
    // Available balance of pool
    AvailableBalance,
}

pub trait LoanPoolEnvExtensions {
    fn extend_instance_rent(&self);

    fn set_loan_manager_address(&self, addr: &Address);

    fn get_loan_manager_address(&self) -> Address;

    fn set_currency(&self, currency: Currency);

    fn get_currency(&self) -> Currency;

    fn set_liquidation_threshold(&self, liquidation_threshold: i128);

    fn set_total_shares(&self, shares: i128);

    fn set_total_balance(&self, shares: i128);

    fn get_total_balance(&self) -> i128;

    fn increase_total_balance(&self, amount: i128);

    fn set_available_balance(&self, shares: i128);

    fn get_available_balance(&self) -> i128;

    fn get_positions(&self, user: &Address) -> Positions;

    fn set_positions(&self, user: &Address, positions: &Positions);

    fn extend_positions_ttl(&self, key: &PoolDataKey);
}

impl LoanPoolEnvExtensions for Env {
    fn extend_instance_rent(&self) {
        self.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT)
    }

    fn set_loan_manager_address(&self, addr: &Address) {
        self.storage()
            .persistent()
            .set(&PoolDataKey::LoanManagerAddress, addr)
    }

    fn get_loan_manager_address(&self) -> Address {
        self.storage()
            .persistent()
            .get(&PoolDataKey::LoanManagerAddress)
            .unwrap()
    }

    fn set_currency(&self, currency: Currency) {
        self.storage()
            .persistent()
            .set(&PoolDataKey::Currency, &currency)
    }

    fn get_currency(&self) -> Currency {
        self.storage()
            .persistent()
            .get(&PoolDataKey::Currency)
            .unwrap()
    }

    fn set_liquidation_threshold(&self, liquidation_threshold: i128) {
        self.storage()
            .persistent()
            .set(&PoolDataKey::LiquidationThreshold, &liquidation_threshold)
    }

    fn set_total_shares(&self, shares: i128) {
        self.storage()
            .persistent()
            .set(&PoolDataKey::TotalShares, &shares)
    }

    fn set_total_balance(&self, shares: i128) {
        self.storage()
            .persistent()
            .set(&PoolDataKey::TotalBalance, &shares)
    }

    fn get_total_balance(&self) -> i128 {
        self.storage()
            .persistent()
            .get(&PoolDataKey::TotalBalance)
            .unwrap()
    }

    fn increase_total_balance(&self, amount: i128) {
        self.set_total_balance(amount + self.get_total_balance());
    }

    fn set_available_balance(&self, shares: i128) {
        self.storage()
            .persistent()
            .set(&PoolDataKey::AvailableBalance, &shares)
    }

    fn get_available_balance(&self) -> i128 {
        self.storage()
            .persistent()
            .get(&PoolDataKey::AvailableBalance)
            .unwrap()
    }

    fn get_positions(&self, user: &Address) -> Positions {
        let key = PoolDataKey::Positions(user.clone());
        let opt_positions = self.storage().persistent().get(&key);

        // Extend the TTL if the position exists and return the positions
        if let Some(positions) = opt_positions {
            self.extend_positions_ttl(&key);
            return positions;
        }

        // If the position doesn't exist, return a default empty value
        Positions {
            receivables: 0,
            liabilities: 0,
            collateral: 0,
        }
    }

    fn set_positions(&self, user: &Address, positions: &Positions) {
        let key: PoolDataKey = PoolDataKey::Positions(user.clone());

        self.storage().persistent().set(&key, positions);

        // Extend TTL after setting the positions
        self.extend_positions_ttl(&key);
    }

    fn extend_positions_ttl(&self, key: &PoolDataKey) {
        self.storage().persistent().extend_ttl(
            key,
            POSITIONS_LIFETIME_THRESHOLD,
            POSITIONS_BUMP_AMOUNT,
        );
    }
}
