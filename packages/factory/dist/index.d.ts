import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CAWWK5LH33NEWYJDNI4Q7Y5QUO6VPK5UZOVDLXANUSC5Z7DBVF6AVUED";
    };
};
export declare const Errors: {};
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
    deploy: ({ wasm_hash, salt, init_fn, token_wasm_hash, token_contract }: {
        wasm_hash: Buffer;
        salt: Buffer;
        init_fn: string;
        token_wasm_hash: Buffer;
        token_contract: string;
    }, options?: {
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
    }) => Promise<AssembledTransaction<string>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        deploy: (json: string) => AssembledTransaction<string>;
    };
}
