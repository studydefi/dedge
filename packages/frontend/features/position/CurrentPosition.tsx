import { Box, Text, Heading, Flex, Table } from "rimble-ui";
import styled from "styled-components";

// import Logo from "../../components/Logo";
// import Connection from "../common/Connection";
// import SwapOptions from "../swap-tokens/SwapOptions";
// import Balances from "./Balances";

// const Container = styled(Flex)`
//   // background: yellow;
//   height: 100%;
//   flex-direction: column;
// `;

const CurrentPosition = () => (
  <Table>
    <thead>
      <tr>
        <th>Token</th>
        <th>APR (s/b)</th>
        <th>Supplied</th>
        <th>Borrowed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Ethereum</td>
        <td>4% / 7%</td>
        <td>100 ETH</td>
        <td>0 ETH</td>
      </tr>
      <tr>
        <td>Basic Attention Token</td>
        <td>4% / 7%</td>
        <td>0 BAT</td>
        <td>120 BAT</td>
      </tr>
      <tr>
        <td>USD Coin</td>
        <td>4% / 7%</td>
        <td>100 USDC</td>
        <td>220 USDC</td>
      </tr>
    </tbody>
  </Table>
);

export default CurrentPosition;
