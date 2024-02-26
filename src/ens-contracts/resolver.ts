import { Network } from '@tatumio/tatum';
import { Address, Hash, TransactionReceipt, decodeFunctionResult, encodeFunctionData, namehash } from 'viem';
import abi from '../abi/public-resolver.json';
import { Contract } from './contract';

export interface IENSTextRecord {
  key: string;
  value: string;
}

export class Resolver {
  public static RESOLVER_ADDRESS_MAINNET: Address = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63';
  public static RESOLVER_ADDRESS_SEPOLIA: Address = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
  private static _address: Address;
  private static _resolver: Resolver;

  private constructor() {}

  static get(contract?: Contract): Resolver {
    if (Resolver._resolver) return this._resolver;

    if (!contract?.network) throw new Error('Network must be provided.');

    Resolver._address =
      contract.network === Network.ETHEREUM ? this.RESOLVER_ADDRESS_MAINNET : this.RESOLVER_ADDRESS_SEPOLIA;

    Resolver._resolver = new Resolver();
    return Resolver._resolver;
  }

  address(address: Address): Resolver {
    Resolver._address = address;
    return Resolver._resolver;
  }

  async setTextRecords(
    name: string,
    recordsToUpdate: IENSTextRecord[],
    recordsToRemove: string[],
  ): Promise<TransactionReceipt> {
    name = name.toLowerCase();

    const data: Hash[] = [];
    if (recordsToUpdate.length > 0) {
      recordsToUpdate.forEach((record) => {
        const _encodedFunction = encodeFunctionData({
          abi,
          args: [namehash(name), record.key, record.value],
          functionName: 'setText',
        });
        data.push(_encodedFunction);
      });
    }

    if (recordsToRemove.length > 0) {
      recordsToRemove.forEach((record) => {
        const _encodedFunction = encodeFunctionData({
          abi,
          args: [namehash(name), record, ''],
          functionName: 'setText',
        });
        data.push(_encodedFunction);
      });
    }

    return Contract.get().write({
      address: Resolver._address,
      functionName: 'multicall',
      args: [data],
      abi,
    });
  }

  async getTextRecords(name: string, recordKeys: string[]): Promise<IENSTextRecord[]> {
    name = name.toLowerCase();

    const callData: Hash[] = [];
    const nameNode = namehash(name);

    recordKeys.forEach((recordKey) => {
      const _callData = encodeFunctionData({
        abi,
        functionName: 'text',
        args: [nameNode, recordKey],
      });
      callData.push(_callData);
    });

    const funcResponse = await Contract.get().read<Hash[]>({
      address: Resolver._address,
      functionName: 'multicall',
      args: [callData],
      abi,
    });

    const textRecords: IENSTextRecord[] = [];
    funcResponse.forEach((_response: any, index: number) => {
      const decoded = decodeFunctionResult({
        abi,
        functionName: 'text',
        data: _response,
      }) as any as string;

      if (decoded.length > 0) {
        const textRecord: IENSTextRecord = {
          value: decoded,
          key: recordKeys[index],
        };
        textRecords.push(textRecord);
      }
    });
    return textRecords;
  }

  async setAddress(name: string, address: string) {
    return await Contract.get().write({
      address: Resolver._address,
      functionName: 'setAddr',
      args: [namehash(name.toLowerCase()), address],
      abi,
    });
  }

  async getAddress(name: string) {
    return await Contract.get().read({
      address: Resolver._address,
      functionName: 'addr',
      args: [namehash(name.toLowerCase())],
      abi,
    });
  }

  async getName(node: string): Promise<string> {
    return await Contract.get().read({
      address: Resolver._address,
      functionName: 'name',
      args: [node],
      abi,
    });
  }
}
