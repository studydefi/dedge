import maker from "./maker";
import erc20 from "./erc20";
import dappsys from "./dappsys";
import uniswap from "./uniswap";
import compound from "./compound";
import instadapp from "./instadapp";
import networkIds from "./networks";

const isValidObject = (obj) =>
  typeof obj === "object" && obj !== null;

// Recursively goes through each field, and changes the address value to the specific value
// i.e. compound.cDai.address.mainnet = 0x...
//      becomes:
//      compound.cDai.address = 0x....
const changeAddressValue = (networkId, immutableObj) => {
  let obj = immutableObj;

  if (isValidObject(immutableObj)) {
    // desctructure the object to create new reference
    obj = { ...immutableObj };
    // iterating over the object using for..in
    for (var keys in obj) {
      //checking if the current value is an object itself
      if (isValidObject(obj[keys])) {
        if (
          `${keys}` === "address" &&
          obj[keys][`${networkId}`] !== undefined
        ) {
          // else getting the value and replacing with specified network id
          const keyValue = obj[keys][`${networkId}`];
          obj[keys] = keyValue || null;
        } else if (!Array.isArray(obj[keys])) {
          // Don't wanna modify arrays
          obj[keys] = changeAddressValue(networkId, obj[keys]);
        }
      }
    }
  }
  return obj;
};

export const legos = {
  maker,
  erc20,
  dappsys,
  uniswap,
  compound,
  instadapp
};

export const getLegos = (networkId) => {
  return changeAddressValue(networkId, legos);
};

export { networkIds };
