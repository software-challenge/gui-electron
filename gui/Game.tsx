import { GameState } from '../api/HaseUndIgel';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ProgressBar } from './ProgressBar';
import { Viewer } from '../viewer/Viewer';
import { GameCreationOptions } from '../api/GameCreationOptions';
import { Game as SC_Game } from '../api/Game';
import { LiveGame } from '../api/LiveGame';
import { Api } from '../api/Api';
import { ConsoleMessage } from '../api/Api';
import { loadCSS } from './index';

interface State {
  currentTurn: number,
  turnCount: number,
  playPause: "pause" | "play"
}

export class Game extends React.Component<{ options: (GameCreationOptions | string), nameCallback: (string) => void }, State> {
  private viewer: Viewer;
  private elem: Element;
  private elemSet: boolean;
  private game: SC_Game;
  private currentStateNumber: number = 0;
  constructor() {
    super();
    this.viewer = null;
    loadCSS('viewer.css');
    this.state = {
      currentTurn: 0,
      turnCount: 0,
      playPause: "pause"
    };
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
      this.updateProgress();
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
          this.updateProgress();
          this.viewer.render(s, false);
        }
      })
    }
  }

  playPause() {
    this.setState((prev, _props) => {
      prev.playPause = (prev.playPause == "pause" ? "play" : "pause")
      return prev;
    });
  }

  setCurrentState(state: GameState) {
    let n = this.game.getStateNumber(state);
    if (n != -1) {
      this.currentStateNumber = n;
      this.updateProgress();
    } else {
      console.log("did not find state ", state)
    }
  }

  currentStateCount() {
    if (this.game) {
      return this.game.getStateCount();
    } else {
      return 0
    }
  }

  updateProgress() {
    this.setState((prev, _props) => {
      prev.currentTurn = this.currentStateNumber;
      prev.turnCount = this.currentStateCount();
      return prev;
    });
  }


  render() {
    var image = "";
    if (this.state.playPause == "pause") {
      image = "assets/play.svg";
    } else {
      image = "assets/pause.svg";
    }
    var playPause = <button onClick={this.playPause.bind(this)}><img src={image} /></button>;
    var forward = <button onClick={this.next.bind(this)}><img src="assets/step-forward.svg" /></button>;
    var back = <button onClick={this.previous.bind(this)}><img src="assets/step-backward.svg" /></button>;
    return (
      <div className="replay-viewer" ref={elem => { this.startViewer(elem) }}>
        <div className="replay-controls">
          <ProgressBar turnCount={this.currentStateCount()} currentTurn={this.currentStateNumber} />
          <div className="button-container">
            {playPause}{back}{forward}
          </div>
        </div>
      </div >
    );
  }
}
