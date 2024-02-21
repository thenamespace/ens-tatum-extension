import { ITatumSdkContainer, Network } from '@tatumio/tatum';
import { EnsExtension, EnsExtensionOptions } from 'src/extension';
import { Address, encodeFunctionData, namehash } from 'viem';
import controllerAbi from '../abi/eth-controller.json';
import resolverAbi from '../abi/public-resolver.json';

interface IRentPriceResponse {
  base: bigint;
  premium: bigint;
}

export class EnsController extends EnsExtension {
  private CONTROLLER_ADDRESS_MAINNET: Address = '0x253553366da8546fc250f225fe3d25d0c782303b';
  private CONTROLLER_ADDRESS_SEPOLIA: Address = '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72';

  constructor(tatumSdkContainer: ITatumSdkContainer, private readonly options: EnsExtensionOptions) {
    super(tatumSdkContainer, options);

    this.contract =
      tatumSdkContainer.getConfig().network === Network.ETHEREUM
        ? this.CONTROLLER_ADDRESS_MAINNET
        : this.CONTROLLER_ADDRESS_SEPOLIA;
  }

  async makeCommitment(
    label: string,
    owner: string,
    durationInSeconds: number,
    secret: string,
    resolver: string,
    setAsPrimary: boolean,
    fuses: number,
  ) {
    const regData = await this.getSetAddrData(`${label}.eth`, owner);
    const _encodedSecret = this.toBytes32HexString(secret);
    const commitment = await this.read({
      functionName: 'makeCommitment',
      args: [label, owner, durationInSeconds, _encodedSecret, resolver, [regData], setAsPrimary, fuses],
      abi: controllerAbi,
    });

    return this.write({
      functionName: 'commit',
      args: [commitment],
      abi: controllerAbi,
    });
  }

  public async register(
    label: string,
    owner: string,
    durationInSeconds: number,
    secret: string,
    resolver: string,
    setAsPrimary: boolean,
    fuses: number,
  ) {
    const totalPrice = await this.estimatePrice(label, durationInSeconds);
    const encodedSecret = this.toBytes32HexString(secret);
    const regData = await this.getSetAddrData(`${label}.eth`, owner);

    return await this.write({
      functionName: 'register',
      args: [label, owner, durationInSeconds, encodedSecret, resolver, [regData], setAsPrimary, fuses],
      value: totalPrice,
      abi: controllerAbi,
    });
  }

  public async estimatePrice(label: string, durationInSeconds: number) {
    const estimate = await this.rentPrice(label, durationInSeconds);
    return estimate.base + estimate.premium;
  }

  public async rentPrice(label: string, durationInSeconds: number) {
    return await this.read<IRentPriceResponse>({
      functionName: 'rentPrice',
      args: [label, durationInSeconds],
      abi: controllerAbi,
    });
  }

  private async getSetAddrData(name: string, registrant: string) {
    return encodeFunctionData({
      abi: resolverAbi,
      functionName: 'setAddr',
      args: [namehash(name), registrant],
    });
  }

  private toBytes32HexString(value: string) {
    const utf8String = encodeURIComponent(value);
    const stringBytes = [];
    for (let i = 0; i < utf8String.length; i++) {
      stringBytes.push(utf8String.charCodeAt(i));
    }

    // ensure the byte array is 32 bytes long
    const padding = new Array(32 - stringBytes.length).fill(0);
    const paddedBytes = [...stringBytes, ...padding];

    // convert the byte array to a bytes32 type
    const bytes32Value = '0x' + Buffer.from(paddedBytes).toString('hex');

    return bytes32Value;
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
