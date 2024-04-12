import { EvmTxPayload, EvmWalletProvider } from '@tatumio/evm-wallet-provider';
import { EvmRpc, JsonRpcResponse, MetaMask, Network, TxPayload } from '@tatumio/tatum';
import { Address, Hash } from 'viem';

export type EvmPayload = Omit<EvmTxPayload, 'to' | 'data'>;

export type WalletProvider = EvmWalletProvider | MetaMask;

export class Contract {
  private static _contract: Contract;
  private static _rpc: EvmRpc;
  private static _network: Network;
  private static _walletProvider: WalletProvider;
  private _evmPayload: EvmPayload;

  private constructor(rpc: EvmRpc, network: Network) {
    Contract._rpc = rpc;
    Contract._network = network;
  }

  static create(rpc: EvmRpc, network: Network): Contract {
    Contract._contract = new Contract(rpc, network);
    return Contract._contract;
  }

  static get instance() {
    return Contract._contract;
  }

  static get network() {
    return Contract._network;
  }

  get evmPayload() {
    return this._evmPayload;
  }

  setWalletProvider(walletProvider: WalletProvider) {
    Contract._walletProvider = walletProvider;
  }

  setEvmPayload(evmPayload: EvmPayload) {
    this._evmPayload = evmPayload;
  }

  async read(payload: TxPayload): Promise<JsonRpcResponse<string>> {
    return Contract._rpc.call(payload);
  }

  async write(to: Address, data: Hash): Promise<string> {
    return Contract._walletProvider.signAndBroadcast({ to, data, ...this._evmPayload });
  }
}
