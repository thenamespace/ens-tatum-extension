import { EvmWalletProvider } from '@tatumio/evm-wallet-provider';
import {
  EVM_BASED_NETWORKS,
  EvmRpc,
  ITatumSdkContainer,
  Network,
  TatumConfig,
  TatumSdkExtension,
} from '@tatumio/tatum';
import { Contract, EvmPayload } from './ens-contracts/contract';
import { EnsController, RegistrationRequest } from './ens-contracts/controller';

export class EnsExtension extends TatumSdkExtension {
  supportedNetworks: Network[] = EVM_BASED_NETWORKS;

  private readonly _sdkConfig: TatumConfig;

  constructor(tatumSdkContainer: ITatumSdkContainer) {
    super(tatumSdkContainer);
    this._sdkConfig = this.tatumSdkContainer.getConfig();
    Contract.create(tatumSdkContainer.getRpc<EvmRpc>(), this._sdkConfig.network);
    EnsController.create();
  }

  public walletProvider(walletProvider: EvmWalletProvider) {
    Contract.instance.setWalletProvider(walletProvider);
    return this;
  }

  public evmPayload(evmPayload: EvmPayload) {
    Contract.instance.setEvmPayload(evmPayload);
    return this;
  }

  public async commitRegistrationRequest(request: RegistrationRequest): Promise<string> {
    return EnsController.instance.commit(request);
  }

  public async registerEnsDomain(request: RegistrationRequest): Promise<string> {
    return EnsController.instance.register(request);
  }

  init(): Promise<void> {
    if (
      this._sdkConfig.network === Network.ETHEREUM ||
      this._sdkConfig.network === Network.ETHEREUM_SEPOLIA
    ) {
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
