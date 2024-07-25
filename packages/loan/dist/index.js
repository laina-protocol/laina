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
        contractId: "CBINKAB5BSAGFV73MDIJ5L35LGLEOAM5YBULEVSSK33FHOFW57KGPRZV",
    }
};
export const Errors = {};
export class Client extends ContractClient {
    options;
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABQAAAAAAAAAEcG9vbAAAABMAAAAAAAAACmNvbGxhdGVyYWwAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAARY29sbGF0ZXJhbF9hbW91bnQAAAAAAAALAAAAAAAAAAVvd25lcgAAAAAAABMAAAAA"]), options);
        this.options = options;
    }
    fromJSON = {
        initialize: (this.txFromJSON)
    };
}
