import { ITatumSdkContainer, Network } from '@tatumio/tatum';
import { EnsExtension, EnsExtensionOptions } from 'src/extension';
import { Address, Hash, decodeFunctionResult, encodeFunctionData, namehash } from 'viem';
import abi from '../abi/public-resolver.json';

export interface IENSTextRecord {
  key: string;
  value: string;
}

export class Resolver extends EnsExtension {
  private RESOLVER_ADDRESS_MAINNET: Address = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63';
  private RESOLVER_ADDRESS_SEPOLIA: Address = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

  constructor(tatumSdkContainer: ITatumSdkContainer, private readonly options: EnsExtensionOptions) {
    super(tatumSdkContainer, options);

    this.contract =
      tatumSdkContainer.getConfig().network === Network.ETHEREUM
        ? this.RESOLVER_ADDRESS_MAINNET
        : this.RESOLVER_ADDRESS_SEPOLIA;
  }

  public async setTextRecords(
    name: string,
    recordsToUpdate: IENSTextRecord[],
    recordsToRemove: string[],
  ): Promise<Hash> {
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

    return this.write({
      functionName: 'multicall',
      args: [data],
      abi,
    });
  }

  public async getTextRecords(name: string, recordKeys: string[]): Promise<IENSTextRecord[]> {
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

    const funcResponse = await this.read<Hash[]>({
      functionName: 'multicall',
      args: [callData],
      abi,
    });

    const textRecords: IENSTextRecord[] = [];
    funcResponse.forEach((_response, index) => {
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

  public async setAddress(name: string, address: string) {
    return await this.write({
      functionName: 'setAddr',
      args: [namehash(name), address],
      abi,
    });
  }

  public async getAddress(name: string) {
    return await this.read({
      functionName: 'addr',
      args: [namehash(name)],
      abi,
    });
  }
}
