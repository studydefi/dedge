# Smart Contracts

1. Clone this repo.

2. Navigate into the `contracts` package w/ `cd packages/contracts`.

3. Run `yarn` in this folder.

4. Start the test chain w/ a fork off the mainnet with the following command:
```bash
npx ganache-cli -f https://mainnet.infura.io/v3/<project_id> -i 1583817378
```

5. In a separate terminal (but same directory), migrate the contracts:
```bash
npx truffle migrate --reset --network development
```

# Testing
Run `ganache-cli` in the separate terminal with the following parameters:
```
ganache-cli -f <FORK_URL> -i 5777 -d
```

Run `npm run test` in another terminal, with the optional parameters in your environment:
- `PROVIDER_URL`: JSON RPC Provider URL (e.g. `ganache-cli`, defaults to `http://localhost:8545`)