import {
  Box,
  Icon,
  Text,
  Heading,
  Flex,
  Table,
  Button,
  Loader,
} from "rimble-ui";
import { Star } from "@rimble/icons";

import styled from "styled-components";

const LoaderContainer = styled(Box)`
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const positionsArr = [
  {
    name: "Ether",
    apr: "—% / —%",
    supply: "—      ETH",
    borrow: "—      ETH",
    icon: "Eth",
  },
  {
    name: "Basic Attention Token",
    apr: "—% / —%",
    supply: "—      BAT",
    borrow: "—      BAT",
    icon: "Bat",
  },
  {
    name: "Dai",
    apr: "—% / —%",
    supply: "—      DAI",
    borrow: "—      DAI",
    icon: "Dai",
  },
  {
    name: "USD Coin",
    apr: "—% / —%",
    supply: "—      USDC",
    borrow: "—      USDC",
    icon: "Usd",
  },
  {
    name: "Augur",
    apr: "—% / —%",
    supply: "—      REP",
    borrow: "—      REP",
    icon: "Rep",
  },
  {
    name: "0x",
    apr: "—% / —%",
    supply: "—      ZRX",
    borrow: "—      ZRX",
    icon: "Zrx",
  },
  {
    name: "Wrapped BTC",
    apr: "—% / —%",
    supply: "—      WBTC",
    borrow: "—      WBTC",
    icon: "Btc",
  },
];

const NameWrapper = styled(Flex)`
  align-items: center;
`;

const DummyPositions = () => {
  return (
    <>
      <Table fontSize="0">
        <thead>
          <tr>
            <th>Token</th>
            <th title="Supply / Borrow">APY (s/b)</th>
            <th>supplied</th>
            <th>borrowed</th>
            <th>Options</th>
          </tr>
        </thead>
        <tbody>
          {positionsArr.map(item => {
            return (
              <tr key={item.name}>
                <td>
                  <NameWrapper>
                    <Icon name={item.icon} /> <Box ml="2">{item.name}</Box>
                  </NameWrapper>
                </td>
                <td>{item.apr}</td>
                <td>
                  <Box width="95px">{item.supply}</Box>
                </td>
                <td>
                  <Box width="95px">{item.borrow}</Box>
                </td>
                <td>
                  <Button.Outline
                    icon="MoreHoriz"
                    size="small"
                    icononly
                    disabled
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {/* <LoaderContainer p="4">
        <Loader size="40px" />
      </LoaderContainer> */}
    </>
  );
};

export default DummyPositions;
