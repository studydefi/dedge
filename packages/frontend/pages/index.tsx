import Connection from "../containers/Connection";
import DACProxy from "../containers/DACProxy";

import Layout from "../features/common/Layout";
import Topbar from "../features/common/Topbar";
import Content from "../features/common/Content";

import PleaseConnect from "../features/setup/PleaseConnect";
import PleaseProxy from "../features/setup/PleaseProxy";
import Dashboard from "../features/dashboard/Dashboard";

const Home = () => {
  const { signer, error, connect } = Connection.useContainer();
  const { proxyAddress } = DACProxy.useContainer();
  if (!signer) {
    return (
      <Layout>
        <Content>
          <PleaseConnect connect={connect} error={error} />
        </Content>
      </Layout>
    );
  }

  if (!proxyAddress) {
    return (
      <Layout>
        <Topbar />
        <Content>
          <PleaseProxy />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <Topbar />
      <Content>
        <Dashboard />
      </Content>
    </Layout>
  );
};

export default Home;
