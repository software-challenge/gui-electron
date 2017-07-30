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
      console.log("props: " + JSON.stringify(this.props.options));
      this.game = Api.getGameManager().createGame(this.props.options, (new Date()).toDateString());
      this.game.on("state", s => {
        console.log("state!");
        this.viewer.render(s, true);
      })
      console.log(this.game);
    }
  }

  componentWillUnmount() {
    if (this.viewer) {
      console.log("Stopping viewer!");
      this.viewer.stop();
    }
  }

  next() {
    console.log("NEXT");
    console.log(this);
    this.game.next();
  }

  render() {
    var b = <button onClick={this.next.bind(this)}>NEXT</button>;
    return (
      <div className="replay-viewer" ref={elem => { this.startViewer(elem) }}>
        <div className="replay-controls">
          {b}
        </div>
      </div >
    );
  }
}