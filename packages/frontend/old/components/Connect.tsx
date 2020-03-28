import { Card, Text, MetaMaskButton } from "rimble-ui";
import Ethers from "../containers/Ethers";

const Connect = () => {
  const { address, connect, error } = Ethers.useContainer();
  if (address) {
    return (
      <Card height="100px">
        <Text>
          Connected account:{" "}
          <span style={{ fontFamily: "monospace" }}>{address}</span>
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <MetaMaskButton size="small" onClick={connect}>
        Connect with MetaMask
      </MetaMaskButton>
      {error && <div style={{ color: "red" }}>{error.message}</div>}
    </Card>
  );
};

export default Connect;
