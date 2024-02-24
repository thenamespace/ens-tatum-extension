import {
  EVM_BASED_NETWORKS,
  ITatumSdkContainer,
  Network,
  TatumConfig,
  TatumSdkExtension,
} from '@tatumio/tatum';
import { Contract } from './ens-contracts/contract';
import { EnsController } from './ens-contracts/controller';

export interface EnsExtensionOptions {
  publicConnection?: {
    accountAddress: `0x${string}`;
  };
  privateConnection?: {
    accountKey: `0x${string}`;
    rpcUrl: string;
  };
}

export class EnsExtension extends TatumSdkExtension {
  supportedNetworks: Network[] = EVM_BASED_NETWORKS;
  private readonly sdkConfig: TatumConfig;
  private readonly contract: Contract;

  constructor(tatumSdkContainer: ITatumSdkContainer, options: EnsExtensionOptions) {
    super(tatumSdkContainer);
    this.sdkConfig = this.tatumSdkContainer.getConfig();
    this.contract = Contract.get(tatumSdkContainer.getConfig().network, options);
  }

  public switchAccount(options: EnsExtensionOptions) {
    this.contract.setAccount(options);
  }

  public getController(): EnsController {
    return EnsController.get(this.contract.network);
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
