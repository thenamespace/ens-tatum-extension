import { Network } from '@tatumio/tatum';
import { Address, Hash, decodeFunctionResult, encodeFunctionData, namehash } from 'viem';
import abi from '../abi/public-resolver.json';
import { Contract } from './contract';

export interface TextRecord {
  key: string;
  value: string;
}

export class Resolver {
  public static RESOLVER_ADDRESS_MAINNET: Address = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63';
  public static RESOLVER_ADDRESS_SEPOLIA: Address = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
  private static _address: Address;
  private static _resolver: Resolver;

  static create(): Resolver {
    Resolver._address =
      Contract.network === Network.ETHEREUM ? this.RESOLVER_ADDRESS_MAINNET : this.RESOLVER_ADDRESS_SEPOLIA;

    Resolver._resolver = new Resolver();
    return Resolver._resolver;
  }

  static get instance() {
    return Resolver._resolver;
  }

  async setTextRecords(
    name: string,
    recordsToUpdate: TextRecord[],
    recordsToRemove: string[],
  ): Promise<string> {
    name = name.toLowerCase();
    const nameNode = namehash(name);

    // set up the encode function
    const encode = (key: string, value: string) =>
      encodeFunctionData({ abi, functionName: 'setText', args: [nameNode, key, value] });

    // encode records to update
    const updated = recordsToUpdate?.map((record) => encode(record.key, record.value));

    // encode records to remove
    const removed = recordsToRemove?.map((record) => encode(record, ''));

    const data = encodeFunctionData({ abi, functionName: 'multicall', args: [[...updated, ...removed]] });

    return Contract.instance.write(Resolver._address, data);
  }

  async getTextRecords(name: string, recordKeys: string[]): Promise<TextRecord[]> {
    name = name.toLowerCase();
    const nameNode = namehash(name);

    // encode keys for which to retrieve records
    const encode = (key: string) => encodeFunctionData({ abi, functionName: 'text', args: [nameNode, key] });
    const keys = recordKeys?.map((key) => encode(key));

    // get the records by calling multicall
    const multicall = encodeFunctionData({ abi, functionName: 'multicall', args: [keys] });
    const encoded = await Contract.instance.read({ to: Resolver._address, data: multicall });

    // decode result
    const records = decodeFunctionResult({
      abi,
      functionName: 'multicall',
      data: encoded.result as Hash,
    }) as [];

    // set up the decode function
    const decode = (record: Hash) =>
      decodeFunctionResult({
        abi,
        functionName: 'text',
        data: record,
      }) as string;

    // decode retrieved records
    return records
      ?.map((record) => decode(record))
      .map((value, index) => {
        return { key: recordKeys[index], value };
      }) as TextRecord[];
  }

  async setAddress(name: string, address: string): Promise<string> {
    const data = encodeFunctionData({
      abi,
      functionName: 'setAddr',
      args: [namehash(name.toLowerCase()), address],
    });

    return Contract.instance.write(Resolver._address, data);
  }

  async getAddress(name: string): Promise<string> {
    const data = encodeFunctionData({
      abi,
      functionName: 'addr',
      args: [namehash(name.toLowerCase())],
    });

    const address = await Contract.instance.read({
      to: Resolver._address,
      data,
    });

    return decodeFunctionResult({
      abi,
      functionName: 'addr',
      data: address.result as Address,
    }) as string;
  }

  async getName(node: string): Promise<string> {
    const data = encodeFunctionData({
      abi,
      functionName: 'name',
      args: [node],
    });

    const name = await Contract.instance.read({
      to: Resolver._address,
      data,
    });

    return decodeFunctionResult({
      abi,
      functionName: 'name',
      data: name.result as Address,
    }) as string;
  }
}
