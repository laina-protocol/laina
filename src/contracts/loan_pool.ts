import * as Client from 'loan_pool';
import { rpcUrl } from './util';

export default new Client.Client({
  ...Client.networks.testnet,
  rpcUrl,
  allowHttp: true,
  publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
});
