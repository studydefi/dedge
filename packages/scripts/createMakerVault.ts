import { ethers } from "ethers";
import { getLegos, networkIds } from "money-legos";
import {
  wallet,
  openVault,
  getTokenFromUniswapAndApproveProxyTransfer
} from "dedge-smart-contracts/test/common";

import {
    dedgeHelpers
} from "dedge-smart-contracts/helpers"

if (process.argv.length !== 4) {
  console.log("ts-node createMakerVault.ts <owner-address> [ETH|BAT|USDC]");
  process.exit(1);
}

if (!["USDC", "BAT", "ETH"].includes(process.argv[3])) {
  console.log("ts-node createMakerVault.ts <owner-address> [ETH|BAT|USDC]");
  process.exit(1);
}

const legos = getLegos(networkIds.mainnet);

const vaultOwner = process.argv[2];
const vaultType = process.argv[3];

const getIlkDataFromArgs = () => {
  if (vaultType === "ETH") {
    return {
      ilk: legos.maker.ilks.ethA.symbol,
      join: legos.maker.ilks.ethA.join.address,
      erc20: null,
      amount: 1,
      decimal: 18
    };
  } else if (vaultType === "BAT") {
    return {
      ilk: legos.maker.ilks.batA.symbol,
      join: legos.maker.ilks.batA.join.address,
      erc20: legos.erc20.bat.address,
      amount: 300,
      decimal: 18
    };
  } else if (vaultType === "USDC") {
    return {
      ilk: legos.maker.ilks.usdcA.symbol,
      join: legos.maker.ilks.usdcA.join.address,
      erc20: legos.erc20.usdc.address,
      amount: 90,
      decimal: 6
    };
  }

  console.log("ts-node createMakerVault.ts <owner-address> [ETH|BAT|USDC]");
  process.exit(1);
};

const IDssProxyActions = new ethers.utils.Interface(
  legos.maker.dssProxyActions.abi
);

const makerProxyRegistryContract = new ethers.Contract(
  legos.maker.proxyRegistry.address,
  legos.maker.proxyRegistry.abi,
  wallet
);

const makerDssCdpManagerContract = new ethers.Contract(
  legos.maker.dssCdpManager.address,
  legos.maker.dssCdpManager.abi,
  wallet
);

const main = async () => {
  // If user doesn't have a maker ds proxy, make one
  console.log("Checking for ds-proxy for user");
  let dsProxyAddress = await makerProxyRegistryContract.proxies(wallet.address);
  if (dsProxyAddress === "0x0000000000000000000000000000000000000000") {
    await makerProxyRegistryContract.build({ gasLimit: 4000000 });
    dsProxyAddress = await makerProxyRegistryContract.proxies(wallet.address);
  }
  const makerDsProxyContract = new ethers.Contract(
    dsProxyAddress,
    legos.dappsys.dsProxy.abi,
    wallet
  );

  let dsProxyAddressVaultOwner = await makerProxyRegistryContract.proxies(vaultOwner);
  if (dsProxyAddressVaultOwner === "0x0000000000000000000000000000000000000000") {
    await makerProxyRegistryContract["build(address)"](vaultOwner, { gasLimit: 4000000 });
    dsProxyAddressVaultOwner = await makerProxyRegistryContract.proxies(vaultOwner);
  }
  console.log(`DSProxy for ${vaultOwner} is ${dsProxyAddressVaultOwner}`)

  const { ilk, join, erc20, amount, decimal } = getIlkDataFromArgs();

  if (erc20 !== null) {
    await getTokenFromUniswapAndApproveProxyTransfer(
      makerDsProxyContract.address,
      erc20,
      1,
      wallet
    );
  }

  console.log(`Opening ${vaultType} vault`);
  await openVault(makerDsProxyContract, ilk, join, amount, decimal);
  const cdpId = await makerDssCdpManagerContract.last(
    makerDsProxyContract.address
  );
  console.log(`Opened CDP, ID: ${cdpId.toString()}`);
  console.log(`Giving CDP to address: ${dsProxyAddressVaultOwner} (Proxy of ${vaultOwner})`)
  const giveCdpToProxyCalldata = IDssProxyActions
    .functions
    .give
    .encode([
        makerDssCdpManagerContract.address,
        cdpId.toString(),
        dsProxyAddressVaultOwner
    ])
    await makerDsProxyContract.execute(
        legos.maker.dssProxyActions.address,
        giveCdpToProxyCalldata,
        {
            gasLimit: 4000000
        }
    )

    const vaultOwnerCdpIds = await dedgeHelpers.maker.getVaultIds(dsProxyAddressVaultOwner, makerDssCdpManagerContract)
    console.log(`CdpIds found for proxy ${dsProxyAddressVaultOwner}:`)
    console.log(vaultOwnerCdpIds)
};

main();
