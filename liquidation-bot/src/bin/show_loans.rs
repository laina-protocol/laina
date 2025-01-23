use self::models::*;
use diesel::prelude::*;
use liquidation_bot::*;

fn main() {
    use self::schema::loans::dsl::*;

    let connection = &mut establish_connection();
    let results = loans
        .limit(5)
        .select(Loan::as_select())
        .load(connection)
        .expect("Error loading loans");

    println!("Displaying {} loans", results.len());
    for loan in results {
        println!("{}", loan.id);
    }
}
