import { Api } from '../api/Api'
import * as React from 'react'
import * as electron from 'electron'
import { remote } from 'electron'
import { Content } from "react-photonkit"
import { Window, Toolbar, ToolbarActions, ButtonGroup, PaneGroup, Sidebar, RetractableSidebar, Pane, NavGroup, NavTitle, NavItem, Button } from './photon-fix/Components'
import { UnicodeIcon } from './generic-components/Components'
import { Administration } from './Administration'
import { GameCreation } from './GameCreation'
import { Replay, Versus, GameType, GameCreationOptions } from '../api/rules/GameCreationOptions'
import { Game } from './Game'
import { LogConsole } from './LogConsole'
import { Logger } from '../api/Logger'
import { ErrorPage } from './ErrorPage'
import { Hotfix } from './Hotfix'
import Iframe from 'react-iframe'
import * as v from 'validate-typescript'
import { loadFromStorage, saveToStorage } from '../helpers/Cache'
import { GameInfo } from '../api/synchronous/GameInfo';
import { ExecutableStatus } from '../api/rules/ExecutableStatus';

const dialog = remote.dialog
const shell = remote.shell

const appSettings = "appSettings"

enum AppContent {
  Empty,
  Blank,
  GameCreation,
  GameLive,
  GameWaiting,
  Administration,
  Error,
  Log,
  Help,
  Rules,
  Quickstart,
  JavaDocs
}

interface State {
  menuRetracted: boolean
  consoleRetracted: boolean
  contentState: AppContent
  activeGameId: number
  serverPort: number
  settings: AppSettings
}

export interface AppSettings {
  animateViewer: boolean
  logDir: string
}

export class App extends React.Component<any, State> {

  constructor(props) {
    super(props)
    this.state = {
      menuRetracted: false,
      consoleRetracted: true,
      contentState: Hotfix.isGameReload() ? AppContent.GameWaiting : AppContent.Empty,
      activeGameId: null,
      serverPort: null,
      settings: loadFromStorage(appSettings, {
          animateViewer: v.Type(Boolean),
          logDir: v.Type(String)
        }, {
          animateViewer: true,
          logDir: "."
        }),
    }
    Hotfix.init((gco => {
      this.startGameWithOptions(gco)
    }).bind(this))
  }

  private loadReplay() {
    dialog.showOpenDialog(
      {
        title: "Wähle ein Replay",
        properties: ["openFile"]
      },
      (filenames) => {
        // dialog returns undefined when user clicks cancel or an array of strings (paths) if user selected a file
        if (filenames && filenames.length > 0 && filenames[0]) {
          //window.localStorage[localStorageProgramPath] = filenames[0]
          console.log("Attempting to load " + filenames[0])
          var liofs = filenames[0].lastIndexOf('/')
          if (liofs == -1) {
            liofs = filenames[0].lastIndexOf('\\')
          }
          var replayName = filenames[0]
          if (liofs != -1) {
            replayName = replayName.substring(liofs + 1)
          }
          var liofp = replayName.lastIndexOf('.')
          if (liofp != -1) {
            replayName = replayName.substring(0, liofp)
          }
          let gco: Replay = {
            gameId: Api.getGameManager().createGameId(replayName, true),
            gameName: replayName,
            kind: GameType.Replay,
            path: filenames[0]
          }
          //new GameCreationOptions(null, null, filenames[0], StartType.Replay, null, null, null, null, replayName)
          this.startGameWithOptions(gco)
        }
      }
    )
  }

  private startGameWithOptions(o: GameCreationOptions): Promise<GameInfo> {
    //Hotfix.reloadIntoGame(o)
    Logger.getLogger().log('App', 'startGameWithOptions', 'starting game with options: ' + JSON.stringify(o))
    return Api.getGameManager().createGame(o).then(info => {
      this.showGame(info.id)
      return info
    })
  }

  private toggleMenu() {
    this.setState({ menuRetracted: !this.state.menuRetracted })
  }

  private toggleConsole() {
    this.setState({ consoleRetracted: !this.state.consoleRetracted })
  }

  private showGame(gameId: number) {
    console.log("Switching to game with id", gameId)
    /* FIXME: Game.tsx depends on a componentWillUnmount call when switching to
    another game. But React doesn't unmount the Game component if we are just
    switching between two games (keeping contentState at AppContent.GameLive).
    So we are switching to GameWaiting before to trigger an unmount. The
    expectation was that changing the props always unmounts the component, but
    this seems not to be true. Better move the code out of the unmount callback
    and research how to listen for property changes. */
    this.show(AppContent.GameWaiting, () =>
      this.setState({
        contentState: AppContent.GameLive,
        activeGameId: gameId
      }))
    document.getElementById('game-name').innerText = Api.getGameManager().getGameInfo(gameId).name
  }

  private show(content: AppContent, callback?: () => void) {
    this.setState({
      contentState: content
    }, callback)
  }

  private refreshContent(inbetween: AppContent = AppContent.Blank) {
    const previousState = this.state.contentState
    this.show(inbetween, () => {
      this.show(previousState)
    })
  }

  private retry<T>(fn: () => Promise<T>, ms: number = 1000, retries: number = 5): Promise<T> {
    return new Promise((resolve, reject) => {
      fn()
        .then(resolve)
        .catch(() => {
          setTimeout(() => {
            if (retries == 0) {
              return reject('maximum retries exceeded')
            }
            this.retry(fn, ms, retries - 1).then(resolve)
          }, ms)
        })
    })
  }

  componentDidMount() {
    this.retry(
      () => Api.getGameManager().getGameServerStatus().then(info => {
        this.setState({ serverPort: info.port })
        if(info.status == ExecutableStatus.Status.ERROR || info.status == ExecutableStatus.Status.EXITED) {
          Logger.getLogger().logError("App", "server", "Server status " + info.status.toString() + ": " + info.error, info.error)
          alert("Es gab einen Fehler beim Starten des Game-Servers, das Programm wird wahrscheinlich nicht funktionieren!\n"+
            "Fehler: " + info.error)
        }
      })
    )
  }

  changeGameName(e) {
    if (e.keyCode == 13) {
      e.preventDefault()
      var newGameName = document.getElementById('game-name').innerText.trim()
      console.log(newGameName)
      Api.getGameManager().renameGame(this.state.activeGameId, newGameName)
      Api.getGameManager().hasGame(newGameName, () => {
        document.getElementById('game-name').blur()
        this.setState((prev, _props) => {
          return { ...prev, activeGame: newGameName }
        })
      })
    }
  }

  closeGame(id: number) {
    console.log("Closing game " + id)
    Api.getGameManager().deleteGame(id)
    this.show(AppContent.Empty)
  }

  showHtml(url: string) {
    return <div>
      <button className="top-wide" onClick={() => shell.openExternal(url)}>Extern öffnen</button>
      <Iframe styles={{ height: "calc(100% - 2em)" }} url={url} />
    </div>
  }

  render() {
    var mainPaneContent
    switch (this.state.contentState) {
      case AppContent.Administration:
        mainPaneContent = <Administration settings={this.state.settings} setter={(newSettings: Partial<AppSettings>) => {
          this.setState({ settings: { ...this.state.settings, ...newSettings } },
            () => saveToStorage(appSettings, this.state.settings))
          if (newSettings.logDir != null)
            window.localStorage["logDir"] = newSettings.logDir
        }} />
        break
      case AppContent.GameCreation:
        mainPaneContent = <GameCreation serverPort={this.state.serverPort} createGame={o => this.startGameWithOptions(o)} />
        break
      case AppContent.GameLive:
        console.log("activeGameId: " + this.state.activeGameId)
        mainPaneContent = <Game gameId={this.state.activeGameId} name={Api.getGameManager().getGameInfo(this.state.activeGameId).name} isReplay={Api.getGameManager().getGameInfo(this.state.activeGameId).isReplay} animateViewer={this.state.settings.animateViewer} />
        break
      case AppContent.Blank:
        mainPaneContent = <div />
        break
      case AppContent.Error:
        mainPaneContent = <ErrorPage Title="Schlimmer Fehler" Message="Das Programm ist kaputt." />
        break
      case AppContent.Rules:
        mainPaneContent = this.showHtml("https://cau-kiel-tech-inf.github.io/socha-enduser-docs/spiele/piranhas/")
        break
      case AppContent.Help:
        mainPaneContent = this.showHtml("https://cau-kiel-tech-inf.github.io/socha-enduser-docs/#die-programmoberfl%C3%A4che")
        break
      case AppContent.Quickstart:
        mainPaneContent = this.showHtml("https://cau-kiel-tech-inf.github.io/socha-enduser-docs/getting-started")
        break
      case AppContent.JavaDocs:
        mainPaneContent = this.showHtml("https://www.software-challenge.de/javadocs/")
        break
      case AppContent.Log:
        let logger = Logger.getLogger()
        mainPaneContent = <div>
          <button className="top-wide" onClick={() => { logger.clearLog(); this.refreshContent() }}>Log leeren</button>
          <Iframe styles={{ height: "calc(100% - 2em)" }} url={logger.getLogFilePath()} />
          <div style={{ position: "absolute", backgroundColor: "#eee", width: "calc(100% - 220px)" }}>Logdatei: {logger.getLogFilePath()}</div>
        </div>
        break
      case AppContent.GameWaiting:
        mainPaneContent = <h1>Warte auf Spielstart</h1>
        break
      default:
        mainPaneContent =
          <div className="main-container">
            <div className="content">
              <h1>Willkommen bei der Software-Challenge!</h1>
              <p>Klicken Sie links auf "Neues Spiel" um zu beginnen.</p>
              <p>Diese frühe Version hat noch einige Fehler. Bitte melden Sie Fehler, die Sie finden, im Forum oder im Discord. Hinweise zur Ursache von Fehlern finden sich im Log, aufrufbar über "Programm-Log" auf der linken Seite.</p>
              <p><a href="https://cau-kiel-tech-inf.github.io/socha-enduser-docs/#die-programmoberfl%C3%A4che" target="_blank">Bedienungsanleitung (aus der allgemeinen Dokumentation)</a></p>
            </div>
          </div>
        break
    }

    //TODO: Fix renaming
    return (
      <Window>
        <Toolbar>
          <ToolbarActions>
            <ButtonGroup>
              <Button icon="menu" onClick={() => { this.toggleMenu() }} active={!this.state.menuRetracted} />
            </ButtonGroup>
            {this.state.contentState == AppContent.GameLive ? <span id="game-name" contentEditable={/*!Api.getGameManager().isReplay(this.state.activeGame)*/ true} onKeyDown={this.changeGameName.bind(this)} /> : null}
            {this.state.contentState == AppContent.GameLive ? <button title="Close Game" className="svg-button close-game" onClick={() => this.closeGame(this.state.activeGameId)}><img className="svg-icon" src="resources/x-circled.svg" /></button> : null}
            <Button icon="doc-text" onClick={() => { this.toggleConsole() }} pullRight={true} />
          </ToolbarActions>
        </Toolbar>
        <Content>
          <PaneGroup>
            <RetractableSidebar retracted={this.state.menuRetracted}>
              <NavGroup>
                <NavTitle title="Spiele" />
                <NavItem key="new" onClick={() => this.show(AppContent.GameCreation)} active={this.state.contentState == AppContent.GameCreation}>
                  <UnicodeIcon icon="+" />Neues Spiel
                </NavItem>
                <NavItem key="replay" onClick={() => this.loadReplay()}>
                  <UnicodeIcon icon="↥" />Replay laden
                </NavItem>
                {Api.getGameManager().getBufferedGameTitles().map(
                  t => (<NavItem key={t.id} onClick={() => this.showGame(t.id)} active={this.state.contentState == AppContent.GameLive && this.state.activeGameId == t.id}>
                    <UnicodeIcon icon="🎳" />{t.name} ({t.id})
                    <span className="close-button-container">
                      <button title="Close Game" className="svg-button close-game" onClick={e => { this.closeGame(t.id); e.stopPropagation() }}>
                        <img className="svg-icon" src="resources/x-circled.svg" /></button></span></NavItem>
                  ))}
                <NavTitle title="Informationen" />
                <NavItem key="settings" onClick={() => this.show(AppContent.Administration)} active={this.state.contentState == AppContent.Administration}>
                  <UnicodeIcon icon="⚙" />Einstellungen
                </NavItem>
                <NavItem key="rules" onClick={() => this.show(AppContent.Rules)} active={this.state.contentState == AppContent.Rules}>
                  <UnicodeIcon icon="❔" />Spielregeln
                </NavItem>
                <NavItem key="help" onClick={() => this.show(AppContent.Help)} active={this.state.contentState == AppContent.Help}>
                  <UnicodeIcon icon="❔" />Hilfe
                </NavItem>
                <NavItem key="quickstart" onClick={() => this.show(AppContent.Quickstart)} active={this.state.contentState == AppContent.Quickstart}>
                  <UnicodeIcon icon="❔" />Getting Started
                </NavItem>
                <NavItem key="javadocs" onClick={() => this.show(AppContent.JavaDocs)} active={this.state.contentState == AppContent.JavaDocs}>
                  <UnicodeIcon icon="❔" />JavaDocs
                </NavItem>
                <NavItem key="log" onClick={() => this.show(AppContent.Log)} active={this.state.contentState == AppContent.Log}>
                  <UnicodeIcon icon="📜" />Programm-Log
                </NavItem>
              </NavGroup>
            </RetractableSidebar>
            <Pane>
              {mainPaneContent}
            </Pane>
            <RetractableSidebar className="wide" retracted={this.state.consoleRetracted}>
              {this.state.activeGameId ? <LogConsole gameId={this.state.activeGameId} /> : <div />}
            </RetractableSidebar>
          </PaneGroup>
        </Content >
      </Window >
    )
  }
}
