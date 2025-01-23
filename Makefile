build:
	mkdir -p target/wasm32-unknown-unknown/release
	curl -L https://github.com/reflector-network/reflector-contract/releases/download/v4.1.0_reflector-oracle_v4.1.0.wasm/reflector-oracle_v4.1.0.wasm -o ./target/wasm32-unknown-unknown/release/reflector_oracle.wasm
	cargo build --release --target wasm32-unknown-unknown -p reflector-oracle-mock
	cargo build --release --target wasm32-unknown-unknown -p loan_pool
	cargo build --release --target wasm32-unknown-unknown -p loan_manager
	cargo build --release -p liquidation-bot
