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
        contractId: "CAEVALPZSSNGFKVTHKUGV7PDPAQN5XFEBJDC6JPNJHU6HFTEPPHNAZE4",
    }
};
export const Errors = {};
export class Client extends ContractClient {
    options;
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABQAAAAAAAAAEdXNlcgAAABMAAAAAAAAACGJvcnJvd2VkAAAACwAAAAAAAAANYm9ycm93ZWRfZnJvbQAAAAAAABMAAAAAAAAACmNvbGxhdGVyYWwAAAAAAAsAAAAAAAAAD2NvbGxhdGVyYWxfZnJvbQAAAAATAAAAAA==",
            "AAAAAgAAAAAAAAAAAAAADExvYW5zRGF0YUtleQAAAAEAAAABAAAAAAAAAARMb2FuAAAAAQAAABM="]), options);
        this.options = options;
    }
    fromJSON = {
        initialize: (this.txFromJSON)
    };
}
