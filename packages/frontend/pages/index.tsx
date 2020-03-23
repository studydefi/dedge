import { BaseStyles, theme } from "rimble-ui";
import { ThemeProvider } from "styled-components";

import EthersContainer from "../containers/Ethers";
import ContractsContainer from "../containers/Contracts";
import ProxiesContainer from "../containers/Proxies";
import VaultsContainer from "../containers/Vaults";

import Connect from "../components/Connect";
import Proxies from "../components/Proxies";
import Vaults from "../components/Vaults";
import CompoundPosition from "../components/CompoundPosition";

const App = () => (
  <EthersContainer.Provider>
    <ContractsContainer.Provider>
      <ProxiesContainer.Provider>
        <VaultsContainer.Provider>
          <Connect />
          <Proxies />
          <Vaults />
          <CompoundPosition />
        </VaultsContainer.Provider>
      </ProxiesContainer.Provider>
    </ContractsContainer.Provider>
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
