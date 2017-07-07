import * as React from 'react';
import Server from './Server';
import { Content, PaneGroup, Pane, TabGroup, TabItem } from "react-photonkit";
import * as cp from 'child_process';

interface State {
  serverStdout: string
  serverProcess: cp.ChildProcess | null
}

export class App extends React.Component {
  render() {
    return (
      <TabGroup activeKey={1}>
        <TabItem eventKey={1} title="Server">
          <Content>
            <Pane className="padded-more">
              <Server />
            </Pane>
          </Content>
        </TabItem>
        <TabItem eventKey={2} title="First Client">
          huthu
        </TabItem>
        <TabItem eventKey={3} title="Second Client">
          huthu
        </TabItem>
        <TabItem eventKey={4} title="Controller">
          <Content>
            <Pane className="padded-more">

            </Pane>
          </Content>
        </TabItem>
      </TabGroup>
    );
  }
}