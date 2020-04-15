import { AppProps } from "next/app";
import { BaseStyles, theme, ToastMessage } from "rimble-ui";
import { ThemeProvider, withTheme } from "styled-components";

import Connection from "../containers/Connection";
import Contracts from "../containers/Contracts";
import DACProxy from "../containers/DACProxy";
import BorrowBalances from "../containers/CompoundPositions";
import CoinsContainer from "../containers/Coins";
import VaultsContainer from "../containers/Vaults";
import Head from "next/head";

import "../theme.css";

const customTheme = {
  ...theme,
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
};
const WithProviders = ({ children }) => (
  <CoinsContainer.Provider>
    <Connection.Provider>
      <ToastMessage.Provider ref={(node) => (window.toastProvider = node)} />
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
          <Head>
            <meta
              name="keywords"
              content="Ethereum,DeFi,Blockchain,Crypto,Cryptocurrency"
            />
            <meta
              property="og:title"
              content="Dedge | Swap Debt and Collateral Instantly"
            />
            <meta
              property="og:description"
              content="Swap debt and collateral instantly on Compound, powered by flash loans."
            />
            <meta
              property="og:image"
              content="https://dedge.exchange/screenshot.png"
            />
            <meta
              name="twitter:title"
              content="Dedge | Swap Debt and Collateral Instantly"
            />
            <meta
              name="twitter:description"
              content="Swap debt and collateral instantly on Compound, powered by flash loans."
            />
            <meta
              name="twitter:image"
              content="https://dedge.exchange/screenshot.png"
            />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="og:url" content="https://dedge.exchange" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <link
              href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@200;300;400&display=swap"
              rel="stylesheet"
            ></link>
            <script
              dangerouslySetInnerHTML={{
                __html: `!function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on"];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t,e){var n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src="https://cdn.segment.com/analytics.js/v1/"+t+"/analytics.min.js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(n,a);analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.1.0";
            analytics.load("${process.env.SEGMENT_API_KEY}");
            analytics.page();
            }}();`,
              }}
            />
          </Head>
          <Component {...pageProps} />
        </WithProviders>
      </BaseStyles>
    </ThemeProvider>
  );
}

export default MyApp;
