import { Network } from '@tatumio/tatum';
import { Address, TransactionReceipt, encodeFunctionData, namehash } from 'viem';
import controllerAbi from '../abi/eth-controller.json';
import resolverAbi from '../abi/public-resolver.json';
import { Contract } from './contract';

interface IRentPriceResponse {
  base: bigint;
  premium: bigint;
}

export class EnsController {
  public static readonly CONTROLLER_ADDRESS_MAINNET: Address = '0x253553366da8546fc250f225fe3d25d0c782303b';
  public static readonly CONTROLLER_ADDRESS_SEPOLIA: Address = '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72';
  private static _address: Address;
  private static _controller: EnsController;

  private constructor() {}

  static get(network?: Network): EnsController {
    if (EnsController._controller) return this._controller;

    if (!network) throw new Error('Network must be provided.');

    EnsController._address =
      network === Network.ETHEREUM ? this.CONTROLLER_ADDRESS_MAINNET : this.CONTROLLER_ADDRESS_SEPOLIA;

    EnsController._controller = new EnsController();
    return EnsController._controller;
  }

  address(address: Address): EnsController {
    EnsController._address = address;
    return EnsController._controller;
  }

  async makeCommitment(
    label: string,
    owner: string,
    durationInSeconds: number,
    secret: string,
    resolver: string,
    setAsPrimary: boolean,
    fuses: number,
  ): Promise<TransactionReceipt> {
    label = label.toLocaleLowerCase();
    const regData = await this.getSetAddrData(`${label}.eth`, owner);
    const _encodedSecret = this.toBytes32HexString(secret);
    const commitment = await Contract.get().read({
      address: EnsController._address,
      functionName: 'makeCommitment',
      args: [label, owner, durationInSeconds, _encodedSecret, resolver, [regData], setAsPrimary, fuses],
      abi: controllerAbi,
    });

    return Contract.get().write({
      address: EnsController._address,
      functionName: 'commit',
      args: [commitment],
      abi: controllerAbi,
    });
  }

  async register(
    label: string,
    owner: string,
    durationInSeconds: number,
    secret: string,
    resolver: string,
    setAsPrimary: boolean,
    fuses: number,
  ): Promise<TransactionReceipt> {
    label = label.toLocaleLowerCase();
    const totalPrice = await this.estimatePrice(label, durationInSeconds);
    const encodedSecret = this.toBytes32HexString(secret);
    const regData = await this.getSetAddrData(`${label}.eth`, owner);

    return await Contract.get().write({
      address: EnsController._address,
      functionName: 'register',
      args: [label, owner, durationInSeconds, encodedSecret, resolver, [regData], setAsPrimary, fuses],
      value: totalPrice,
      abi: controllerAbi,
    });
  }

  public async estimatePrice(label: string, durationInSeconds: number): Promise<bigint> {
    const estimate = await this.rentPrice(label, durationInSeconds);
    return estimate.base + estimate.premium;
  }

  private async rentPrice(label: string, durationInSeconds: number): Promise<IRentPriceResponse> {
    return await Contract.get().read<IRentPriceResponse>({
      address: EnsController._address,
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
}
