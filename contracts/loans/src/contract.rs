use crate::storage_types::{self, extend_instance, LoansDataKey, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT};
use crate::positions;

use soroban_sdk::{
    contract, contractimpl, vec, Address, BytesN, ConversionError, Env, Map, IntoVal, Symbol, TryFromVal, Val, Vec
};

pub trait LoansTrait {
    // Initialize new loan
    fn initialize(e: Env, user: Address, borrowed: i128, borrowed_from: Address, collateral: i128, collateral_from: Address);
    // Add accumulated interest to the borrowed capital
    fn add_interest(e: Env);
}

#[contract]
struct LoansContract;

#[contractimpl]
impl LoansTrait for LoansContract {
    fn initialize(e: Env, user: Address, borrowed: i128, borrowed_from: Address, collateral: i128, collateral_from: Address) {
        // Require user authorization
        user.require_auth();

        // First thing should be to check if the collateral is enough => health factor large enough
        // Create args for collateral deposit
        let user_val: Val = Val::try_from_val(&e, &user).unwrap();
        let collateral_val: Val = Val::try_from_val(&e, &collateral).unwrap();
        let args: soroban_sdk::Vec<Val> = vec![&e, user_val, collateral_val];
        // Function to be called
        let func: Symbol = Symbol::new(&e, "deposit_collateral");
        // Deposit collateral
        let deposited_collateral: i128 = e.invoke_contract(&collateral_from, &func, args);

        // Create args for borrow
        let borrowed_val: Val = Val::try_from_val(&e, &borrowed).unwrap();
        let args_borrow: soroban_sdk::Vec<Val> = vec![&e, user_val.clone(), borrowed_val];
        // Function to be called
        let func2: Symbol = Symbol::new(&e, "borrow");
        // Borrow the funds
        let borrowed_funds: i128 = e.invoke_contract(&borrowed_from, &func2, args_borrow);

        // FIXME: Currently one can call initialize multiple times to change same addresses loan
        positions::init_loan(&e, user.clone(), borrowed_funds, borrowed_from, deposited_collateral, collateral_from);

        // Update the list of addresses with loans
        let mut addresses: Vec<Address> = e.storage().persistent().get(&Symbol::new(&e, "Addresses")).unwrap_or(vec![&e]);

        if !addresses.contains(&user) {
            addresses.push_back(user);
        }
        e.storage().persistent().set(&Symbol::new(&e, "Addresses"), &addresses);
    }

    fn add_interest(e: Env) {
        // Get current interest rates of pools.
        let apy = 12000; // temporary, also this is 12,000% * 1000. We'll want to make calculations using integers only if possible.
        // Get ledger number of last time rates were added and calculate the rate for the time between
        let last_ledger: u32 = 1014250; // temporary, also this has to be inserted to storage.
        let current_ledger: u32 = e.ledger().sequence();
        let ledgers_in_year: u32 = 6307200; // temporary, this should be made a global constant. This is assuming 5s ledger and not a leap year.
        let ledgers_between: u32 = current_ledger - last_ledger;

        /* 
        We calculate interest for ledgers_between from a given APY approximation simply by dividing the rate r with ledgers in a year
        and multiplying it with ledgers_between. This would result in slightly different total yearly interest, e.g. 12% -> 12.7% total.
        Perfect calculations are impossible in real world time as we must use ledgers as our time and ledger times vary between 5-6s.
        */
        let interest: u32 = (apy/ledgers_in_year)*ledgers_between;

        // Update current ledger as the new 'last time'

        // Iterate over loans and add interest to capital borrowed.
        // In the same iteration add the amount to the liabilities of the lending pool.
        // First, lets retrieve the list of addresses with loans
        let addresses:Vec<Address> = e.storage().persistent().get(&Symbol::new(&e, "Addresses")).unwrap();
        for user in addresses.iter() {
            // Construct the key for each user's loan
            let key = (Symbol::new(&e, "Loan"), user.clone());

            // get the loan from storage as a Val
            let loan: Val = e.storage().persistent().get::<(Symbol, Address), Val>(&key).unwrap();
            // Convert the Val to Map<Symbol, Val>
            let mut loan_map: Map<Symbol, Val> = Map::try_from_val(&e, &loan).expect("Failed to convert Val to Map");
            // Get the value of "borrowed" as Val, then convert it to i128
            let borrowed: Val = loan_map.get(Symbol::new(&e, "borrowed")).unwrap();
            let borrowed_as_int: i128 = i128::try_from_val(&e, &borrowed).expect("Failed to convert Val to i128");
            // Calculate new borrowed
            // FIXME: the calculation doesn't work, perhaps because of the change in types. OR it could be that the value is not retrieved properly
            let interest_rate: i128 = 12000;
            let interest_amount: i128 = borrowed_as_int * interest_rate;
            let new_borrowed: i128 = borrowed_as_int + interest_amount;
            // Insert the new value to the loan_map
            loan_map.set(Symbol::new(&e, "borrowed"), new_borrowed.into_val(&e));
            // Transform the Map back to Val
            let new_loan: Val = loan_map.into_val(&e);
            // Set it to storage
            e.storage().persistent().set(&key, &new_loan);
            e.storage().persistent().extend_ttl(&key, POSITIONS_LIFETIME_THRESHOLD, POSITIONS_BUMP_AMOUNT);  
            // TODO: this should also invoke the pools and update the amounts lended to liabilities.
        }
    }
    }