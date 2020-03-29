import { AppProps } from "next/app";
import { BaseStyles, theme } from "rimble-ui";
import { ThemeProvider, withTheme } from "styled-components";

import Connection from "../containers/Connection";
import DACProxy from "../containers/DACProxy";

const customTheme = {
  ...theme,
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
};

const WithProviders = ({ children }) => (
  <Connection.Provider>
    <DACProxy.Provider>{children}</DACProxy.Provider>
  </Connection.Provider>
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
