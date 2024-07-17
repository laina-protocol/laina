import 'dotenv/config'
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
// import crypto from 'crypto'

// Load environment variables starting with PUBLIC_ into the environment,
// so we don't need to specify duplicate variables in .env
for (const key in process.env) {
  if (key.startsWith('PUBLIC_')) {
    process.env[key.substring(7)] = process.env[key]
  }
}

// The stellar-sdk Client requires (for now) a defined public key. These are
// the Genesis accounts for each of the "typical" networks, and should work as
// a valid, funded network account.
const GENESIS_ACCOUNTS = {
  public: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7',
  testnet: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  futurenet: 'GADNDFP7HM3KFVHOQBBJDBGRONMKQVUYKXI6OYNDMS2ZIK7L6HA3F2RF',
  standalone: 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI'
}

console.log('###################### Initializing ########################')

// Get dirname (equivalent to the Bash version)
const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// variable for later setting pinned version of soroban in "$(dirname/target/bin/soroban)"
const soroban = 'soroban'

// Function to execute and log shell commands
function exe (command) {
  console.log(command)
  execSync(command, { stdio: 'inherit' })
}

function fundAll () {
  exe(`${soroban} keys generate ${process.env.SOROBAN_ACCOUNT}`)
  exe(`${soroban} keys fund ${process.env.SOROBAN_ACCOUNT}`)
}

function buildAll () {
  exe(`rm -f ${dirname}/target/wasm32-unknown-unknown/release/*.wasm`)
  exe(`rm -f ${dirname}/target/wasm32-unknown-unknown/release/*.d`)
  exe(`${soroban} contract build --package token`) // Token has to be built before others.
  exe(`${soroban} contract build --package loan_pool`) // Then loan_pool as loan uses it
  exe(`${soroban} contract build`)
}

function filenameNoExtension (filename) {
  return path.basename(filename, path.extname(filename))
}

function deploy (wasm) {
  exe(`(${soroban} contract deploy --wasm ${wasm} --ignore-checks) > ${dirname}/.soroban/contract-ids/${filenameNoExtension(wasm)}.txt`)
}

function deployFactory () {
  const contractsDir = `${dirname}/.soroban/contract-ids`
  mkdirSync(contractsDir, { recursive: true })

  // try to deploy only factory contract that will be used to generate others. Maybe later it has to be some sort of admin contract?
  deploy(`${dirname}/target/wasm32-unknown-unknown/release/factory.wasm`)

  // const wasmFiles = readdirSync(`${dirname}/target/wasm32-unknown-unknown/release`).filter(file => file.endsWith('.wasm'));

  // wasmFiles.forEach(wasmFile => {
  // deploy(`${dirname}/target/wasm32-unknown-unknown/release/${wasmFile}`);
  // });
}

function install (wasm) {
  // Contract installer
  exe(`(${soroban} contract install --wasm ${wasm} --ignore-checks) > ${dirname}/.soroban/contract-wasm-hash/${filenameNoExtension(wasm)}.txt`)
}

function installAll () {
  // Install all contracts except factory and save the wasm hash to .soroban
  const contractsDir = `${dirname}/.soroban/contract-wasm-hash`
  mkdirSync(contractsDir, { recursive: true })

  const wasmFiles = readdirSync(`${dirname}/target/wasm32-unknown-unknown/release`)
    .filter(file => file.endsWith('.wasm'))
    .filter(file => file !== 'factory.wasm')

  wasmFiles.forEach(wasmFile => {
    install(`${dirname}/target/wasm32-unknown-unknown/release/${wasmFile}`)
  })
}

function deployLpWithFactory () {
  // Deploy liquidity pool with factory contract

  // Read values of parameters
  const contractId = execSync(`cat ${dirname}/.soroban/contract-ids/factory.txt`).toString().trim()
  const wasmHash = execSync(`cat ${dirname}/.soroban/contract-wasm-hash/loan_pool.txt`).toString().trim()
  const tokenBytes = execSync(`cat ${dirname}/.soroban/contract-wasm-hash/token.txt`).toString().trim()

  // Generate salt
  // const salt = crypto.randomBytes(16).toString('hex');
  const salt = 54

  // construct init_args, for now hardcoded for native testnet XLM
  const initArgsObject = {
    vec: [
      { bytes: tokenBytes },
      { address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC' }
    ]
  }

  const initArgs = JSON.stringify(initArgsObject)

  exe(`(${soroban} contract invoke --id ${contractId} --source-account alice --network testnet -- deploy --deployer alice --wasm_hash ${wasmHash} --salt ${salt} --init_fn initialize --init_args '${initArgs}') | tr -d '"' > ${dirname}/.soroban/contract-ids/loan_pool.txt`)
}

function bind (contract) {
  const filenameNoExt = filenameNoExtension(contract)
  exe(`${soroban} contract bindings typescript --contract-id $(cat ${contract}) --output-dir ${dirname}/packages/${filenameNoExt} --overwrite`)
}

function bindAll () {
  const contractIdsDir = `${dirname}/.soroban/contract-ids`
  const contractFiles = readdirSync(contractIdsDir)

  contractFiles.forEach(contractFile => {
    const contractPath = path.join(contractIdsDir, contractFile)
    if (statSync(contractPath).size > 0) {
      // Check if file is not empty
      bind(contractPath)
    }
  })
}

function importContract (contract) {
  const filenameNoExt = filenameNoExtension(contract)
  const outputDir = `${dirname}/src/contracts/`
  mkdirSync(outputDir, { recursive: true })

  /* eslint-disable quotes */
  const importContent =
    `import * as Client from '${filenameNoExt}';\n` +
    `import { rpcUrl } from './util';\n\n` +
    `export default new Client.Client({\n` +
    `  ...Client.networks.${process.env.SOROBAN_NETWORK},\n` +
    `  rpcUrl,\n` +
    `${process.env.SOROBAN_NETWORK === 'local' || 'standalone' ? `  allowHttp: true,\n` : null}` +
    `  publicKey: '${GENESIS_ACCOUNTS[process.env.SOROBAN_NETWORK]}',\n` +
    `});\n`
  /* eslint-enable quotes*/
  
  const outputPath = `${outputDir}/${filenameNoExt}.ts`
  writeFileSync(outputPath, importContent)
  console.log(`Created import for ${filenameNoExt}`)
}

function importAll () {
  const contractIdsDir = `${dirname}/.soroban/contract-ids`
  const contractFiles = readdirSync(contractIdsDir)

  contractFiles.forEach(contractFile => {
    const contractPath = path.join(contractIdsDir, contractFile)
    if (statSync(contractPath).size > 0) {
      // Check if file is not empty
      importContract(contractPath)
    }
  })
}

// Calling the functions (equivalent to the last part of your bash script)
fundAll()
buildAll()
deployFactory()
installAll()
deployLpWithFactory()
bindAll()
importAll()
