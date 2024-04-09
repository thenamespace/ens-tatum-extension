import { JsonRpcResponse, Network } from '@tatumio/tatum';
import { Address, Hash, decodeFunctionResult, encodeFunctionData, formatEther, namehash } from 'viem';
import abi from '../abi/eth-controller.json';
import resolverAbi from '../abi/public-resolver.json';
import { Contract } from './contract';

export interface RegistrationRequest {
  label: string;
  owner: string;
  durationInSeconds: number;
  secret: string;
  resolver: string;
  setAsPrimary: boolean;
  fuses: number;
}

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

  static create(): EnsController {
    EnsController._address =
      Contract.network === Network.ETHEREUM
        ? this.CONTROLLER_ADDRESS_MAINNET
        : this.CONTROLLER_ADDRESS_SEPOLIA;

    EnsController._controller = new EnsController();
    return EnsController._controller;
  }

  static get instance() {
    return EnsController._controller;
  }

  async commit(request: RegistrationRequest): Promise<string> {
    const label = request.label.toLocaleLowerCase();
    const regData = await this.encodeSetAddr(`${label}.eth`, request.owner);
    const encodedSecret = this.toBytes32HexString(request.secret);
    const makeCommitment = encodeFunctionData({
      abi,
      functionName: 'makeCommitment',
      args: [
        label,
        request.owner,
        request.durationInSeconds,
        encodedSecret,
        request.resolver,
        [regData],
        request.setAsPrimary,
        request.fuses,
      ],
    });

    const commitment = await Contract.instance.read({
      to: EnsController._address,
      data: makeCommitment,
    });

    const data = encodeFunctionData({
      abi,
      functionName: 'commit',
      args: [commitment.result],
    });

    return Contract.instance.write(EnsController._address, data);
  }

  async register(request: RegistrationRequest): Promise<string> {
    const label = request.label.toLocaleLowerCase();
    const regData = await this.encodeSetAddr(`${label}.eth`, request.owner);
    const encodedSecret = this.toBytes32HexString(request.secret);
    const totalPrice = await this.estimatePrice(request.label, request.durationInSeconds);
    const value = formatEther(BigInt(totalPrice));

    const data = encodeFunctionData({
      abi,
      functionName: 'register',
      args: [
        label,
        request.owner,
        request.durationInSeconds,
        encodedSecret,
        request.resolver,
        [regData],
        request.setAsPrimary,
        request.fuses,
      ],
    });

    const contract = Contract.instance;
    contract.setEvmPayload({ ...contract.evmPayload, value });

    return contract.write(EnsController._address, data);
  }

  private async estimatePrice(label: string, durationInSeconds: number): Promise<bigint> {
    const price = await this.rentPrice(label, durationInSeconds);
    const estimate = decodeFunctionResult({
      abi,
      functionName: 'rentPrice',
      data: price.result as Hash,
    }) as IRentPriceResponse;

    return estimate.base + estimate.premium;
  }

  private async rentPrice(label: string, durationInSeconds: number): Promise<JsonRpcResponse<string>> {
    const data = encodeFunctionData({
      abi,
      functionName: 'rentPrice',
      args: [label, durationInSeconds],
    });

    return Contract.instance.read({
      to: EnsController._address,
      data,
    });
  }

  private async encodeSetAddr(name: string, registrant: string) {
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
