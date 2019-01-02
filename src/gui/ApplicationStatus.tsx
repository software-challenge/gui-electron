import * as React from 'react'
import { Api } from '../api/Api'
import { ExecutableStatus } from '../api/rules/ExecutableStatus'

type CheckStatus = 'Idle' | // check has not begun yet
  'Checking' | // check is running
  'Completed' | // check is complete, results are in the other state variables
  'ErrorWhileChecking'; // there was a problem checking something, should not happen. NOTE that is is not the same as a negative result on one of the checks

interface State {
  checkStatus: CheckStatus;
  serverReachable: boolean;
  errors: Array<string>;
}

export class ApplicationStatus extends React.Component<{}, State> {
  constructor() {
    super(null)
    this.state = {
      checkStatus: 'Idle',
      serverReachable: false,
      errors: []
    }
  }

  componentDidMount() {
    this.startCheck()
  }

  private pushError(error: any) {
    this.setState((prev, _props) => {
      prev.errors.push(error)
      return prev
    })
  }

  private updateCheckStatus(newStatus: CheckStatus): void {
    this.setState({checkStatus: newStatus})
  }

  startCheck(): void {
    this.updateCheckStatus('Checking')
    this.checkServer().then(result => {
      this.setState({serverReachable: result})
      this.updateCheckStatus('Completed')
    }).catch(error => {
      this.pushError('Error while checking: ' + error)
      this.updateCheckStatus('ErrorWhileChecking')
    })
  }

  checkServer(): Promise<boolean> {
    console.log('checking server')
    return Api.getGameManager().getGameServerStatus().then(serverInfo => {
      if (serverInfo.status != ExecutableStatus.Status.RUNNING) {
        this.pushError(serverInfo)
        return false
      } else {
        return true
      }
    })
  }

  render() {
    return (
      <div>Pruefung durchgefuehrt: {this.state.checkStatus}<p>Server
        reachable: {this.state.serverReachable.toString()}</p><p>{this.state.errors.join(' ')}</p></div>
    )
  }
}
