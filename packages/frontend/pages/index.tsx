import { BaseStyles, theme } from "rimble-ui";
import { ThemeProvider } from "styled-components";

import EthersContainer from "../containers/Ethers";

import Connect from "../components/Connect";
import Vaults from "../components/Vaults";
import CompoundPosition from "../components/CompoundPosition";

const App = () => (
  <EthersContainer.Provider>
    <Connect />
    <Vaults />
    <CompoundPosition />
  </EthersContainer.Provider>
);

const customTheme = { ...theme };

const Home = () => (
  <ThemeProvider theme={customTheme}>
    <BaseStyles>
      <App />
    </BaseStyles>
  </ThemeProvider>
);

export default Home;
