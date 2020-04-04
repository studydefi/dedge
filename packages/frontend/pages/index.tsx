import amplitude from "amplitude-js";
import {
  AmplitudeProvider,
  Amplitude,
  LogOnMount,
} from "@amplitude/react-amplitude";

import Layout from "../features/common/Layout";
import Topbar from "../features/topbar/Topbar";
import Content from "../features/common/Content";
import Dashboard from "../features/dashboard/Dashboard";

const AMPLITUDE_KEY = "94433c5552c59d4145fc10e5d7a994bb";

const Home = () => {
  return (
    <AmplitudeProvider
      amplitudeInstance={amplitude.getInstance()}
      apiKey={AMPLITUDE_KEY}
    >
      <Layout>
        <Topbar />
        <Content>
          <LogOnMount eventType="dashboard loaded" />
          <Dashboard />
        </Content>
      </Layout>
    </AmplitudeProvider>
  );
};

export default Home;
