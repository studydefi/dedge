import { MetaMaskButton } from "rimble-ui";
import Ethers from "../containers/Ethers";

const Connect = () => {
  const { address, connect, error } = Ethers.useContainer();
  if (address) {
    return (
      <>
        <div>Connected account:</div>
        <pre>{address}</pre>
      </>
    );
  }

  return (
    <>
      <MetaMaskButton size="small" onClick={connect}>
        Connect with MetaMask
      </MetaMaskButton>
      {error && <div style={{ color: "red" }}>{error.message}</div>}
    </>
  );
};

export default Connect;
