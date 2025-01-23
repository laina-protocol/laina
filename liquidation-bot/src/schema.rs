// @generated automatically by Diesel CLI.

diesel::table! {
    loans (id) {
        id -> Int4,
        borrowed_amount -> Int8,
        borrowed_from -> Text,
        borrower -> Text,
        collateral_amount -> Int8,
        collateral_from -> Text,
        unpaid_interest -> Int8,
    }
}
