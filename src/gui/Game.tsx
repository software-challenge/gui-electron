import { remote }                                            from 'electron'
import { GameResult, GameRuleLogic, GameState, RenderState } from '../api/rules/CurrentGame'
import * as React                                            from 'react'
import { Viewer }                                            from '../viewer/Viewer'
import { Api }                                               from '../api/Api'
import { loadCSS }                                           from '.'
import { Logger }                                            from '../api/Logger'
import { MessageContent }                                    from '../api/rules/Message'
import { AppSettings }                                       from './App'
import * as ReactDOM                                         from 'react-dom'

const dialog = remote.dialog

interface State {
  turnActive: number
  turnTotal: number
  playbackStatus: 'pause' | 'play'
  playbackIntervalID: number
  playbackSpeed: number
  waitingForInput: boolean
  hideStartButton: boolean
  isGameOver: boolean
  gameResult?: GameResult
}

/** max pause time between turns in playback mode */
const MAX_PAUSE = 3000

export class Game extends React.Component<{ gameId: number, name: string, isReplay: boolean, settings: AppSettings }, State> {
  private viewer: Viewer
  private viewerElement: Element

  constructor(props) {
    super(props)
    this.viewer = null
    loadCSS('css/viewer.css')
    this.state = {
      turnActive:         0,
      turnTotal:          0,
      playbackStatus:     'pause',
      playbackIntervalID: null,
      playbackSpeed:      800,
      waitingForInput:    false,
      hideStartButton:    false,
      isGameOver:         false,
    }
  }

  private startViewer(e) {
    if (!this.viewer) {
      this.viewer = Api.getViewer()
      this.viewer.animateMoves = this.props.settings.animateMoves
      this.viewer.engine.scene.animateWater = this.props.settings.animateWater
      this.viewer.dock(e)
    }
  }

  private isGameOver(status?: MessageContent.StatusReportContent) {
    return status != undefined && this.state.turnActive == (status.numberOfStates - 1) &&
      (status.gameStatus == 'FINISHED' || status.gameStatus == 'REPLAY') &&
      status.gameResult !== undefined
  }

  private updateViewer() {
    Api.getGameManager().getGameStatus(this.props.gameId).then(status => {
      const gameOver = this.isGameOver(status)
      if (gameOver != this.state.isGameOver) {
        ReactDOM.unstable_batchedUpdates(() => {
          if (gameOver) {
            this.deactivatePlayback(this.state)
            this.setState({ playbackStatus: 'pause' })
          }
          this.setState({ isGameOver: gameOver, gameResult: status.gameResult })
        })
      }

      Api.getGameManager().getGameState(this.props.gameId, this.state.turnActive).then((gameState) => {
        if (this.state.waitingForInput) {
          this.interact(status)
        } else {
          this.viewer.render(new RenderState(gameState, 'none'))
        }
      })
    })
  }

  componentWillUnmount() {
    if (this.viewer) {
      this.viewer.stop()
      this.viewer.undock()
    }
    this.deactivatePlayback(this.state)
  }

  componentWillMount() {
    /* when the game is activated, we get the turn which should be displayed
     * from the game manager. This should be the only place where the displayed
     * turn number is received from the game manager. While the component is
     * active, the current turn is stored in the turnActive state. */
    this.setState({ turnActive: Api.getGameManager().getCurrentDisplayStateOnGame(this.props.gameId) })
    this.autoPlay()
    setTimeout(() => this.autoPlay(), 100)
  }

  componentDidMount() {
    this.startViewer(this.viewerElement)
  }

  private autoPlay() {
    Api.getGameManager().getGameStatus(this.props.gameId).then((status) => {
      if (!this.isPlaying() && status.gameStatus == 'REQUIRES INPUT') {
        console.log('Player input required! Automatically starting game...')
        this.playPause()
      }
    })
  }

  interact(status: MessageContent.StatusReportContent) {
    const state = GameState.lift(status.moveRequest.state)

    this.viewer.requestUserInteraction(state, [], (move) => {
      Logger.getLogger().log('Game', 'interact', `Sending move`)
      if (move.moveType == 'SKIP' || GameRuleLogic.validateMove(null, null, null, state, move)) {
        Api.getGameManager().sendMove(this.props.gameId, status.moveRequest.id, move).then((result) => {
          // server errored?
          if (result != -1) {
            // after sending the move, we want to render it as soon as the server gives out the new game state (because the user should have direct feedback on his move)
            this.waitForNextStatus(status.numberOfStates, () => this.nextTurn())
          }
        })
      } else {
        const ipc = require('electron').ipcRenderer
        ipc.send('showGameErrorBox', 'Ungültiger Zug', this.props.gameId, 'Der Zug von ' + move.fromField + ' nach ' + move.toField + ' ist ungültig!')
      }
    })
  }

  private waitForNextStatus(currentNumberOfStates: number, callback: () => void) {
    Api.getGameManager().getGameStatus(this.props.gameId).then((status) => {
      if (status.numberOfStates > currentNumberOfStates) {
        callback()
      } else {
        setTimeout(() => this.waitForNextStatus(currentNumberOfStates, callback), 100)
      }
    })
  }

  /** Updates the current turn, clipping it between 0 and either the given maxTurn or current turnTotal and updates the state. */
  updateTurn(turn: number, maxTurn: number = this.state.turnTotal) {
    const newTurn = Math.max(0, Math.min(turn, maxTurn))
    Api.getGameManager().setCurrentDisplayStateOnGame(this.props.gameId, newTurn)
    this.setState({ waitingForInput: false, hideStartButton: true, turnActive: newTurn, turnTotal: maxTurn })
  }

  nextTurn(numberOfTurns?: number) {
    const delta = numberOfTurns || 1
    Api.getGameManager().getGameStatus(this.props.gameId).then((status) => {
      ReactDOM.unstable_batchedUpdates(() => {
        if (status.numberOfStates > this.state.turnActive + 1) {
          this.updateTurn(this.state.turnActive + delta, status.numberOfStates - 1)
        } else {
          if (this.state.turnActive == status.numberOfStates - 1 && status.gameStatus == 'REQUIRES INPUT' && !this.state.waitingForInput) {
            this.setState({ waitingForInput: true })
          }
        }
      })
    })
  }

  previousTurn(numberOfTurns?: number) {
    this.updateTurn(this.state.turnActive - (numberOfTurns || 1))
  }

  playPause() {
    this.setState(prev => {
      const next = { ...prev }
      next.hideStartButton = true
      next.playbackStatus = this.isPlaying() ? 'pause' : 'play'
      if (next.playbackStatus == 'play') {
        this.activatePlayback(next)
      } else {
        this.deactivatePlayback(next)
      }
      return next
    })
  }

  /** Activates playback on this state
   * NOTE: has to be called inside a setState! */
  activatePlayback(state: State) {
    if (state.playbackIntervalID) {
      clearInterval(state.playbackIntervalID)
    }
    state.playbackIntervalID = window.setInterval(() => this.nextTurn(), state.playbackSpeed)
  }

  deactivatePlayback(state: State) {
    if (state.playbackIntervalID != null) {
      clearInterval(state.playbackIntervalID)
      state.playbackIntervalID = null
    }
  }

  isPlaying() {
    return this.state.playbackStatus == 'play'
  }

  setSpeed(newValue: number) {
    this.setState(prev => {
      let next = { ...prev, playbackSpeed: newValue }
      if (prev.playbackIntervalID) {
        this.activatePlayback(next)
      }
      // TODO: Pass animationTime to viewer when viewer is react component.
      this.viewer.engine.scene.animationTime = newValue
      return next
    })
  }

  saveReplay() {
    if (!this.props.isReplay) {
      dialog.showSaveDialog(
        {
          title:       'Wähle einen Ort zum Speichern des Replays',
          defaultPath: this.props.name + '.xml',
          filters:     [{ name: 'Replay-Dateien', extensions: ['xml'] }],
        },
        filename => {
          // dialog returns undefined when user clicks cancel or an array of strings (paths) if user selected a file
          if (filename) {
            console.log('Attempting to save', filename)
            Api.getGameManager().saveReplayOfGame(this.props.gameId, filename)
          }
        },
      )
    }
  }

  render() {
    const { turnActive, turnTotal, playbackSpeed, isGameOver, gameResult, hideStartButton } = this.state
    this.updateViewer()

    if (require('electron').remote.getGlobal('kioskMode')) {

      return <div id="replay-viewer" ref={(elem) => { this.viewerElement = elem }}>
        {isGameOver &&
        <div className="overlay" id="endscreen">
          <h1>Spiel vorbei</h1>
          <h2>{gameResult.reason}</h2>
          <h3>{gameResult.winner ?
            `Gewinner: ${gameResult.winner.displayName} (${gameResult.winner.color == 'RED' ? 'Rot' : 'Blau'})` :
            'Unentschieden!'}</h3>
          <h5><button className="green-button" onClick={e => {
            const ipc = require('electron').ipcRenderer
            ipc.send('kioskGameOver', this.props.gameId)
          }}>Neues Spiel beginnen</button></h5>
        </div>}
        <div className="replay-controls">
          <div className="button-container">
            <GameButton title={this.isPlaying() ? 'Pause' : 'Los'} resource={this.isPlaying() ? 'pause' : 'play'}
                        onClick={this.playPause.bind(this)}/>
            <GameButton title="Zug zurück" resource="step-backward" disabled={turnActive < 1}
                        onClick={e => this.previousTurn(e.shiftKey ? 5 : 1)}/>
            <GameButton title="Zug vor" resource="step-forward"
                        onClick={e => this.nextTurn(e.shiftKey ? 5 : 1)}/>

            <span className="current-turn">Zug: {turnActive}</span>
            <input title="Zug"
                   type="range"
                   min="0"
                   max={turnTotal}
                   value={turnActive}
                   step="1"
                   onChange={e => this.updateTurn(Number(e.target.value))}/>
            <button className="red-button" onClick={e => {
              const ipc = require('electron').ipcRenderer
              ipc.send('kioskGameOver', this.props.gameId)
            }}>Spiel beenden</button>
          </div>
        </div>
      </div>
    }

    return <div id="replay-viewer" ref={(elem) => { this.viewerElement = elem }}>
      {!hideStartButton && !isGameOver &&
      <GameButton className="overlay" id="start-button" title="Los" onClick={this.playPause.bind(this)} resource="play"/>}
      {isGameOver &&
      <div className="overlay" id="endscreen">
        <h1>Spiel vorbei</h1>
        <h2>{gameResult.reason}</h2>
        <h3>{gameResult.winner ?
          `Gewinner: ${gameResult.winner.displayName} (${gameResult.winner.color == 'RED' ? 'Rot' : 'Blau'})` :
          'Unentschieden!'}</h3>
      </div>}
      <div className="replay-controls">
        <div className="button-container">
          <GameButton title={this.isPlaying() ? 'Pause' : 'Los'} resource={this.isPlaying() ? 'pause' : 'play'}
                      onClick={this.playPause.bind(this)}/>
          <GameButton title="Zug zurück" resource="step-backward" disabled={turnActive < 1}
                      onClick={e => this.previousTurn(e.shiftKey ? 5 : 1)}/>
          <GameButton title="Zug vor" resource="step-forward"
                      onClick={e => this.nextTurn(e.shiftKey ? 5 : 1)}/>

          <span className="current-turn">Zug: {turnActive}</span>
          <input title="Zug"
                 type="range"
                 min="0"
                 max={turnTotal}
                 value={turnActive}
                 step="1"
                 onChange={e => this.updateTurn(Number(e.target.value))}/>

          <img alt="speed-icon" className="svg-icon speed-icon" src="resources/tachometer.svg"/>
          <input title="Abspielgeschwindigkeit"
                 type="range"
                 min="0"
                 max={MAX_PAUSE}
                 value={MAX_PAUSE - playbackSpeed}
                 step="100"
                 onChange={e => this.setSpeed(MAX_PAUSE - Number(e.target.value))}/>

          <GameButton title="Replay speichern" resource="arrow-to-bottom" onClick={this.saveReplay.bind(this)}
                      className="save"/>
        </div>
      </div>
    </div>
  }
}

const GameButton: React.FunctionComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & { resource: string }> = props => {
  const { resource, ...otherProps } = props
  return <button {...otherProps}>
    <img alt={props.title} className="svg-icon" src={`resources/${resource}.svg`}/>
  </button>
}
