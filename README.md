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
- `npm install`
- `npm run dev`

## Formatting the code

Lint web code

```bash
npm run check
```

Format Rust code

```bash
cargo fmt
```
