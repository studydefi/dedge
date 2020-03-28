import { BaseStyles, theme } from "rimble-ui";
import { ThemeProvider } from "styled-components";

const customTheme = { ...theme };

const Home = () => (
  <ThemeProvider theme={customTheme}>
    <BaseStyles>
      <h1>Hello</h1>
    </BaseStyles>
  </ThemeProvider>
);

export default Home;
