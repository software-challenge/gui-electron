import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface Props {
  turnCount: number,
  currentTurn: number
  turnCallback?: (turn: number) => void;
}


export class ProgressBar extends React.Component<Props, any> {

  constructor() {
    super();
  }

  handleTurnChange(e: any) {
    this.props.turnCallback(Number(e.target.value));
  }

  render() {
    let loadedStyle = { width: (this.props.turnCount - 1) / 60.0 * 100.0 + '%' };
    return (
      <div className="progress-bar">
        <input title="aktueller Zug" className="progress-loaded" type="range" min="0" max={this.props.turnCount - 1} step="1" onChange={(e) => this.handleTurnChange(e)} value={this.props.currentTurn} style={loadedStyle} />
        <div className="round-text">Zug {this.props.currentTurn + 1} / {this.props.turnCount} </div>
      </div>
    );
  }
}
