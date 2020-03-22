import { createContainer } from "unstated-next";
import { useState } from "react";
import { ethers } from "ethers";

function useEthers() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);

  const attemptConnection = async () => {
    if (window.ethereum === undefined) {
      throw Error("MetaMask not found");
    }

    // get provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();

    // get address
    await provider.send("eth_requestAccounts", null);
    const address = await signer.getAddress();

    setProvider(provider);
    setSigner(signer);
    setAddress(address);
  };

  const connect = async () => {
    try {
      setError(null);
      await attemptConnection();
    } catch (error) {
      setError(error);
    }
  };

  return { provider, signer, address, connect, error };
}

const EthersContainer = createContainer(useEthers);

export default EthersContainer;
