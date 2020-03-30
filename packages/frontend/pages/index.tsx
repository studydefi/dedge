// import Connection from "../containers/Connection";
// import DACProxy from "../containers/DACProxy";

import Layout from "../features/common/Layout";
import Topbar from "../features/topbar/Topbar";
import Content from "../features/common/Content";

import Dashboard from "../features/dashboard/Dashboard";

const Home = () => {
  // const { signer, error, connect } = Connection.useContainer();
  // const { proxyAddress } = DACProxy.useContainer();

  // // no connection yet or have not looked up proxyAddress yet
  // if (!signer || proxyAddress === null) {
  //   return (
  //     <Layout>
  //       <Content>
  //         <PleaseConnect connect={connect} error={error} />
  //       </Content>
  //     </Layout>
  //   );
  // }

  // // user does not have a proxyAddress with us
  // if (
  //   proxyAddress === "0x0000000000000000000000000000000000000000"
  // ) {
  //   return (
  //     <Layout>
  //       <Topbar />
  //       <Content>
  //         <PleaseProxy />
  //       </Content>
  //     </Layout>
  //   );
  // }

  // user has a proxyAddress, they are good to go
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
