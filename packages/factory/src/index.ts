import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAWWK5LH33NEWYJDNI4Q7Y5QUO6VPK5UZOVDLXANUSC5Z7DBVF6AVUED",
  }
} as const

export const Errors = {
  
}

export interface Client {
  /**
   * Construct and simulate a deploy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.   *
   * Deploy the contract Wasm and after deployment invoke the init function
   * of the contract with the given arguments.
   * 
   * This has to be authorized by `deployer` (unless the `Deployer` instance
   * itself is used as deployer). This way the whole operation is atomic
   * and it's not possible to frontrun the contract initialization.
   * 
   * Returns the contract address and result of the init function.
   */
  deploy: ({wasm_hash, salt, init_fn, token_wasm_hash, token_contract}: {wasm_hash: Buffer, salt: Buffer, init_fn: string, token_wasm_hash: Buffer, token_contract: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

}
export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAXtEZXBsb3kgdGhlIGNvbnRyYWN0IFdhc20gYW5kIGFmdGVyIGRlcGxveW1lbnQgaW52b2tlIHRoZSBpbml0IGZ1bmN0aW9uCm9mIHRoZSBjb250cmFjdCB3aXRoIHRoZSBnaXZlbiBhcmd1bWVudHMuCgpUaGlzIGhhcyB0byBiZSBhdXRob3JpemVkIGJ5IGBkZXBsb3llcmAgKHVubGVzcyB0aGUgYERlcGxveWVyYCBpbnN0YW5jZQppdHNlbGYgaXMgdXNlZCBhcyBkZXBsb3llcikuIFRoaXMgd2F5IHRoZSB3aG9sZSBvcGVyYXRpb24gaXMgYXRvbWljCmFuZCBpdCdzIG5vdCBwb3NzaWJsZSB0byBmcm9udHJ1biB0aGUgY29udHJhY3QgaW5pdGlhbGl6YXRpb24uCgpSZXR1cm5zIHRoZSBjb250cmFjdCBhZGRyZXNzIGFuZCByZXN1bHQgb2YgdGhlIGluaXQgZnVuY3Rpb24uAAAAAAZkZXBsb3kAAAAAAAUAAAAAAAAACXdhc21faGFzaAAAAAAAA+4AAAAgAAAAAAAAAARzYWx0AAAD7gAAACAAAAAAAAAAB2luaXRfZm4AAAAAEQAAAAAAAAAPdG9rZW5fd2FzbV9oYXNoAAAAA+4AAAAgAAAAAAAAAA50b2tlbl9jb250cmFjdAAAAAAAEwAAAAEAAAAT" ]),
      options
    )
  }
  public readonly fromJSON = {
    deploy: this.txFromJSON<string>
  }
}