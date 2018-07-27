import * as React from 'react';
import { Toolbar, Actionbar, Button, ButtonGroup, Window, Content, PaneGroup, Pane } from "react-photonkit";



interface State {

}

export class Administration extends React.Component<any, State> {
  private listener;

  constructor() {
    super(null);
  }

  componentDidMount() {
    console.log("MOUNTED");

    //setTimeout(() => Api.getServer().registerListener(this.state.listener),1000);
  }

  componentWillUnmount() {
  }

  componentDidUpdate(prevProps) {
    let console = document.getElementById('console');
    console.scrollTop = console.scrollHeight;
  }

  clearLog() {
  }


  render() {
    return (
      <div>
        <h1>Server</h1>
        <Button text="Clear Log" onClick={() => this.clearLog()} />
      </div>
    );
  }
}