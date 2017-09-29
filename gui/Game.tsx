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


/*
Construction progress:
1. Get a viewer
2. Update progress


Update progress:
1. Get a Status report
2. Update progress bar based on said report
3. get current state from game manager
4. if current state == last state in game
4.1. if needs_input, interact, until needs_input no more
5. get_state for that state
6. render state

Next:
1. Get a Status report
2. if current_state + 1 <= number of states in game
2.1 set current state to current state + 1 in game manager
2.2 update progress

Previous:
1. if current state > 0
1.1 set current state to current state -1 in game manager
1.2 update progress
*/

export class Game extends React.Component<{ name: string }, State> {
  private update_running = false;
  private viewer: Viewer;
  private mounted: boolean;

  private elem: Element;
  private elemSet: boolean;

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
    //1. get a viewer
    if (!this.viewer) {
      console.log("starting viewer " + this.props.name);
      this.viewer = Api.getViewer();
      this.viewer.setGameFrame(this);
      this.viewer.dock(e);
    }
    //2. Update progress
    this.update_progress();
  }

  private update_progress() {
    if (!this.update_running) {
      this.update_running = true;

      //1. Get a Status report
      Api.getGameManager().getGameStatus(this.props.name, (status) => {
        //2. Update progress bar based on said report
        this.setStateCount(status.numberOfStates);
        //3. get current state from game manager
        var state_number = Api.getGameManager().getCurrentDisplayStateOnGame(this.props.name);
        console.log(this.props.name, state_number);
        //4. if current state == last state in game
        if (state_number == (status.numberOfStates - 1)) {
          if ((status.gameStatus == "FINISHED" || status.gameStatus == "REPLAY") && status.gameResult) {
            this.viewer.ui.showEndscreen(status.gameResult);
          }
          //4.1. if needs_input, interact, until needs_input no more
          if (status.gameStatus == "REQUIRES INPUT") {
            console.log("Requires input");
            this.viewer.ui.interact(status.actionRequest.state, status.actionRequest.color, status.actionRequest.isFirstAction, (method, action) => {
              Api.getGameManager().sendAction(this.props.name, status.actionRequest.id, method, action, (() => {
                this.update_progress();
              }).bind(this));
            });
          }
        }
        //5. get_state for that state
        console.log("Requesting state " + state_number);
        Api.getGameManager().getGameState(this.props.name, state_number, (gameState) => {
          //6. render state
          this.viewer.render(gameState, true, () => {
            this.update_running = false;
          })
        });
      });

    }
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.viewer) {
      this.viewer.stop();
      this.viewer.undock();
    }
  }

  next() {
    if (!this.update_running) {
      //1. Get a Status report
      Api.getGameManager().getGameStatus(this.props.name, (status) => {
        //2. if current_state + 1 <= number of states in game
        var current_state = Api.getGameManager().getCurrentDisplayStateOnGame(this.props.name);
        if (current_state + 1 <= (status.numberOfStates - 1)) {
          //2.1 set current state to current state + 1 in game manager
          Api.getGameManager().setCurrentDisplayStateOnGame(this.props.name, current_state + 1);
          //2.2 update progress
          this.update_progress();
        } else {
          if (this.isPlaying()) {
            this.playPause();
          } else {
            console.log("End reached.");
          }
        }
      });
    }
  }

  previous() {
    if (!this.update_running) {
      //1. if current state > 0
      var current_state = Api.getGameManager().getCurrentDisplayStateOnGame(this.props.name);
      if (current_state > 0) {
        //1.1 set current state to current state -1 in game manager
        Api.getGameManager().setCurrentDisplayStateOnGame(this.props.name, current_state - 1);
        //1.2 update progress
        this.update_progress();
      }
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


  private setStateCount(n: number) {
    if (n > 0) {
      this.setState((prev, _props) => {
        prev.turnCount = n;
        return prev;
      });
    }
  }


  private setCurrentStateNumber(n: number) {
    if (n > -1) {
      this.setState((prev, _props) => {
        prev.currentTurn = n;
        return prev;
      });
    }
  }

  currentStateCount() {
    return 0;
    /*if (this.game) {
      return this.game.getStateCount();
    } else {
      return 0
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

  displayTurn(turn: number) {
    alert('not implemented yet');
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
