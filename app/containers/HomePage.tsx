import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import Server from '../components/Server';
import ControllingClient from '../components/ControllingClient';
import { Content, PaneGroup, Pane, TabGroup, TabItem } from "react-photonkit";
import * as cp from 'child_process';

interface State {
  serverStdout: string
  serverProcess: cp.ChildProcess | null
}

export class HomePage extends React.Component<RouteComponentProps<any>, void> {
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
              <ControllingClient />
            </Pane>
          </Content>
        </TabItem>
      </TabGroup>
    );
  }
}

export default (HomePage as any as React.StatelessComponent<RouteComponentProps<any>>);
