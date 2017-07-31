import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Viewer } from '../viewer/Viewer';
import { GameCreationOptions } from '../api/GameCreationOptions';
import { Game as SC_Game } from '../api/Game';
import { Api } from '../api/Api';

export class Game extends React.Component<{ options: GameCreationOptions }, any> {
  private viewer: Viewer;
  private elem: Element;
  private elemSet: boolean;
  private game: SC_Game;
  constructor() {
    super();
    this.viewer = null;
  }

  startViewer(e) {
    if (!this.viewer) {
      this.viewer = new Viewer(e, document, window, true);
    }
    if (!this.game) {
      this.game = Api.getGameManager().createGame(this.props.options, (new Date()).toDateString());
      this.game.getState(0).then(s => {
        this.viewer.render(s, false);
      })
      console.log(this.game);
    }
  }

  componentWillUnmount() {
    if (this.viewer) {
      this.viewer.stop();
    }
  }

  next() {
    console.log("NEXT");
    console.log(this);
    this.game.getNextState().then(s => {
      this.viewer.render(s, false);
    })
  }

  previous() {
    console.log("NEXT");
    console.log(this);
    this.game.getPreviousState().then(s => {
      this.viewer.render(s, false);
    })
  }

  render() {
    var b = <button onClick={this.next.bind(this)}>NEXT</button>;
    var b_prev = <button onClick={this.previous.bind(this)}>PREV</button>;
    return (
      <div className="replay-viewer" ref={elem => { this.startViewer(elem) }}>
        <div className="replay-controls">
          {b_prev}{b}
        </div>
      </div >
    );
  }
}