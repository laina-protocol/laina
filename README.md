# Soroban Project

## Project Structure

This repository uses the recommended structure for a Soroban project:

```text
.
├── contracts
│   └── hello_world
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

# Soroban Frontend in Astro

## Getting Started

- `cp .env.example .env`

Create a stellar account and store it in .env

- `stellar keys generate <name>`
- Change SOROBAN_ACCOUNT in .env to the output of `stellar keys address <name>`
- Change SOROBAN_SECRET_KEY in .env to the output of `stellar keys show <name>`

Initialize contracts

- `npm run init`

Install frontend dependencies and start the dev-server

- `npm install`
- `npm run dev`

## Formatting the code

Lint web code

```bash
npm run lint
```

Format web code

```bash
npm run format
```

Format Rust code

```bash
cargo fmt
```

# Architecture

## Lending flow

```mermaid
sequenceDiagram
    box Front-end
    participant UI
    end
    box Laina Contracts
    participant LendingPool
    participant LoanManager
    end
    box Oracle Contract
    participant PriceOracle
    end

    UI->>LendingPool: get_balance()
    LendingPool-->>UI: Balance

    UI->>LoanManager: get_price()
    LoanManager->>PriceOracle: last_price(Token)
    PriceOracle-->>LoanManager: PriceData
    LoanManager-->>UI: Price

    UI->>LendingPool: get_interest_rate()
    LendingPool->>LoanManager: get_interest_rate(Pool)
    LoanManager-->>LendingPool: Interest rate
    LendingPool-->>UI: Interest rate

    UI->>LendingPool: deposit()
    LendingPool-->>UI: OK/Error
```

## Borrow flow

```mermaid
sequenceDiagram
    box Front-end
    participant UI
    end
    box Laina Contracts
    participant LendingPool
    participant LoanManager
    end
    box Oracle Contracts
    participant PriceOracle
    end

    UI->>LendingPool: get_available_balance()
    LendingPool-->>UI: Available Balance

    UI->>LendingPool: get_interest_rate()
    LendingPool->>LoanManager: get_interest_rate(Pool)
    LoanManager-->>UI: Interest rate

    UI->>LoanManager: get_price()
    LoanManager->>PriceOracle: last_price(Token)
    PriceOracle-->>LoanManager: PriceData
    LoanManager-->>UI: Price

    UI->>LoanManager: init_loan(token_borrow, borrow_amount, token_collat, collat_amount)
    loop calculate_health_factor()
        LoanManager->>PriceOracle: last_price(token_borrow)
        PriceOracle-->>LoanManager: PriceData
        LoanManager->>PriceOracle: last_price(token_collat)
        PriceOracle-->>LoanManager: PriceData
        LoanManager->>LoanManager: Check that health-factor is over minimum threshold
    end
    LoanManager-->>LendingPool: deposit_collateral()
    LoanManager-->>LendingPool: borrow()
    LoanManager-->>UI: OK/Error
```

## Liquidate flow

```mermaid
sequenceDiagram
    box Front-end
    participant UI
    end
    box Laina Contracts
    participant LendingPool
    participant LoanManager
    end
    box Oracle Contracts
    participant PriceOracle
    end

    UI->>LoanManager: get_undercol_loans()
    loop calculate_health_factor()
        LoanManager->>PriceOracle: last_price(token_borrow)
        PriceOracle-->>LoanManager: PriceData
        LoanManager->>PriceOracle: last_price(token_collat)
        PriceOracle-->>LoanManager: PriceData
        LoanManager->>LoanManager: Check that health-factor is under minimum threshold
    end
    LoanManager-->>UI: Available Loans

    UI->>LoanManager: liquidate_loan(token_borrow, amount)
    LoanManager-->>UI: OK/Error
    LoanManager-->>UI: if OK: transfer(token_collat, amount+liquidation_bonus)

```
