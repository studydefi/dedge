import { Box, Text, Heading, Flex, Table, Button, Loader } from "rimble-ui";
import styled from "styled-components";
import DACProxyContainer from "../../containers/DACProxy";
import CompoundPositions from "../../containers/CompoundPositions";
import DummyPositions from "./DummyPositions";

const LoaderContainer = styled(Box)`
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CurrentPosition = () => {
  const { proxy } = DACProxyContainer.useContainer();
  const { compoundPositions } = CompoundPositions.useContainer();

  const positionsArr = Object.entries(compoundPositions);

  if (!proxy) {
    return <DummyPositions />;
  }

  if (Object.keys(compoundPositions).length === 0) {
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
        </Table>
        <LoaderContainer p="4">
          <Loader size="40px" />
        </LoaderContainer>
      </>
    );
  }
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
        {positionsArr.map(([key, val]) => {
          const { supply, borrow } = val as any;
          return (
            <tr key={key}>
              <td>Ethereum</td>
              <td>4% / 7%</td>
              <td>
                {supply} {key}
              </td>
              <td>
                {borrow} {key}
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
  );
};

export default CurrentPosition;
