import * as React from 'react';
import {ServerEvent as SCServerEvent } from '../api/Server';

interface State {
  events: SCServerEvent[]
}

export default class Dummy extends React.Component<{}, State> {

  private listener;

  doThings = () => {
    var e = {
      type: "stdout",
      time: new Date(),
      data: "test"
    };
    this.setState((prev:State, props) => { prev.events.push(e); return prev; });
  }

  constructor() {
    super();
    this.state = { 
      events: [],
    };
    this.listener = ((e) => {
        this.setState((prev:State, props) => { prev.events.push(e); return prev; });
    }).bind(this);
  }


  componentDidMount() {
    console.log("MOUNTED");
    this.doThings();
    setTimeout(this.doThings,1000); 
  }

  componentWillUnmount() {
    console.log("UNMOUNTED");
  }
  
  render() {
    let consoleStyle = {
      backgroundColor: "black",
      color: "#EEE",
      height: "20em",
      padding: "0.5em",
    };
    return (
      <pre style={consoleStyle} id="console">
          {this.state.events.map((e: SCServerEvent) => {
            return (<div><span className="timestamp">{e.time.toString()}</span>
              <code className={"event-" + e.type}>
                {e.data}
              </code></div>)
          })}
        </pre>
    );
  }
}
