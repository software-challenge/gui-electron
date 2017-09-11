import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface Props {
  turnCount: number,
  currentTurn: number
}


export class ProgressBar extends React.Component<Props, any> {

  constructor() {
    super();
  }

  render() {
    let currentStyle = { left: this.props.currentTurn*(1.0/60.0)*100.0 + '%' };
    let loadedStyle = { width: (this.props.turnCount-1)/60.0*100.0 + '%' };
    return (
      <div className="progress-bar">
        <div className="progress-loaded" style={loadedStyle} />
        <div className="progress-position" style={currentStyle} />
        <div className="round-text">Zug {this.props.currentTurn+1} / {this.props.turnCount} </div>
      </div>
    );
  }
}
