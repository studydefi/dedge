import { AppProps } from "next/app";
import { BaseStyles, theme, ToastMessage } from "rimble-ui";
import { ThemeProvider, withTheme } from "styled-components";

import Connection from "../containers/Connection";
import Contracts from "../containers/Contracts";
import DACProxy from "../containers/DACProxy";
import BorrowBalances from "../containers/CompoundPositions";
import CoinsContainer from "../containers/Coins";
import VaultsContainer from "../containers/Vaults";

const customTheme = {
  ...theme,
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
};
const WithProviders = ({ children }) => (
  <CoinsContainer.Provider>
    <Connection.Provider>
      <ToastMessage.Provider ref={node => (window.toastProvider = node)} />
      <Contracts.Provider>
        <DACProxy.Provider>
          <VaultsContainer.Provider>
            <BorrowBalances.Provider>{children}</BorrowBalances.Provider>
          </VaultsContainer.Provider>
        </DACProxy.Provider>
      </Contracts.Provider>
    </Connection.Provider>
  </CoinsContainer.Provider>
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={customTheme}>
      <BaseStyles>
        <WithProviders>
          <Component {...pageProps} />
        </WithProviders>
      </BaseStyles>
    </ThemeProvider>
  );
}

export default MyApp;
