import ComptrollerDef from "../smart-contracts/build/IComptroller.json";
import CTokenDef from "../smart-contracts/build/ICToken.json";

const compound = {
  comptroller: {
    address: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
    abi: ComptrollerDef.abi,
  },
  cEther: {
    address: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
    abi: CTokenDef.abi,
  },
  cDai: {
    address: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
    abi: CTokenDef.abi,
  },
  cSai: {
    address: "0xf5dce57282a584d2746faf1593d3121fcac444dc",
    abi: CTokenDef.abi,
  },
  cBat: {
    address: "0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e",
    abi: CTokenDef.abi,
  },
  cZRX: {
    address: "0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407",
    abi: CTokenDef.abi,
  },
  cUSDC: {
    address: "0x39aa39c021dfbae8fac545936693ac917d5e7563",
    abi: CTokenDef.abi,
  },
  cREP: {
    address: "0x158079ee67fce2f58472a96584a73c7ab9ac95c1",
    abi: CTokenDef.abi,
  },
};

export default compound;
