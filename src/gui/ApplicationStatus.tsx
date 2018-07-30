import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Backend } from '../api/synchronous/Backend';

type CheckStatus = "Idle" | // check has not begun yet
  "Checking" | // check is running
  "Completed" | // check is complete, results are in the other state variables
  "ErrorWhileChecking"; // there was a problem checking something, should not happen. NOTE that is is not the same as a negative result on one of the checks

interface State {
  checkStatus: CheckStatus;
  serverReachable: boolean;
  errors: Array<string>;
}

export class ApplicationStatus extends React.Component<{}, State>{
  constructor() {
    super(null);
    this.state = {
      checkStatus: "Idle",
      serverReachable: false,
      errors: []
    };
  }

  componentDidMount() {
    Backend.ready().then(() => this.startCheck()).catch((err) => {
      this.setState((prev, _props) => { prev.errors.push(err); return prev; });
      this.updateCheckStatus("ErrorWhileChecking");
    });
  }

  private updateCheckStatus(newStatus: CheckStatus): void {
    this.setState((prev, _props) =>  {return  {...prev, checkStatus: newStatus};} );
  }

  private startCheck(): void {
    this.updateCheckStatus("Checking");
    Promise.all([
      this.checkServer().then((result) => {
        this.setState((prev, _props) => { return {...prev, serverReachable: result};});
      }).catch((err) => {
        this.setState((prev, _props) => { prev.errors.push(err); return prev; });
      })
    ]).then((_result) => {
      this.updateCheckStatus("Completed");
    }).catch((_error) => {
      this.updateCheckStatus("ErrorWhileChecking");
    });
  }

  private checkServer(): Promise<boolean> {
    console.log("checking server");
    return Backend.gameServerStatus().then((res) => {
      if (res != "OK") {
        this.setState((prev, _props) => { prev.errors.push(res); return prev; });
        return false;
      } else {
        return true;
      }
    });
  }

  render() {
    return (
      <div>Pruefung durchgefuehrt: {this.state.checkStatus}<p>{this.state.errors.join(" ")}</p><p>{this.state.errors.join(" ")}</p></div>
    );
  }
}
