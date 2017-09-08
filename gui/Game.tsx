import { GameState } from '../api/HaseUndIgel';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Viewer } from '../viewer/Viewer';
import { GameCreationOptions } from '../api/GameCreationOptions';
import { Game as SC_Game } from '../api/Game';
import { LiveGame } from '../api/LiveGame';
import { Api } from '../api/Api';
import { ConsoleMessage } from '../api/Api';
import { loadCSS } from './index';

export class Game extends React.Component<{ options: (GameCreationOptions | string), nameCallback: (string) => void }, any> {
  private viewer: Viewer;
  private elem: Element;
  private elemSet: boolean;
  private game: SC_Game;
  private currentStateNumber: number = 0;
  constructor() {
    super();
    this.viewer = null;
    loadCSS('viewer.css');
  }

  startViewer(e) {
    if (!this.viewer) {
      this.viewer = new Viewer(e, document, window, this, true);
      Api.setCurrentViewer(this.viewer);
    }

    let live = false;
    if (!this.game) {
      let gameName = (new Date()).toDateString();

      if (this.props.options instanceof GameCreationOptions) {
        this.props.nameCallback(gameName);
        this.game = Api.getGameManager().createLiveGame(this.props.options, gameName);
      } else {
        // this.props.options is the path to the replay file
        this.game = Api.getGameManager().createReplayGame(this.props.options, gameName);
      }
      var init = async function () {
        console.log(this.game);
        await this.game.ready;
        console.log("game ready");
        this.game.getState(0).then(s => {
          this.viewer.render(s, false);
        });
      }.bind(this);
      init();
    }
  }

  componentWillUnmount() {
    if (this.viewer) {
      this.viewer.stop();
    }
  }

  next() {
    let nextStateNumber = this.currentStateNumber + 1;
    this.game.getState(nextStateNumber).then(s => {
      this.currentStateNumber = nextStateNumber;
      this.viewer.render(s, false);
      if (this.game.stateHasResult(this.currentStateNumber)) {
        this.viewer.ui.showEndscreen(this.game.getResult());
        if (this.game instanceof LiveGame) {
          this.game.saveReplay();
        }
      }
    });
  }

  previous() {
    if (this.currentStateNumber > 0) {
      let previousStateNumber = this.currentStateNumber - 1;
      this.viewer.ui.hideEndscreen();
      this.game.getState(previousStateNumber).catch(reason => { console.log("error!", reason) }).then(s => {
        if (s) {
          this.currentStateNumber = previousStateNumber;
          this.viewer.render(s, false);
        }
      })
    }
  }

  setCurrentState(state: GameState) {
    let n = this.game.getStateNumber(state);
    if (n != -1) {
      this.currentStateNumber = n;
    } else {
      console.log("did not find state ", state)
    }
  }

  render() {
    var b = <button onClick={this.next.bind(this)}>Vor</button>;
    var b_prev = <button onClick={this.previous.bind(this)}>Zurück</button>;
    return (
      <div className="replay-viewer" ref={elem => { this.startViewer(elem) }}>
        <div className="replay-controls">
          {b_prev}{b}
        </div>
      </div >
    );
  }
}
