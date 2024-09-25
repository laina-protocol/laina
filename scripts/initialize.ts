import 'dotenv/config';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import crypto from 'crypto';
import { CURRENCIES, type Currency } from '../currencies';

// Load environment variables starting with PUBLIC_ into the environment,
// so we don't need to specify duplicate variables in .env
for (const key in process.env) {
  if (key.startsWith('PUBLIC_')) {
    process.env[key.substring(7)] = process.env[key];
  }
}

// The stellar-sdk Client requires (for now) a defined public key. These are
// the Genesis accounts for each of the "typical" networks, and should work as
// a valid, funded network account.
const GENESIS_ACCOUNTS = {
  public: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7',
  testnet: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  futurenet: 'GADNDFP7HM3KFVHOQBBJDBGRONMKQVUYKXI6OYNDMS2ZIK7L6HA3F2RF',
  standalone: 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI',
};

// @ts-ignore
const GENESIS_ACCOUNT = GENESIS_ACCOUNTS[process.env.SOROBAN_NETWORK] ?? GENESIS_ACCOUNTS.testnet;

console.log('######################Initializing ########################');

// variable for later setting pinned version of soroban in "$(dirname/target/bin/soroban)"
const soroban = 'soroban';

// Function to execute and log shell commands
function exe(command: string) {
  console.log(command);
  execSync(command, { stdio: 'inherit' });
}

function fundAll() {
  exe(`${soroban} keys generate ${process.env.SOROBAN_ACCOUNT}`);
  exe(`${soroban} keys fund ${process.env.SOROBAN_ACCOUNT}`);
}

function buildAll() {
  exe(`rm -f ./target/wasm32-unknown-unknown/release/*.wasm`);
  exe(`rm -f ./target/wasm32-unknown-unknown/release/*.d`);
  exe(`make build`);
}

function filenameNoExtension(filename: string) {
  return path.basename(filename, path.extname(filename));
}

function deploy(wasm: string) {
  exe(
    `(${soroban} contract deploy --wasm ${wasm} --ignore-checks) > ./.soroban/contract-ids/${filenameNoExtension(wasm)}.txt`,
  );
}

/** Deploy loan_manager contract as there will only be one for all the pools.
 * Loan_manager is used as a factory for the loan_pools.
 */
function deployLoanManager() {
  const contractsDir = `.soroban/contract-ids`;
  mkdirSync(contractsDir, { recursive: true });

  deploy(`./target/wasm32-unknown-unknown/release/loan_manager.wasm`);
}

/* Install a contract */
function install(wasm: string) {
  exe(
    `(${soroban} contract install --wasm ${wasm} --ignore-checks) > ./.soroban/contract-wasm-hash/${filenameNoExtension(wasm)}.txt`,
  );
}

/** Install all contracts and save their wasm hashes to .soroban */
function installAll() {
  const contractsDir = `./.soroban/contract-wasm-hash`;
  mkdirSync(contractsDir, { recursive: true });

  const wasmFiles = readdirSync(`./target/wasm32-unknown-unknown/release`).filter((file) => file.endsWith('.wasm'));

  wasmFiles.forEach((wasmFile) => {
    install(`./target/wasm32-unknown-unknown/release/${wasmFile}`);
  });
}

/** Deploy liquidity pools using the loan-manager as a factory contract */
function deployLoanPools() {
  // Read values of parameters
  const loanManagerId = execSync(`cat ./.soroban/contract-ids/loan_manager.txt`).toString().trim();
  const wasmHash = execSync(`cat ./.soroban/contract-wasm-hash/loan_pool.txt`).toString().trim();

  CURRENCIES.forEach(({ tokenContractAddress, ticker, loanPoolName }: Currency) => {
    const salt = crypto.randomBytes(32).toString('hex');
    exe(
      `${soroban} contract invoke \
--id ${loanManagerId} \
--source-account alice \
--network testnet \
-- deploy_pool \
--wasm_hash ${wasmHash} \
--salt ${salt} \
--token_address ${tokenContractAddress} \
--ticker ${ticker} \
--liquidation_threshold 800000 \
| tr -d '"' > ./.soroban/contract-ids/${loanPoolName}.txt`,
    );
  });
}

function bind(contract: string) {
  const filenameNoExt = filenameNoExtension(contract);
  exe(
    `${soroban} contract bindings typescript --contract-id $(cat ${contract}) --output-dir ./packages/${filenameNoExt} --overwrite`,
  );
}

function bindAll() {
  const contractIdsDir = `./.soroban/contract-ids`;
  const contractFiles = readdirSync(contractIdsDir);

  contractFiles.forEach((contractFile) => {
    const contractPath = path.join(contractIdsDir, contractFile);
    if (statSync(contractPath).size > 0) {
      // Check if file is not empty
      bind(contractPath);
    }
  });
}

function importContract(contract: string) {
  const filenameNoExt = filenameNoExtension(contract);
  const outputDir = `./src/contracts/`;
  mkdirSync(outputDir, { recursive: true });

  /* eslint-disable quotes */
  /* eslint-disable no-constant-condition */
  const importContent =
    `import * as Client from '${filenameNoExt}';\n` +
    `import { rpcUrl } from './util';\n\n` +
    `export const contractId = Client.networks.${process.env.SOROBAN_NETWORK}.contractId;\n\n` +
    `export const contractClient = new Client.Client({\n` +
    `  ...Client.networks.${process.env.SOROBAN_NETWORK},\n` +
    `  rpcUrl,\n` +
    `${process.env.SOROBAN_NETWORK === 'local' || 'standalone' ? `  allowHttp: true,\n` : null}` +
    `  publicKey: '${GENESIS_ACCOUNT}', \n` +
    `}); \n`;
  /* eslint-disable no-constant-condition */
  /* eslint-enable quotes */

  const outputPath = `${outputDir}/${filenameNoExt}.ts`;
  writeFileSync(outputPath, importContent);
  console.log(`Created import for ${filenameNoExt}`);
}

function importAll() {
  const contractIdsDir = `./.soroban/contract-ids`;
  const contractFiles = readdirSync(contractIdsDir);

  contractFiles.forEach((contractFile) => {
    const contractPath = path.join(contractIdsDir, contractFile);
    if (statSync(contractPath).size > 0) {
      // Check if file is not empty
      importContract(contractPath);
    }
  });
}

// Calling the functions (equivalent to the last part of your bash script)
fundAll();
buildAll();
deployLoanManager();
installAll();
deployLoanPools();
bindAll();
importAll();
