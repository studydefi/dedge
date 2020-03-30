import { Box, Text, Heading, Flex, Table, Button } from "rimble-ui";
import styled from "styled-components";
import DACProxyContainer from "../../containers/DACProxy";

// import Logo from "../../components/Logo";
// import Connection from "../common/Connection";
// import SwapOptions from "../swap-tokens/SwapOptions";
// import Balances from "./Balances";

// const Container = styled(Flex)`
//   // background: yellow;
//   height: 100%;
//   flex-direction: column;
// `;

const CurrentPosition = () => {
  const { proxy } = DACProxyContainer.useContainer()
  return (
    <Table fontSize="0">
      <thead>
        <tr>
          <th>Token</th>
          <th>APR (s/b)</th>
          <th>Supplied</th>
          <th>Borrowed</th>
          <th>Options</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Ethereum</td>
          <td>4% / 7%</td>
          <td>100 ETH</td>
          <td>0 ETH</td>
          <td>
            <Button.Outline icon="MoreHoriz" size="small" icononly disabled={!proxy} />
          </td>
        </tr>
        <tr>
          <td>Basic Attention Token</td>
          <td>4% / 7%</td>
          <td>0 BAT</td>
          <td>120 BAT</td>
          <td>
            <Button.Outline icon="MoreHoriz" size="small" icononly />
          </td>
        </tr>
        <tr>
          <td>USD Coin</td>
          <td>4% / 7%</td>
          <td>100 USDC</td>
          <td>220 USDC</td>
          <td>
            <Button.Outline icon="MoreHoriz" size="small" icononly />
          </td>
        </tr>
      </tbody>
    </Table>
  )
}

export default CurrentPosition;
