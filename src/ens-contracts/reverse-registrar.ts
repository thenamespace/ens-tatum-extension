import { Network } from '@tatumio/tatum';
import { Address, encodeFunctionData } from 'viem';
import abi from '../abi/reverse-registrar.json';
import { Contract } from './contract';

export class ReverseRegistrar {
  public static REVERSE_REGISTRAR_ADDRESS_MAINNET: Address = '0xa58e81fe9b61b5c3fe2afd33cf304c454abfc7cb';
  public static REVERSE_REGISTRAR_ADDRESS_SEPOLIA: Address = '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6';
  private static _address: Address;
  private static _reverseRegistrar: ReverseRegistrar;

  private constructor() {}

  static create(): ReverseRegistrar {
    ReverseRegistrar._address =
      Contract.network === Network.ETHEREUM
        ? this.REVERSE_REGISTRAR_ADDRESS_MAINNET
        : this.REVERSE_REGISTRAR_ADDRESS_SEPOLIA;

    ReverseRegistrar._reverseRegistrar = new ReverseRegistrar();
    return ReverseRegistrar._reverseRegistrar;
  }

  static get instance() {
    return ReverseRegistrar._reverseRegistrar;
  }

  async node(address: string): Promise<string> {
    const data = encodeFunctionData({
      abi,
      functionName: 'node',
      args: [address],
    });

    const node = await Contract.instance.read({
      to: ReverseRegistrar._address,
      data,
    });

    return node.result as string;
  }

  async setName(name: string): Promise<string> {
    const data = encodeFunctionData({
      abi,
      functionName: 'setName',
      args: [name],
    });

    return Contract.instance.write(ReverseRegistrar._address, data);
  }

  async setNameForAddr(address: string, owner: string, resolver: string, name: string): Promise<string> {
    const data = encodeFunctionData({
      abi,
      functionName: 'setNameForAddr',
      args: [address, owner, resolver, name],
    });

    return Contract.instance.write(ReverseRegistrar._address, data);
  }
}
