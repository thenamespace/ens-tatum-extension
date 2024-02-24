import { Network } from '@tatumio/tatum';
import {
  Address,
  PrivateKeyAccount,
  PublicClient,
  WalletClient,
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia } from 'viem/chains';
import { EnsExtensionOptions } from '../extension';

declare var window: any;

export class Contract {
  private static _publicClient: PublicClient;
  private static _walletClient: WalletClient;
  private static _chain: any;
  private static _accountAdress?: `0x${string}`;
  private static _account: `0x${string}` | PrivateKeyAccount;
  private static _contract: Contract;
  private static _network: Network;

  private constructor(network?: Network, options?: EnsExtensionOptions) {
    if (!network) throw new Error('Network must be provided.');
    if (!options) throw new Error('Options must be provided.');

    if (!options.privateConnection && !options.publicConnection) {
      throw new Error('Private or public connection details must be provided');
    }

    // set the network
    Contract._network = network;
    const chain =
      Contract._network === Network.ETHEREUM
        ? mainnet
        : Contract._network === Network.ETHEREUM_SEPOLIA
        ? sepolia
        : null;

    if (chain === null) throw new Error(`EnsExtension only supports ${Network.ETHEREUM} network`);

    Contract._chain = chain;

    // set the clients
    Contract._publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const transport = options.privateConnection
      ? http(options.privateConnection.rpcUrl)
      : custom(window.ethereum);
    Contract._walletClient = createWalletClient({
      chain,
      transport,
    });

    // set the account
    Contract._account = options.privateConnection
      ? privateKeyToAccount(options.privateConnection.accountKey)
      : (options.publicConnection?.accountAddress as `0x${string}`);
  }

  static get(network?: Network, options?: EnsExtensionOptions): Contract {
    if (this._contract) return this._contract;

    Contract._contract = new Contract(network, options);
    return Contract._contract;
  }

  setAccount(options?: EnsExtensionOptions) {
    if (options?.privateConnection) {
      Contract._walletClient = createWalletClient({
        chain: Contract._chain,
        transport: http(options.privateConnection.rpcUrl),
      });
    }
  }

  get network() {
    return Contract._network;
  }

  async read<T>({
    address,
    functionName,
    args,
    abi,
  }: {
    address: Address;
    functionName: string;
    args: any[];
    abi: any;
  }): Promise<T> {
    return Contract._publicClient.readContract({
      functionName,
      args,
      abi,
      address,
    }) as Promise<T>;
  }

  async write({
    address,
    functionName,
    args,
    value,
    abi,
  }: {
    address: Address;
    functionName: string;
    args: any[];
    value?: bigint;
    abi: any;
  }) {
    const contractParams = {
      abi,
      address,
      functionName,
      args,
      account: Contract._account,
      value: value,
    };
    const { request } = await Contract._publicClient.simulateContract(contractParams);

    const txn = await Contract._walletClient.writeContract(request);
    return await Contract._publicClient.waitForTransactionReceipt({
      hash: txn,
    });
  }
}
