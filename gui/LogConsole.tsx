import * as React from 'react';
import { Api } from '../api/Api';


interface State {
  messages: any;//ConsoleMessage[];
}

export class LogConsole extends React.Component<{ gameId: number }, State> {
  private listener;

  constructor() {
    super(null);
    this.state = {
      messages: []
    };
  }

  componentDidMount() {
    //Api.getGameManager().getGame(this.props.game).on('message', m => this.setState((prev: State, props) => { prev.messages.push(m); return prev; }));
    this.setState((prev, props) => {
      //prev.messages = Api.getGameManager().getGame(this.props.game).getMessages();
      return prev;
    });
  }

  componentWillUnmount() {
  }

  componentDidUpdate(prevProps) {
    let console = document.getElementById('logMessages');
    console.scrollTop = console.scrollHeight;
  }


  render() {
    return (
      <div id="logMessages" className="logMessages">
        {this.state.messages.map(msg =>
          <div className={"logMessage " + msg.type}>
            <div className="sender">{msg.sender}</div>
            <code className="text">{msg.text}</code>
          </div>
        )}
      </div>
    );
  }
  
}
