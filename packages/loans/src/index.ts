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
    contractId: "CCR7ARWZN4WODMEWVTRCMPPJJQKE2MBKUPJBSYWCDEOT3OLBPAPEGLPH",
  }
} as const

export type LoansDataKey = {tag: "Loan", values: readonly [string]} | {tag: "Addresses", values: void};

export const Errors = {
  
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({user, borrowed, borrowed_from, collateral, collateral_from}: {user: string, borrowed: i128, borrowed_from: string, collateral: i128, collateral_from: string}, options?: {
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
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a add_interest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_interest: (options?: {
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
  }) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABQAAAAAAAAAEdXNlcgAAABMAAAAAAAAACGJvcnJvd2VkAAAACwAAAAAAAAANYm9ycm93ZWRfZnJvbQAAAAAAABMAAAAAAAAACmNvbGxhdGVyYWwAAAAAAAsAAAAAAAAAD2NvbGxhdGVyYWxfZnJvbQAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAMYWRkX2ludGVyZXN0AAAAAAAAAAA=",
        "AAAAAgAAAAAAAAAAAAAADExvYW5zRGF0YUtleQAAAAIAAAABAAAAAAAAAARMb2FuAAAAAQAAABMAAAAAAAAAAAAAAAlBZGRyZXNzZXMAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        add_interest: this.txFromJSON<null>
  }
}