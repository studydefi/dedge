import styled from "styled-components";
import useScreenSize from "../layout/useScreenSize";

const Container = styled.div`
  width: 100%;
  height: ${(p) => (p.small ? `72px` : `120px`)};
  color: white;
  background: black;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1200px;
  height: 100%;
  margin: auto;
  padding: 12px;
`;

const StatusBar = () => {
  const { isMobile } = useScreenSize();
  return (
    <Container small={isMobile}>
      <Content>
        <h1>Status Here</h1>
      </Content>
    </Container>
  );
};

export default StatusBar;
