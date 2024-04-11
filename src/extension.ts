import {
  EVM_BASED_NETWORKS,
  EvmRpc,
  ITatumSdkContainer,
  Network,
  TatumConfig,
  TatumSdkExtension,
} from '@tatumio/tatum';
import { Contract, EvmPayload, WalletProvider } from './ens-contracts/contract';
import { EnsController, RegistrationRequest } from './ens-contracts/controller';
import { Resolver, TextRecord } from './ens-contracts/resolver';
import { ReverseRegistrar } from './ens-contracts/reverse-registrar';

export class EnsExtension extends TatumSdkExtension {
  supportedNetworks: Network[] = EVM_BASED_NETWORKS;

  private readonly _sdkConfig: TatumConfig;

  constructor(tatumSdkContainer: ITatumSdkContainer) {
    super(tatumSdkContainer);
    this._sdkConfig = this.tatumSdkContainer.getConfig();

    Contract.create(tatumSdkContainer.getRpc<EvmRpc>(), this._sdkConfig.network);
    EnsController.create();
    Resolver.create();
    ReverseRegistrar.create();
  }

  public walletProvider(walletProvider: WalletProvider) {
    Contract.instance.setWalletProvider(walletProvider);
    return this;
  }

  public evmPayload(evmPayload: EvmPayload) {
    Contract.instance.setEvmPayload(evmPayload);
    return this;
  }

  public async commitEnsRegistration(request: RegistrationRequest): Promise<string> {
    return EnsController.instance.commit(request);
  }

  public async registerEnsDomain(request: RegistrationRequest): Promise<string> {
    return EnsController.instance.register(request);
  }

  public async setTextRecords(
    name: string,
    recordsToUpdate: TextRecord[],
    recordsToRemove: string[],
  ): Promise<string> {
    return Resolver.instance.setTextRecords(name, recordsToUpdate, recordsToRemove);
  }

  public async getTextRecords(name: string, recordKeys: string[]): Promise<TextRecord[]> {
    return Resolver.instance.getTextRecords(name, recordKeys);
  }

  public async setAddress(name: string, address: string): Promise<string> {
    return Resolver.instance.setAddress(name, address);
  }

  public async getAddress(name: string): Promise<string> {
    return Resolver.instance.getAddress(name);
  }

  public async getName(node: string): Promise<string> {
    return Resolver.instance.getName(node);
  }

  public async setName(name: string): Promise<string> {
    return ReverseRegistrar.instance.setName(name);
  }

  public async setNameForAddr(
    address: string,
    owner: string,
    resolver: string,
    name: string,
  ): Promise<string> {
    return ReverseRegistrar.instance.setNameForAddr(address, owner, resolver, name);
  }

  public async node(address: string): Promise<string> {
    return ReverseRegistrar.instance.node(address);
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
