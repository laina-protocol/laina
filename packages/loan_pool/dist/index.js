import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CDTXQ464XAAOCDT3CFH6BEPBNTHAP4H4SZ2R3W4ZEEYWTRU4GWXUPV7J",
    }
};
export const Errors = {};
export class Client extends ContractClient {
    options;
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAPdG9rZW5fd2FzbV9oYXNoAAAAA+4AAAAgAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAA",
            "AAAAAAAAAAAAAAAIc2hhcmVfaWQAAAAAAAAAAQAAABM=",
            "AAAAAAAAAAAAAAAHZGVwb3NpdAAAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAAAAAAAAId2l0aGRyYXcAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+0AAAACAAAACwAAAAs=",
            "AAAAAAAAAAAAAAAUZ2V0X2NvbnRyYWN0X2JhbGFuY2UAAAAAAAAAAQAAAAs="]), options);
        this.options = options;
    }
    fromJSON = {
        initialize: (this.txFromJSON),
        share_id: (this.txFromJSON),
        deposit: (this.txFromJSON),
        withdraw: (this.txFromJSON),
        get_contract_balance: (this.txFromJSON)
    };
}
