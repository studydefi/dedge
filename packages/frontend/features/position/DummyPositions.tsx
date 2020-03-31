import { Box, Icon, Text, Heading, Flex, Table, Button, Loader } from "rimble-ui";
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
    supplied: "—      ETH",
    borrowed: "—      ETH",
    icon: "Eth",
  },
  {
    name: "Basic Attention Token",
    apr: "—% / —%",
    supplied: "—      BAT",
    borrowed: "—      BAT",
  },
  {
    name: "Dai",
    apr: "—% / —%",
    supplied: "—      DAI",
    borrowed: "—      DAI",
  },
  {
    name: "USD Coin",
    apr: "—% / —%",
    supplied: "—      USDC",
    borrowed: "—      USDC",
  },
  {
    name: "Augur",
    apr: "—% / —%",
    supplied: "—      REP",
    borrowed: "—      REP",
  },
  {
    name: "0x",
    apr: "—% / —%",
    supplied: "—      ZRX",
    borrowed: "—      ZRX",
  },
  {
    name: "Wrapped BTC",
    apr: "—% / —%",
    supplied: "—      WBTC",
    borrowed: "—      WBTC",
  },
];

const DummyPositions = () => {
  return (
    <>
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
          {positionsArr.map(item => {
            return (
              <tr key={item.name}>
                <td>
                  <Icon name="Star" /> {item.name}
                </td>
                <td>{item.apr}</td>
                <td>{item.supplied}</td>
                <td>{item.borrowed}</td>
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
