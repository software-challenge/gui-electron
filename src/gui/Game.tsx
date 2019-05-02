import { remote } from 'electron'
import { GameState, RenderState } from '../api/rules/CurrentGame'
import * as React from 'react'
import { Viewer } from '../viewer/Viewer'
import { Api } from '../api/Api'
import { loadCSS } from '.'
import { Logger } from '../api/Logger'
import { MessageContent } from '../api/rules/Message'
import { AppSettings } from './App'

const dialog = remote.dialog

interface State {
  currentTurn: number
  turnCount: number
  playPause: 'pause' | 'play'
  playIntervalID: number
  playbackSpeed: number
  waitingForInput: boolean
  isGameOver: boolean
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
      currentTurn: 0,
      turnCount: 0,
      playPause: 'pause',
      playIntervalID: null,
      playbackSpeed: 800,
      waitingForInput: false,
      isGameOver: false,
    }
  }

  private startViewer(e) {
    if(!this.viewer) {
      this.viewer = Api.getViewer()
      this.viewer.animateMoves = this.props.settings.animateMoves
      this.viewer.engine.scene.animateWater = this.props.settings.animateWater
      this.viewer.dock(e)
    }
  }

  private isGameOver(status?: MessageContent.StatusReportContent) {
    return status != undefined && this.state.currentTurn == (status.numberOfStates - 1) &&
      (status.gameStatus == 'FINISHED' || status.gameStatus == 'REPLAY') &&
      status.gameResult !== undefined
  }

  private updateViewer() {
    Api.getGameManager().getGameStatus(this.props.gameId).then(status => {
      console.log('updateProgress', {gameName: this.props.name, stateNumber: this.state.currentTurn})
      // Endscreen
      if(!this.state.isGameOver) {
        if(this.isGameOver(status)) {
          this.viewer.showEndscreen(status.gameResult)
          this.setState({isGameOver: true})
        } else {
          this.viewer.hideEndscreen()
        }
      }
      Api.getGameManager().getGameState(this.props.gameId, this.state.currentTurn).then((gameState) => {
        if(this.state.waitingForInput) {
          this.interact(status)
        } else {
          this.viewer.render(new RenderState(gameState, 'none'))
        }
      })
    })
  }

  componentWillUnmount() {
    // no need to update state here, as it will be destroyed!
    if(this.state.playIntervalID !== null) {
      window.clearInterval(this.state.playIntervalID)
    }
    if(this.viewer) {
      this.viewer.stop()
      this.viewer.undock()
    }
    // setting state will not work here, therefore we just clear the interval
    this.deactivatePlayback(this.state)
  }

  componentWillMount() {
    /* when the game is activated, we get the turn which should be displayed
     * from the game manager. This should be the only place where the displayed
     * turn number is received from the game manager. While the component is
     * active, the current turn is stored in the currentTurn state. */
    this.setState({
      currentTurn: Api.getGameManager().getCurrentDisplayStateOnGame(this.props.gameId),
    })
    this.autoPlay()
    setTimeout(() => this.autoPlay(), 100)
  }

  componentDidMount() {
    this.startViewer(this.viewerElement)
  }

  private autoPlay() {
    Api.getGameManager().getGameStatus(this.props.gameId).then((status) => {
      if(!this.isPlaying() && status.gameStatus == 'REQUIRES INPUT') {
        console.log('Input required! Triggering autoPlay...')
        this.playPause()
      }
    })
  }

  interact(status: MessageContent.StatusReportContent) {
    const state = GameState.lift(status.moveRequest.state)

    this.viewer.requestUserInteraction(state, [], (move) => {
      Logger.getLogger().log('Game', 'interact', `Sending move`)
      Api.getGameManager().sendMove(this.props.gameId, status.moveRequest.id, move).then(() => {
        // after sending the move, we want to render it as soon as the server gives out the new game state (because the user should have direct feedback on his move)
        this.waitForNextStatus(status.numberOfStates, () => this.next())
      })
    })
  }

  private waitForNextStatus(currentNumberOfStates: number, callback: () => void) {
    Api.getGameManager().getGameStatus(this.props.gameId).then((status) => {
      if(status.numberOfStates > currentNumberOfStates) {
        callback()
      } else {
        setTimeout(() => this.waitForNextStatus(currentNumberOfStates, callback), 100)
      }
    })
  }

  next() {
    //1. Get a Status report
    Api.getGameManager().getGameStatus(this.props.gameId).then((status) => {
      if(status.numberOfStates > (this.state.currentTurn + 1)) {
        // there is a next state available to display
        this.setState((lastState, props) => {
          let newTurn = lastState.currentTurn + 1
          Api.getGameManager().setCurrentDisplayStateOnGame(props.gameId, newTurn)
          return {currentTurn: newTurn, waitingForInput: false}
        })
      } else {
        // there is no next state available at this time
        if(this.state.currentTurn == status.numberOfStates - 1 && status.gameStatus == 'REQUIRES INPUT' && !this.state.waitingForInput) {
          this.setState({waitingForInput: true})
        }
      }
    })
  }

  previous() {
    if(this.state.currentTurn > 0) {
      this.setState((lastState, props) => {
        let newTurn = Math.max(0, lastState.currentTurn - 1)
        Api.getGameManager().setCurrentDisplayStateOnGame(props.gameId, newTurn)
        return {waitingForInput: false, currentTurn: newTurn}
      })
    }
  }

  private playbackStarted = false

  playPause() {
    this.playbackStarted = true
    this.setState(prev => {
      const next = {...prev}
      next.playPause = this.isPlaying() ? 'pause' : 'play'
      if(next.playPause == 'play') {
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
    if(state.playIntervalID)
      clearInterval(state.playIntervalID)
    state.playIntervalID = window.setInterval(() => this.next(), state.playbackSpeed)
  }

  deactivatePlayback(state: State) {
    if(state.playIntervalID != null) {
      clearInterval(state.playIntervalID)
      state.playIntervalID = null
    }
  }

  isPlaying() {
    return this.state.playPause == 'play'
  }

  setSpeed(newValue: number) {
    this.setState(prev => {
      let next = {...prev, playbackSpeed: newValue}
      if(prev.playIntervalID)
        this.activatePlayback(next)
      // TODO: Pass animationTime to viewer when viewer is react component.
      this.viewer.engine.scene.animationTime = newValue
      return next
    })
  }

  saveReplay() {
    if(!this.props.isReplay) {
      dialog.showSaveDialog(
        {
          title: 'Wähle einen Ort zum Speichern des Replays',
          defaultPath: this.props.name + '.xml',
          filters: [{name: 'Replay-Dateien', extensions: ['xml']}],
        },
        (filename) => {
          // dialog returns undefined when user clicks cancel or an array of strings (paths) if user selected a file
          if(filename) {
            //window.localStorage[localStorageProgramPath] = filenames[0]
            console.log('Attempting to save', filename)
            // TODO send request to server to save the game
            Api.getGameManager().saveReplayOfGame(this.props.gameId, filename)
          }
        },
      )
    }
  }


  render() {
    console.log('Turn:', this.state.currentTurn, 'Game over:', this.state.isGameOver)
    this.updateViewer()

    return <div id="replay-viewer" ref={(elem) => { this.viewerElement = elem }}>
      <div className="replay-controls">
        <div className="button-container">
          <GameButton title={this.isPlaying() ? 'Pause' : 'Los'} resource={this.isPlaying() ? 'pause' : 'play'}
                      onClick={this.playPause.bind(this)}/>
          <GameButton title='Zug zurück' resource='step-backward' onClick={this.previous.bind(this)}/>
          <GameButton title='Zug vor' resource='step-forward' onClick={this.next.bind(this)}/>

          <span style={{fontSize: '13pt', color: 'white', marginLeft: '1em'}}>Zug: {this.state.currentTurn}</span>

          <img alt='speed-icon' className="svg-icon speed-icon" src="resources/tachometer.svg"/>
          <input title="Abspielgeschwindigkeit"
                 className="playbackSpeed"
                 type="range"
                 min="0"
                 max={MAX_PAUSE}
                 step="100"
                 onChange={event => this.setSpeed(MAX_PAUSE - Number(event.target.value))}
                 value={MAX_PAUSE - this.state.playbackSpeed}/>

          <GameButton title='Replay speichern' resource='arrow-to-bottom' onClick={this.saveReplay.bind(this)}
                      className='save'/>
        </div>
      </div>
      {!this.playbackStarted && !this.state.isGameOver &&
      <GameButton id="start-button" title="Los" onClick={this.playPause.bind(this)} resource='play'/>}
    </div>
  }
}

const GameButton: React.FunctionComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & { resource: string }> = props => {
  const {resource, ...otherProps} = props
  return <button {...otherProps}>
    <img alt={props.title} className="svg-icon" src={`resources/${resource}.svg`}/>
  </button>
}