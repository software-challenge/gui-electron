import * as React from 'react';
import { Toolbar, Actionbar, Button, ButtonGroup, Window, Content, PaneGroup ,Pane } from "react-photonkit";
import * as cp from 'child_process';

interface State {
  stdout: string
  serverProcess: cp.ChildProcess | null
}

export default class Server extends React.Component<{}, State> {

  constructor() {
    super();
    this.state = { stdout: "Here comes the server output", serverProcess: null };
  }

  serverLogOutput(data) {
    this.setState((prevState, _) => { return {stdout: prevState.stdout + "\n" + data}});
    // scroll the output frame down:
    let elem = document.getElementById('console');
    elem.scrollTop = elem.scrollHeight;
  }

  serverExited(code) {
    console.log("server process exited with code " + code);
  }

  startServer() {
    console.log("Starting server (server should reside in ./server directory)");
    let process = cp.spawn('java', ['-jar', 'softwarechallenge-server.jar'], {cwd: './server'});
    process.stdout.on('data', (data) => { this.serverLogOutput(data) });
    process.stderr.on('data', (data) => { this.serverLogOutput(data) });
    process.on('close', this.serverExited);
    this.setState({serverProcess: process});
  }

  stopServer() {
    console.log("Stopping server");
    if (this.state.serverProcess != null) {
      this.state.serverProcess.kill();
    }
  }

  clearLog() {
    this.setState({stdout: ""});
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
        <pre style={consoleStyle} id="console">
          <code>
            {this.state.stdout}
          </code>
        </pre>
      </div>
    );
  }
}
