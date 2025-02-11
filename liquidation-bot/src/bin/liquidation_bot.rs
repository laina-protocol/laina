use core::time;
use std::thread;

use self::models::*;
use diesel::prelude::*;
use liquidation_bot::*;

const SLEEP_TIME_SECONDS: u64 = 10;

fn main() {
    let connection = &mut establish_connection();

    loop {
        get_new_loans();
        get_prices();
        find_liquidateable(connection);
        attempt_liquidating();

        println!("Sleeping for {SLEEP_TIME_SECONDS} seconds.");
        thread::sleep(time::Duration::from_secs(SLEEP_TIME_SECONDS))
    }
}

fn get_new_loans() {
    // TODO: fetch loans from Loan Manager
    // TODO: push new loans to the DB.
    println!("Fetching new loans from Loan Manager.")
}

fn get_prices() {
    // TODO: fetch and return token prices from CoinGecko
    println!("Getting prices from CoinGecko.")
}

fn find_liquidateable(connection: &mut PgConnection /*prices: Prices*/) {
    use self::schema::loans::dsl::*;

    let results = loans
        .limit(5)
        .select(Loan::as_select())
        .load(connection)
        .expect("Error loading loans");

    println!("Displaying {} loans.", results.len());
    for loan in results {
        println!("{}", loan.id);
    }

    // TODO: calculate the health of each loan and return the unhealthy ones
}

fn attempt_liquidating(/* unhealthy_loans: Vec<Loan> */) {
    // TODO: attempt to liquidate unhealthy loans
    // TODO: update the loan in DB with the new values
}
