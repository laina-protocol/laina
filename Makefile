build:
	cargo build --release --target wasm32-unknown-unknown -p reflector-oracle-mock
	cargo build --release --target wasm32-unknown-unknown -p reflector-oracle
	cargo build --release --target wasm32-unknown-unknown -p loan_pool
	cargo build --release --target wasm32-unknown-unknown -p loan_manager
