-- Your SQL goes here
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  borrowed_amount BIGINT NOT NULL,
  borrowed_from TEXT NOT NULL,
  borrower TEXT NOT NULL,
  collateral_amount BIGINT NOT NULL,
  collateral_from TEXT NOT NULL,
  unpaid_interest BIGINT NOT NULL
)
