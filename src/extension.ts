import {
  EVM_BASED_NETWORKS,
  FeeEvm,
  ITatumSdkContainer,
  Network,
  TatumConfig,
  TatumSdkExtension,
} from '@tatumio/tatum';
import {
  Address,
  PublicClient,
  WalletClient,
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';
declare var window: any;

export interface EnsExtensionOptions {
  accountAddress: string;
}

export abstract class EnsExtension extends TatumSdkExtension {
  supportedNetworks: Network[] = EVM_BASED_NETWORKS;
  protected readonly fee: FeeEvm;
  protected readonly sdkConfig: TatumConfig;
  protected readonly publicClient: PublicClient;
  protected readonly walletClient: WalletClient;
  protected contract: Address;
  protected account: Address;

  constructor(tatumSdkContainer: ITatumSdkContainer, options: EnsExtensionOptions) {
    super(tatumSdkContainer);
    this.fee = this.tatumSdkContainer.get(FeeEvm);
    this.sdkConfig = this.tatumSdkContainer.getConfig();

    const network = tatumSdkContainer.getConfig().network;
    const chain =
      network === Network.ETHEREUM ? mainnet : network === Network.ETHEREUM_SEPOLIA ? sepolia : null;

    if (chain === null) throw new Error(`EnsExtension only supports ${Network.ETHEREUM} network`);

    this.publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    this.walletClient = createWalletClient({
      chain,
      transport: custom(window.ethereum),
    });

    this.account = options.accountAddress as Address;
  }

  protected async read<T>({
    functionName,
    args,
    abi,
  }: {
    functionName: string;
    args: any[];
    abi: any;
  }): Promise<T> {
    return this.publicClient.readContract({
      functionName,
      args,
      account: this.account,
      abi,
      address: this.contract,
    }) as Promise<T>;
  }

  protected async write({
    functionName,
    args,
    value,
    abi,
  }: {
    functionName: string;
    args: any[];
    value?: bigint;
    abi: any;
  }) {
    const contractParams = {
      abi,
      address: this.contract,
      functionName,
      args,
      account: this.account,
      value: value,
    };

    const { request } = await this.publicClient.simulateContract(contractParams);

    return this.walletClient.writeContract(request as any);
  }

  init(): Promise<void> {
    if (this.sdkConfig.network === Network.ETHEREUM || this.sdkConfig.network === Network.ETHEREUM_SEPOLIA) {
      console.log(`[EnsExtension] initialised`);
      return Promise.resolve(undefined);
    }
    throw new Error(`EnsExtension only supports ${Network.ETHEREUM} network`);
  }

  destroy(): Promise<void> {
    console.log(`[EnsExtension] disposed`);
    return Promise.resolve(undefined);
  }
}
