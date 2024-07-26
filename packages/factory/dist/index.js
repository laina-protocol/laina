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
        contractId: "CD3E6DIL7PH2HMMCJ7DS6B4X35QUPHN645BDEM6QCYC4TVJJZDMA3CGF",
    }
};
export const Errors = {};
export class Client extends ContractClient {
    options;
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAXtEZXBsb3kgdGhlIGNvbnRyYWN0IFdhc20gYW5kIGFmdGVyIGRlcGxveW1lbnQgaW52b2tlIHRoZSBpbml0IGZ1bmN0aW9uCm9mIHRoZSBjb250cmFjdCB3aXRoIHRoZSBnaXZlbiBhcmd1bWVudHMuCgpUaGlzIGhhcyB0byBiZSBhdXRob3JpemVkIGJ5IGBkZXBsb3llcmAgKHVubGVzcyB0aGUgYERlcGxveWVyYCBpbnN0YW5jZQppdHNlbGYgaXMgdXNlZCBhcyBkZXBsb3llcikuIFRoaXMgd2F5IHRoZSB3aG9sZSBvcGVyYXRpb24gaXMgYXRvbWljCmFuZCBpdCdzIG5vdCBwb3NzaWJsZSB0byBmcm9udHJ1biB0aGUgY29udHJhY3QgaW5pdGlhbGl6YXRpb24uCgpSZXR1cm5zIHRoZSBjb250cmFjdCBhZGRyZXNzIGFuZCByZXN1bHQgb2YgdGhlIGluaXQgZnVuY3Rpb24uAAAAAAZkZXBsb3kAAAAAAAUAAAAAAAAACXdhc21faGFzaAAAAAAAA+4AAAAgAAAAAAAAAARzYWx0AAAD7gAAACAAAAAAAAAAB2luaXRfZm4AAAAAEQAAAAAAAAAPdG9rZW5fd2FzbV9oYXNoAAAAA+4AAAAgAAAAAAAAAA50b2tlbl9jb250cmFjdAAAAAAAEwAAAAEAAAAT"]), options);
        this.options = options;
    }
    fromJSON = {
        deploy: (this.txFromJSON)
    };
}
