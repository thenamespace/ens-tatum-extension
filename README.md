# Namespace ENS Tatum Extension

[Tatum](https://extensions.tatum.io/) extension that provides ENS functionality, with the following features:

- ENS name registration
- text record management and resolution
- address and name resolution

# Installation

```
yarn add @tatumio/tatum @tatumio/evm-wallet-provider @namespace-ens/tatum-ens-extension
```

# Setting up the extension

Initialize the extension. There are two types of connections for which the extension can be registered:

- _private connection_ - connecting with your private key
- _public connection_ - connecting with a wallet such as MetaMask

### Private connection

```ts
const tatum = await TatumSDK.init<Ethereum>({
  apiKey: '_your_tatum_api_key_',
  network: '_network_to_connect_to_', // either Network.ETHEREUM or Network.ETHEREUM_SEPOLIA
  configureWalletProviders: [EvmWalletProvider],
  configureExtensions: [EnsExtension],
});

const walletProvider = tatum.walletProvider.use(EvmWalletProvider);
const ens = tatum
  .extension(EnsExtension)
  .walletProvider(walletProvider)
  .evmPayload({
    privateKey: '_your_wallet_private_key_',
    ...'_other_parameters_as_needed_',
  });
```

### Public connection

```ts
const tatum = await TatumSDK.init<Ethereum>({
  network: '_network_to_connect_to_', // either Network.ETHEREUM or Network.ETHEREUM_SEPOLIA
  configureWalletProviders: [MetaMask],
  configureExtensions: [EnsExtension],
});

const walletProvider = tatum.walletProvider.use(MetaMask);
const ens = tatum.extension(EnsExtension).walletProvider(walletProvider);
```

# Domain registration

In order to register an ENS domain, you will need to create a `RegistrationRequest`:

```ts
interface RegistrationRequest {
  label: string; // label of the ENS domain (eg. namespace.eth, where namespace is the label)
  owner: string; // address of the wallet that will own the domain
  durationInSeconds: number; // how long the domain will registered for (set 31536000 for one year)
  secret: string; // random secret string
  resolver: string; // address of the domain name resolver (use 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63 for the official ENS PublicResolver)
  setAsPrimary: boolean; // is the domain primary for the address registering the domain (creates reverese record)
  fuses: number; // fuses that will be burned for the domain name
}
```

To learn more about the registration details please refer to: https://docs.ens.domains/registry/eth#controllers

Once you have `RegistrationRequest`, proceed with the registration:

1. Submit a commitment hash based on the instance of `registrationRequest`, which is used to prevent front running of the registration process:

```ts
await ens.commitEnsRegistration(request);
```

2. To prevent front running and ensure that the registration makes it to another block, ENS requires at least one minute delay before proceeding to the next step.
3. Finally, after the one minute delay submit the registration request:

```ts
await ens.registerEnsDomain(registrationRequest);
```

# Setting and retrieving text records

To **set records** call `setTextRecords` with these parameters:

- `name`: ENS domain for which the records are set (for example `yourname.eth`)
- `recordsToUpdate`: array of `TextRecord`s, where `TextRecord` is defined as:

```ts
interface TextRecord {
  key: string;
  value: string;
}
```

- `recordsToRemove`: array of record `key`s for which removal is required

```ts
await ens.setTextRecords(name, recordsToUpdate, recordsToRemove);
```

To **get records** call `getRecords` with these parameters:

- `name`: ENS domain for which the records are retrieved (for example `yourname.eth`)
- `recordKeys`: array of record `key`s for which the retrieval is required

```ts
await ens.getTextRecords(name, recordKeys);
```

# Address and name resolution

### Address resolution

To set the address to which the name will resolve, call `setAddress` with these parameters:

- `name`: for which the address is set (for example `yourname.eth`)
- `address`: address of the wallet

```ts
await ens.setAddress(name, address);
```

To resolve the address call:

```ts
await ens.getAddress(name);
```

### Reverse name resolution

To set the name for your address call `setName`:

```ts
await ens.setName(name);
```

You can also call `setNameForAddr` and provide these parameters:

- `address`: address for which to set the record
- `owner`: address that owns the reverse record
- `resolver`: address of the resolver (use 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63 for the official ENS PublicResolver)
- `name`: name for which the address will resolve (for example `yourname.eth`)

**The wallet calling `setNameForAddr` will need to be given the approval by the wallet at the above `address`** - this can be done by calling [setApprovalForAll](https://docs.ens.domains/registry/ens#other-functions)

```ts
await ens.setNameForAddr(address, owner, resolver, name);
```

To resolve the name for the stored adddress call:

```ts
const node = await ens.node(address);
const name = await ens.getName(node);
```
