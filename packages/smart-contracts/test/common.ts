import { ethers } from "ethers";

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.PROVIDER_URL || "http://localhost:8545"
);
export const wallet = new ethers.Wallet(
  "0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773", // Default private key for ganache-cli -d
  provider
);
export const getRandomAddress = (): string => {
  const w = ethers.Wallet.createRandom();
  return w.address;
};
