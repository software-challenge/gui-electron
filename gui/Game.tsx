import { remote } from 'electron';
import { GameState } from '../api/rules/HaseUndIgel';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ProgressBar } from './ProgressBar';
import { Viewer } from '../viewer/Viewer';
import { GameCreationOptions } from '../api/rules/GameCreationOptions';
import { GameInfo } from '../api/synchronous/GameInfo';
import { Api } from '../api/Api';
import { ConsoleMessage } from '../api/rules/ConsoleMessage';
import { loadCSS } from './index';
import { Logger } from '../api/Logger';

const dialog = remote.dialog;

interface State {
  currentTurn: number,
  turnCount: number,
  playPause: "pause" | "play",
  playIntervalID: number,
  playbackSpeed: number
}

enum ViewerState {
  idle,
  waiting,
  render
}

const MAX_INTERVAL = 3000; // max pause time between turns in playback mode

export class Game extends React.Component<{ name: string }, State> {
  private viewer_done = true;
  private viewer_running = false;
  private viewer: Viewer;
  private elem: Element;
  private elemSet: boolean;
  private game: GameInfo;
  private mounted: boolean;

  private viewerState: ViewerState;

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
    this.mounted = false;
    this.viewerState = ViewerState.idle;
  }

  private startViewer(e) {
    this.mounted = true;
    if (!this.viewer) {
      console.log("starting viewer " + this.props.name);
      this.viewer = Api.getViewer();
      this.viewer.setGameFrame(this);
      this.viewer.dock(e);
    }
    if (!this.game) {
      console.log("Game name: " + this.props.name);
      this.game = Api.getGameManager().getGame(this.props.name);
      console.log(this.game);
      var init = async function () {
        console.log(this.game);
        this.game.ready.then(() => console.log("game ready"));
        this.game.ready.catch((msg) => {
          console.log("error creating game!");
          dialog.showErrorBox("Spielerstellung", "Fehler beim Erstellen des Spiels!");
          this.viewer.fatalGameError("Es ist ein Fehler aufgetreten. Nähere Informationen im Log.");
          Logger.getLogger().log("Game", "init", msg || "no further details");
        });
        await this.game.ready;
        this.displayTurn(this.game.currentDisplayState, false);
      }.bind(this);

      init();

      //this.game.on('state_update', () => { if (this.mounted) { this.updateProgress() } }); DO DIFFERENTLY
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.viewer) {
      this.viewer.stop();
      this.viewer.undock();
    }
  }

  displayTurn(turn: number, animated = true) {
    console.log("Requested display of turn " + turn);
    if (turn > 62) {
      turn = 62;
    }
    if (turn < 0) {
      turn = 0;
    }
    if (this.viewerState == ViewerState.idle) {//Can only display a turn if not currently playing
      this.viewerState = ViewerState.waiting;//Set state to waiting to block other concurrent requests
      /*this.game.getState(turn).then(s => {//Request turn, then when turn is there
        //1. Find out if render should be animated
        if (animated) {
          animated = turn > this.state.currentTurn;
        }
        //2. Update global turn state and progress bar
        this.setState((prev, _props) => {
          prev.currentTurn = turn;
          return prev;
        });
        this.updateProgress();
        //3. Show end screen if possible
        if (this.game.stateHasResult(turn)) {
          console.log(`Turn ${turn} has endscreen`);
          this.viewer.ui.showEndscreen(this.game.getResult());
        } else {
          this.viewer.ui.hideEndscreen();
        }
        //4. start render
        this.viewerState = ViewerState.render;
        this.viewer.render(s, animated, () => {
          this.viewerState = ViewerState.idle; //When done rendering, the next turn may come in
          Api.getGameManager().setCurrentDisplayStateOnGame(this.game.name, turn);
        });

      });*/
    }
  }

  next() {
    /*if (!this.game.isLastState(this.state.currentTurn)) {
      this.displayTurn(this.state.currentTurn + 1);
    } else {
      if (this.isPlaying()) {
        this.playPause();
      } else {
        console.log("End reached.");
      }
    }*/
  }

  previous() {
    if (this.state.currentTurn > 0) {
      this.displayTurn(this.state.currentTurn - 1);
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
    /*let n = this.game.getStateNumber(state);
    if (n != -1) {
      this.setState((prev, _props) => {
        prev.currentTurn = n;
        return prev;
      });
      this.updateProgress();
    } else {
      console.log("did not find state ", state)
    }*/
  }

  currentStateCount() {
    return 0;
    /*if (this.game) {
      return this.game.getStateCount();
    } else {
      return 0
    }*/
  }

  updateProgress() {
    /*if (this.currentStateCount() != this.state.turnCount) {
      this.setState((prev, _props) => {
        prev.turnCount = this.currentStateCount();
        return prev;
      });
    }*/
  }

  handleSpeedChange(event) {
    var newValue = MAX_INTERVAL - Number(event.target.value);
    this.setState((prev, _props) => {
      prev.playbackSpeed = newValue;
      this.activatePlayback(prev);
      return prev;
    })
  }

  saveReplay() {
    /*if (this.game instanceof LiveGame) {
      dialog.showSaveDialog(
        {
          title: "Wähle einen Ort zum Speichern des Replays",
          defaultPath: this.game.name + '.xml',
          filters: [{ name: "Replay-Dateien", extensions: ["xml"] }]
        },
        (filename) => {
          // dialog returns undefined when user clicks cancel or an array of strings (paths) if user selected a file
          if (filename) {
            //window.localStorage[localStorageProgramPath] = filenames[0];
            console.log("Attempting to save " + filename)
            if (this.game instanceof LiveGame) {
              this.game.saveReplay(filename);
            }
          }
        }
      );
    }*/
  }



  render() {
    var image = "";
    if (this.state.playPause == "pause") {
      image = "assets/play.svg";
    } else {
      image = "assets/pause.svg";
    }
    var playPause = <button title="automatisches Abspielen" onClick={this.playPause.bind(this)}><img className="svg-icon" src={image} /></button>;
    var forward = <button title="einen Zug vor" onClick={this.next.bind(this)}><img className="svg-icon" src="assets/step-forward.svg" /></button>;
    var back = <button title="einen Zug zurück" onClick={this.previous.bind(this)}><img className="svg-icon" src="assets/step-backward.svg" /></button>;
    var speed = <input title="Abspielgeschwindigkeit" className="playbackSpeed" type="range" min="0" max={MAX_INTERVAL} step="100" onChange={(e) => this.handleSpeedChange(e)} value={MAX_INTERVAL - this.state.playbackSpeed} />
    var save = <button className="save" title="Replay speichern" onClick={this.saveReplay.bind(this)}><img className="svg-icon" src="assets/arrow-to-bottom.svg" /></button>;
    return (
      <div className="replay-viewer" ref={elem => { this.startViewer(elem) }}>
        <div className="replay-controls">
          <ProgressBar turnCount={this.currentStateCount()} currentTurn={this.state.currentTurn} turnCallback={t => { if (t <= this.currentStateCount.bind(this)()) { this.displayTurn.bind(this)(t) } }} />
          <div className="button-container">
            {playPause}{back}{forward}
            <img className="speed-label svg-icon" src="assets/tachometer-alt.svg" />
            {speed}
            {save}
          </div>
        </div>
      </div >
    );
  }
}
