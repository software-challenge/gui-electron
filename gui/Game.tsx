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
  playPause: "pause" | "play",
  playIntervalID: number,
  playbackSpeed: number
}

const MAX_INTERVAL = 3000; // max pause time between turns in playback mode

export class Game extends React.Component<{ options: (GameCreationOptions | string), nameCallback: (string) => void }, State> {
  private viewer: Viewer;
  private elem: Element;
  private elemSet: boolean;
  private game: SC_Game;
  constructor() {
    super();
    this.viewer = null;
    loadCSS('viewer.css');
    this.state = {
      currentTurn: 0,
      turnCount: 0,
      playPause: "pause",
      playIntervalID: null,
      playbackSpeed: 800
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
    let nextStateNumber = this.state.currentTurn + 1;
    this.game.getState(nextStateNumber).then(s => {
      this.setState((prev, _props) => {
        prev.currentTurn = nextStateNumber;
        return prev;
      });
      this.updateProgress();
      this.viewer.render(s, false);
      if (this.game.stateHasResult(this.state.currentTurn)) {
        this.viewer.ui.showEndscreen(this.game.getResult());
        if (this.game instanceof LiveGame) {
          this.game.saveReplay();
        }
      }
    });
  }

  previous() {
    if (this.state.currentTurn > 0) {
      let previousStateNumber = this.state.currentTurn - 1;
      this.viewer.ui.hideEndscreen();
      this.game.getState(previousStateNumber).catch(reason => { console.log("error!", reason) }).then(s => {
        if (s) {
          this.setState((prev, _props) => {
            prev.currentTurn = previousStateNumber;
            return prev;
          });
          this.updateProgress();
          this.viewer.render(s, false);
        }
      })
    }
  }

  playPause() {
    this.setState((prev, _props) => {
      prev.playPause = (prev.playPause == "pause" ? "play" : "pause")
      if (prev.playPause == "play") {
        this.activatePlayback(prev)
      } else {
        // remove callback
        clearInterval(prev.playIntervalID);
        prev.playIntervalID = null;
      }
      return prev;
    });
  }

  // has to be called inside a setState!
  activatePlayback(state: State) {
    if (state.playPause == "play") {
      if (state.playIntervalID) {
        clearInterval(state.playIntervalID);
      }
      state.playIntervalID = window.setInterval(() => this.next(), state.playbackSpeed);
    }
  }

  isPlaying() {
    return this.state.playPause == "play";
  }

  setCurrentState(state: GameState) {
    let n = this.game.getStateNumber(state);
    if (n != -1) {
      this.setState((prev, _props) => {
        prev.currentTurn = n;
        return prev;
      });
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
      prev.turnCount = this.currentStateCount();
      return prev;
    });
  }

  handleSpeedChange(event) {
    var newValue = MAX_INTERVAL - Number(event.target.value);
    this.setState((prev, _props) => {
      prev.playbackSpeed = newValue;
      this.activatePlayback(prev);
      return prev;
    })
  }


  render() {
    var image = "";
    if (this.state.playPause == "pause") {
      image = "assets/play.svg";
    } else {
      image = "assets/pause.svg";
    }
    var playPause = <button onClick={this.playPause.bind(this)}><img className="svg-icon" src={image} /></button>;
    var forward = <button onClick={this.next.bind(this)}><img className="svg-icon" src="assets/step-forward.svg" /></button>;
    var back = <button onClick={this.previous.bind(this)}><img className="svg-icon" src="assets/step-backward.svg" /></button>;
    var speed = <input className="playbackSpeed" type="range" min="0" max={MAX_INTERVAL} step="100" onChange={(e) => this.handleSpeedChange(e)} value={MAX_INTERVAL - this.state.playbackSpeed} />
    return (
      <div className="replay-viewer" ref={elem => { this.startViewer(elem) }}>
        <div className="replay-controls">
          <ProgressBar turnCount={this.currentStateCount()} currentTurn={this.state.currentTurn} />
          <div className="button-container">
            {playPause}{back}{forward}
            <img className="speed-label svg-icon" src="assets/tachometer-alt.svg" />
            {speed}
          </div>
        </div>
      </div >
    );
  }
}
