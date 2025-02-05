# Development

This document describes how to develop the application on your local computer.

## Prerequirements

Tools you will need:

- [Rust & Cargo](https://www.rust-lang.org/learn/get-started)
- [Node.js - check version from .nvmrc](https://nodejs.org/en)
- [Docker & docker-compose](https://docs.docker.com/compose/install/)
- [Diesel CLI](https://diesel.rs/guides/getting-started#installing-diesel-cli)

## Rust Smart Contracts

Build the contracts. This also compiles the liquidation bot.
Look in `Makefile` for commands for compiling a specific binary.

```
make Build
```

To deploy new smart contracts to testnet, run the `scripts/initialize.ts` script:

```
npm run init
```

To update the code of already initialized contracts in-place, use the `scripts/upgrade.ts` script.

```
npm run upgrade
```

Run tests

```
cargo test
```

Format code

```
cargo fmt
```

## TypeScript & React DApp

Start the development server

```
npm run dev
```

Run linter

```
npm run lint
```

Run formatter

```
npm run format
```

## Rust Liquidation Bot

Start the development database. You can use the `-d` flag if you want to detach your terminal from the output.

```
docker-compose up
```

Run database migrations

```
cd liquidation-bot
diesel migration run
```

Start liquidation-bot

```
cargo run
```
