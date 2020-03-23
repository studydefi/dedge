import { ethers } from "ethers";

type Vaults = Record<string, string>;

export const getVaults = async (
  dssCdpManager: ethers.Contract,
  proxyAddress: string,
) => {
  // get vault count
  const vaultCountRaw = await dssCdpManager.count(proxyAddress);
  const vaultCount = parseInt(vaultCountRaw.toString());

  if (vaultCount === 0) return {};

  // object to hold vaults
  const vaults: Vaults = {};

  // get last vault
  let lastVaultRaw = await dssCdpManager.last(proxyAddress);
  let lastVault = lastVaultRaw.toString();
  let lastVaultIlkRaw = await dssCdpManager.ilks(lastVault);
  let lastVaultIlk = ethers.utils.parseBytes32String(lastVaultIlkRaw);

  vaults[lastVault] = lastVaultIlk;

  // walk the linked list and collect all the vaults (and their ilks)
  for (let i = 1; i < vaultCount; i++) {
    let linkedListRaw = await dssCdpManager.list(lastVault);
    lastVault = linkedListRaw.prev.toString();
    lastVaultIlkRaw = await dssCdpManager.ilks(lastVault);
    lastVaultIlk = ethers.utils.parseBytes32String(lastVaultIlkRaw);
    vaults[lastVault] = lastVaultIlk;
  }

  return vaults;
};
