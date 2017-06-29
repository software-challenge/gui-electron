import * as React from 'react';
import { Toolbar, Actionbar, Button, ButtonGroup, Window, Content, PaneGroup ,Pane } from "react-photonkit";

interface State {
  stdout: string
}

export default class Server extends React.Component<{}, State> {

  constructor() {
    super();
    this.state = { stdout: "" };
  }

  logOutput(data) {
    this.setState((prevState, _) => { return {stdout: prevState.stdout + "\n" + data}});
    // scroll the output frame down:
    let elem = document.getElementById('console');
    elem.scrollTop = elem.scrollHeight;
  }

  connectClient() {
    console.log("Starting server (server should reside in ./server directory)");
  }

  createGame() {
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
        <h1>Controlling Client</h1>
        <Button text="Connect" onClick={() => this.connectClient()} />
        <Button text="Create Game" onClick={() => this.createGame()} />
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
