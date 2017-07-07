import * as React from 'react';
import { Toolbar, Actionbar, Button, ButtonGroup, Window, Content, PaneGroup, Pane } from "react-photonkit";
import { Api, ExecutableStatus } from '../api/Api';
import { Server as SCServer, ServerEvent as SCServerEvent } from '../api/Server';



interface State {
  events: SCServerEvent[],
  status: ExecutableStatus
}

export default class Server extends React.Component<any, State> {
  private listener;

  constructor() {
    super();
    this.state = {
      events: Api.getServer().getEvents(),
      status: Api.getServer().getStatus()
    };
  }

  componentDidMount() {
    console.log("MOUNTED");

    let server = Api.getServer();

    server.on('event', e => this.setState((prev: State, props) => { console.log(e); prev.events.push(e); return prev; }));
    server.on('status', s => this.setState((prev: State, props) => { prev.status = s; }));

    //setTimeout(() => Api.getServer().registerListener(this.state.listener),1000);
  }

  componentWillUnmount() {
  }

  componentDidUpdate(prevProps) {
    let console = document.getElementById('console');
    console.scrollTop = console.scrollHeight;
  }

  clearLog() {
    this.setState({ events: [] });
  }

  startServer() {
    Api.getServer().start();
  }

  stopServer() {
    Api.getServer().stop();
  }

  render() {
    let consoleStyle = {
      backgroundColor: "black",
      color: "#EEE",
      height: "20em",
      padding: "0.5em",
    }
    return (
      <div>
        <h1>Server</h1>
        <Button text="Start" onClick={() => this.startServer()} />
        <Button text="Stop" onClick={() => this.stopServer()} />
        <Button text="Clear Log" onClick={() => this.clearLog()} />
        <div>{ExecutableStatus.toString(this.state.status)}</div>
        <pre style={consoleStyle} id="console">
          {this.state.events.map((e: SCServerEvent) => {
            return (<div><span className="timestamp">{e.time.toString()}</span>
              <code className={"event-" + e.type}>
                {e.data}
              </code></div>)
          })}
        </pre>
      </div>
    );
  }
}