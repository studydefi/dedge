import {
  Box,
  Text,
  Icon,
  Heading,
  Flex,
  Table,
  Button,
  Loader,
} from "rimble-ui";
import styled from "styled-components";
import DACProxyContainer from "../../containers/DACProxy";
import CompoundPositions from "../../containers/CompoundPositions";
import DummyPositions from "./DummyPositions";
import Controls from "./Controls";

const NameWrapper = styled(Flex)`
  align-items: center;
`;

const NumberWrapper = ({ value, symbol }) => {
  const short = parseFloat(value).toPrecision(8);
  return (
    <Box
      title={`${value} ${symbol}`}
      color={value === "0.0" ? "lightgrey" : "unset"}
    >
      {short} {symbol}
    </Box>
  );
};

const CurrentPosition = () => {
  const { proxy } = DACProxyContainer.useContainer();
  const { compoundPositions } = CompoundPositions.useContainer();

  const positionsArr = Object.entries(compoundPositions);

  if (!proxy || Object.keys(compoundPositions).length === 0) {
    return (
      <>
        <Controls notConnected={!proxy} />
        <DummyPositions />
      </>
    );
  }

  return (
    <>
      <Controls notConnected={false} />
      <Table fontSize="0">
        <thead>
          <tr>
            <th>Token</th>
            <th title="Supply / Borrow">APY (s/b)</th>
            <th>Supplied</th>
            <th>Borrowed</th>
            <th>Options</th>
          </tr>
        </thead>
        <tbody>
          {positionsArr.map(([key, item]) => {
            const { supply, borrow, name, symbol, icon } = item as any;
            return (
              <tr key={key}>
                <td>
                  <NameWrapper>
                    <Icon name={icon} /> <Box ml="2">{name}</Box>
                  </NameWrapper>
                </td>
                <td>4% / 7%</td>
                <td>
                  <NumberWrapper value={supply} symbol={symbol} />
                </td>
                <td>
                  <NumberWrapper value={borrow} symbol={symbol} />
                </td>
                <td>
                  <Button.Outline
                    icon="MoreHoriz"
                    size="small"
                    icononly
                    disabled={!proxy}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
};

export default CurrentPosition;
