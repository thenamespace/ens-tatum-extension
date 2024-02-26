import { Network } from '@tatumio/tatum';
import { Address, TransactionReceipt } from 'viem';
import abi from '../abi/reverse-registrar.json';
import { Contract } from './contract';

export class ReverseRegistrar {
  public static REVERSE_REGISTRAR_ADDRESS_MAINNET: Address = '0xa58e81fe9b61b5c3fe2afd33cf304c454abfc7cb';
  public static REVERSE_REGISTRAR_ADDRESS_SEPOLIA: Address = '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6';
  private static _address: Address;
  private static _resolver: ReverseRegistrar;

  private constructor() {}

  static get(contract?: Contract): ReverseRegistrar {
    if (ReverseRegistrar._resolver) return this._resolver;

    if (!contract?.network) throw new Error('Network must be provided.');

    ReverseRegistrar._address =
      contract.network === Network.ETHEREUM
        ? this.REVERSE_REGISTRAR_ADDRESS_MAINNET
        : this.REVERSE_REGISTRAR_ADDRESS_SEPOLIA;

    ReverseRegistrar._resolver = new ReverseRegistrar();
    return ReverseRegistrar._resolver;
  }

  address(address: Address): ReverseRegistrar {
    ReverseRegistrar._address = address;
    return ReverseRegistrar._resolver;
  }

  async node(address: Address): Promise<string> {
    return Contract.get().read<string>({
      address: ReverseRegistrar._address,
      functionName: 'node',
      args: [address],
      abi,
    });
  }

  async setName(name: string): Promise<TransactionReceipt> {
    return Contract.get().write({
      address: ReverseRegistrar._address,
      functionName: 'setName',
      args: [name],
      abi: abi,
    });
  }

  async setNameForAddr(
    address: Address,
    owner: Address,
    resolver: Address,
    name: string,
  ): Promise<TransactionReceipt> {
    return Contract.get().write({
      address: ReverseRegistrar._address,
      functionName: 'setNameForAddr',
      args: [address, owner, resolver, name],
      abi: abi,
    });
  }
}
