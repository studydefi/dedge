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
import CoinOptions from "./CoinOptions";

const NameWrapper = styled(Flex)`
  align-items: center;
`;

const NumberWrapper = ({ value, symbol }) => {
  const short = parseFloat(value).toPrecision(6);
  return (
    <Box
      title={`${value} ${symbol}`}
      color={value === "0.0" || value === "0" ? "lightgrey" : "unset"}
    >
      {short} {symbol}
    </Box>
  );
};

const rateToPercent = (rate, decimals = 2) => {
  return (rate * 100).toFixed(decimals);
};

const CurrentPosition = () => {
  const { hasProxy } = DACProxyContainer.useContainer();
  const { compoundPositions, compoundApy } = CompoundPositions.useContainer();

  const positionsArr = Object.entries(compoundPositions);
  const apyArr = Object.entries(compoundApy);

  if (!hasProxy || apyArr.length === 0) {
    return (
      <>
        <Controls notConnected={!hasProxy} />
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
            const rates: any = apyArr.filter(
              x => x[0] === symbol.toLowerCase(),
            )[0][1];

            return (
              <tr key={key}>
                <td>
                  <NameWrapper>
                    <Icon name={icon} /> <Box ml="2">{name}</Box>
                  </NameWrapper>
                </td>
                <td>
                  {rateToPercent(rates.supplyRate)}% /{" "}
                  {rateToPercent(rates.borrowRate)}%
                </td>
                <td>
                  <NumberWrapper value={supply} symbol={symbol} />
                </td>
                <td>
                  <NumberWrapper value={borrow} symbol={symbol} />
                </td>
                <td>
                  {hasProxy && apyArr.length > 0 ? (
                    <CoinOptions symbol={symbol} />
                  ) : (
                    <Button.Outline
                      icon="MoreHoriz"
                      size="small"
                      icononly
                      disabled={!hasProxy}
                    />
                  )}
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
