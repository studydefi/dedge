import { AppProps } from "next/app";
import { BaseStyles, theme } from "rimble-ui";
import { ThemeProvider } from "styled-components";

const customTheme = { ...theme };

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={customTheme}>
      <BaseStyles>
        <Component {...pageProps} />
      </BaseStyles>
    </ThemeProvider>
  );
}

export default MyApp;
