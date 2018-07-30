import { remote } from 'electron';
import { GameState, UiState, RenderState, None } from '../api/rules/CurrentGame';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Viewer } from '../viewer/Viewer';
import { GameCreationOptions } from '../api/rules/GameCreationOptions';
import { GameInfo } from '../api/synchronous/GameInfo';
import { Api } from '../api/Api';
import { ConsoleMessage } from '../api/rules/ConsoleMessage';
import { loadCSS } from '.';
import { Logger } from '../api/Logger';
import { MessageContent } from '../api/rules/Message';
import { App } from './App';

const dialog = remote.dialog;

interface State {
  currentTurn: number;
  turnCount: number;
  playPause: "pause" | "play";
  playIntervalID: number;
  playbackSpeed: number;
  waitingForInput: boolean;
}

enum ViewerState {
  idle,
  waiting,
  render
}

const MAX_INTERVAL = 3000; // max pause time between turns in playback mode

export class Game extends React.Component<{ gameId: number, name: string }, State> {

  private viewer: Viewer;
  private mounted: boolean;

  private elemSet: boolean;
  private viewerElement: Element;

  private viewerState: ViewerState;

  constructor() {
    super(null);
    this.viewer = null;
    loadCSS('css/viewer.css');
    this.state = {
      currentTurn: 0,
      turnCount: 0,
      playPause: "pause",
      playIntervalID: null,
      playbackSpeed: 800,
      waitingForInput: false
    };
    this.mounted = false;
    this.viewerState = ViewerState.idle;
  }

  private startViewer(e) {
    this.mounted = true;
    if (!this.viewer) {
      this.viewer = Api.getViewer();
      this.viewer.dock(e);
    }
  }

  private updateProgress() {
    Api.getGameManager().getGameStatus(this.props.gameId, (status) => {
      console.log("updateProgress", {gameName: this.props.name, stateNumber: this.state.currentTurn});
      // Endscreen
      if (this.state.currentTurn == (status.numberOfStates - 1) &&
          (status.gameStatus == "FINISHED" || status.gameStatus == "REPLAY") &&
          status.gameResult) {
        this.viewer.showEndscreen(status.gameResult);
      } else {
        this.viewer.hideEndscreen();
      }
      Api.getGameManager().getGameState(this.props.gameId, this.state.currentTurn, (gameState) => {
        if (this.state.waitingForInput) {
          this.interact(status);
        } else {
          this.viewer.render(new RenderState(gameState, "none"), () => {})
        }
      });
    });
  }

  componentWillUnmount() {
    // no need to update state here, as it will be destroyed!
    this.mounted = false;
    if (this.state.playIntervalID !== null) {
      window.clearInterval(this.state.playIntervalID)
    }
    if (this.viewer) {
      this.viewer.stop();
      this.viewer.undock();
    }
    // setting state will not work here, therefore we just clear the interval
    this.deactivatePlayback(this.state);
  }

  componentWillMount() {
    /* when the game is activated, we get the turn which should be displayed
     * from the game manager. This should be the only place where the displayed
     * turn number is received from the game manager. While the component is
     * active, the current turn is stored in the currentTurn state. */
    this.setState((prev, props) => {
      return {
        ...prev,
        currentTurn: Api.getGameManager().getCurrentDisplayStateOnGame(props.gameId)
      }
    })
    this.autoPlay()
    setTimeout(() => this.autoPlay(), 100);
  }

  componentDidMount() {
    this.startViewer(this.viewerElement);
  }

  private autoPlay() {
    Api.getGameManager().getGameStatus(this.props.gameId, (status) => {
      if(!this.isPlaying() && status.gameStatus == "REQUIRES INPUT" && status.numberOfStates == 1) {
        console.log("Human first! Triggering play...")
        this.playPause();
      }
    })
  }

  interact(status: MessageContent.StatusReportContent) {
      status.moveRequest.state = GameState.lift(status.moveRequest.state);

      this.viewer.requestUserInteraction(status.moveRequest.state,[], (move) => {
        Logger.getLogger().log("Game", "interact", `Sending move`);
        Api.getGameManager().sendMove(this.props.gameId, status.moveRequest.id, move, () => {
          // after sending the move, we want to render it as soon as the server gives out the new game state (because the user should have direct feedback on his move)
          this.waitForNextStatus(status.numberOfStates, () => this.next());
        });
      });
  }

  private waitForNextStatus(currentNumberOfStates: number, callback: () => void) {
    Api.getGameManager().getGameStatus(this.props.gameId, (status) => {
      if (status.numberOfStates > currentNumberOfStates) {
        callback();
      } else {
        setTimeout(() => this.waitForNextStatus(currentNumberOfStates, callback), 100);
      }
    });
  }

  next() {
    //1. Get a Status report
    Api.getGameManager().getGameStatus(this.props.gameId, (status) => {
      if (status.numberOfStates > (this.state.currentTurn + 1)) {
        // there is a next state available to display
        this.setState((lastState, props) => {
          let newTurn = lastState.currentTurn + 1
          Api.getGameManager().setCurrentDisplayStateOnGame(props.gameId, newTurn)
          return {currentTurn: newTurn, waitingForInput: false}
        })
      } else {
        // there is no next state available at this time
        if (this.state.currentTurn == status.numberOfStates - 1 && status.gameStatus == "REQUIRES INPUT" && !this.state.waitingForInput) {
          this.setState({waitingForInput: true})
        }
      }
    });
  }

  previous() {
    if (this.state.currentTurn > 0) {
      this.setState((lastState, props) => {
        let newTurn = Math.max(0, lastState.currentTurn - 1)
        Api.getGameManager().setCurrentDisplayStateOnGame(props.gameId, newTurn)
        return {waitingForInput: false, currentTurn: newTurn}
      })
    }
  }

  private playbackStarted = false;
  playPause() {
    this.playbackStarted = true;
    document.getElementById('replay-viewer').style.filter = "none"
    this.setState((prev, _props) => {
      var next = {...prev};
      next.playPause = (prev.playPause == "pause" ? "play" : "pause");
      if (next.playPause == "play") {
        this.activatePlayback(next);
      } else {
        this.deactivatePlayback(next)
      }
      return next;
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

  deactivatePlayback(state: State) {
    if (state.playIntervalID != null) {
      clearInterval(state.playIntervalID);
      state.playIntervalID = null;
    }
  }

  isPlaying() {
    return this.state.playPause == "play";
  }


  private setStateCount(n: number, afterUpdate: () => void) {
    this.setState((prev, _props) => {
      return {...prev, turnCount: n};
    }, afterUpdate);
  }


  currentStateCount() {
    return this.state.turnCount;
  }


  handleSpeedChange(event) {
    var newValue = MAX_INTERVAL - Number(event.target.value);
    this.setState((prev, _props) => {
      let next = {...prev, playbackSpeed: newValue};
      this.activatePlayback(next);
      // TODO: Pass animationTime to viewer when viewer is react component.
      this.viewer.engine.scene.animationTime = newValue;
      return next;
    });
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
    var image = "resources/" + (this.state.playPause == "pause" ? "play" : "pause") + ".svg";
    var playPause = <button title="Los" onClick={this.playPause.bind(this)}><img className="svg-icon" src={image} /></button>;
    var forward = <button title="Zug vor" onClick={this.next.bind(this)}><img className="svg-icon" src="resources/step-forward.svg" /></button>;
    var back = <button title="Zug zurück" onClick={this.previous.bind(this)}><img className="svg-icon" src="resources/step-backward.svg" /></button>;
    var speed = <input title="Abspielgeschwindigkeit" className="playbackSpeed" type="range" min="0" max={MAX_INTERVAL} step="100" onChange={(e) => this.handleSpeedChange(e)} value={MAX_INTERVAL - this.state.playbackSpeed} />;
    var save = <button className="save" title="Replay speichern" onClick={this.saveReplay.bind(this)}><img className="svg-icon" src="resources/arrow-to-bottom.svg" /></button>;
    this.updateProgress()
    console.log("Turn: " + this.state.currentTurn)
    return (
      <div id="replay-viewer" ref={(elem) => {this.viewerElement = elem}}>
        <div className="replay-controls">
          <div className="button-container">
            {playPause}{back}{forward}
            <img className="speed-label svg-icon" src="resources/tachometer.svg" />
            {speed}
            <span style={{fontSize: '13pt', color: 'white', marginLeft: '1em'}}>Zug: {this.state.currentTurn}</span>
            {/*save*/}
          </div>
        </div>
        {this.playbackStarted ? "" : <button id="start-button" title="Los" onClick={event => this.playPause()}><img className="svg-icon" src="resources/play.svg" /></button>}
      </div >
    );
  }
}
