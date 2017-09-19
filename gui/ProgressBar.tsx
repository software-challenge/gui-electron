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

  click(e: any) {
    //1. Find progress-bar node in case event landed on child node
    var targetbar = e.target;
    while (!targetbar.classList.contains('progress-bar')) {
      targetbar = targetbar.parentNode;
    }

    //2. Find top left corner of progressbar-loaded-node for accurate reference of top left corner
    var loadedNode = null;
    for (var i = 0; i < targetbar.children.length; i++) {
      if (targetbar.children[i].classList.contains('progress-loaded')) {
        loadedNode = targetbar.children[i];
        break;
      }
    }

    //Calculate target position of click
    var targetpos = e.clientX - loadedNode.getBoundingClientRect().left;
    var targetWidth = targetbar.clientWidth;

    //Calculate turn
    var clickedTurn = Math.round((targetpos / targetWidth) * (this.props.turnCount - 1));
    if (clickedTurn > this.props.turnCount) {
      clickedTurn = this.props.turnCount;
    }
    if (this.props.turnCallback) {
      this.props.turnCallback(clickedTurn);
    }
  }

  render() {
    let currentStyle = { left: this.props.currentTurn * (1.0 / 60.0) * 100.0 + '%' };
    let loadedStyle = { width: (this.props.turnCount - 1) / 60.0 * 100.0 + '%' };
    return (
      <div className="progress-bar" onClick={this.click.bind(this)}>
        <div className="progress-loaded" style={loadedStyle} />
        <div className="progress-position" style={currentStyle} />
        <div className="round-text">Zug {this.props.currentTurn + 1} / {this.props.turnCount} </div>
      </div>
    );
  }
}
