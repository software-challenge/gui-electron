import { Menu }                                                                                      from './Menu'

const { ipcRenderer } = require('electron')
import { Api }                                                                                       from '../api/Api'
import * as React                                                                                    from 'react'
import { remote }                                                                                    from 'electron'
import { Content }                                                                                   from 'react-photonkit'
import { Button, ButtonGroup, Pane, PaneGroup, RetractableSidebar, Toolbar, ToolbarActions, Window } from './photon-fix/Components'
import { UnicodeIcon }                                                                               from './generic-components/Components'
import { Administration }                                                                            from './Administration'
import { GameCreation }                                                                              from './GameCreation'
import { GameCreationOptions, GameType, Replay }                                                     from '../api/rules/GameCreationOptions'
import { Game }                                                                                      from './Game'
import { LogConsole }                                                                                from './LogConsole'
import { Logger }                                                                                    from '../api/Logger'
import { ErrorPage }                                                                                 from './ErrorPage'
import { Hotfix }                                                                                    from './Hotfix'
import * as v                                                                                        from 'validate-typescript'
import { loadFromStorage, saveToStorage }                                                            from '../helpers/Cache'
import { GameInfo }                                                                                  from '../api/synchronous/GameInfo'
import { ExecutableStatus }                                                                          from '../api/rules/ExecutableStatus'
import { NavGroup, NavItem, NavTitle }                                                               from './photon-fix/NavComponents'
import promiseRetry                                                                                  from 'promise-retry'
import Func = jasmine.Func

const dialog = remote.dialog
const shell = remote.shell

const appSettingsKey = 'appSettings'

export enum AppContent {
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
  animateMoves: boolean
  animateWater: boolean
  logDir: string
}

export class App extends React.Component<any, State> {
  private readonly menu: React.RefObject<Menu>

  constructor(props) {
    super(props)
    this.state = {
      menuRetracted:    require('electron').remote.app.commandLine.hasSwitch('kiosk'),
      consoleRetracted: true,
      contentState:     Hotfix.isGameReload() ? AppContent.GameWaiting : (require('electron').remote.app.commandLine.hasSwitch('kiosk') ? AppContent.GameCreation : AppContent.Empty),
      activeGameId:     null,
      serverPort:       null,
      settings:         loadFromStorage(appSettingsKey, {
        animateMoves: v.Type(Boolean),
        animateWater: v.Type(Boolean),
        logDir:       v.Type(String),
      }, {
        animateMoves: true,
        animateWater: true,
        logDir:       '.',
      }),
    }

    this.menu = React.createRef()

    ipcRenderer.on('showGame', (event, gameId) => {
      this.showGame(gameId)
    })
    ipcRenderer.on('closeGame', (event, gameId) => {
      this.closeGame(gameId)
    })

  }

  private loadReplay() {
    dialog.showOpenDialog(
      null,
      {
        title:      'Wähle ein Replay',
        properties: ['openFile'],
      }).then(result => {
      // dialog returns undefined when user clicks cancel or an array of strings (paths) if user selected a file
      if (!result.canceled && result.filePaths.length > 0 && result.filePaths[0]) {
        //window.localStorage[localStorageProgramPath] = filenames[0]
        console.log('Attempting to load ' + result.filePaths[0])
        let liofs = result.filePaths[0].lastIndexOf('/')
        if (liofs == -1) {
          liofs = result.filePaths[0].lastIndexOf('\\')
        }
        let replayName = result.filePaths[0]
        if (liofs != -1) {
          replayName = replayName.substring(liofs + 1)
        }
        const liofp = replayName.lastIndexOf('.')
        if (liofp != -1) {
          replayName = replayName.substring(0, liofp)
        }
        let gco: Replay = {
          gameId:   Api.getGameManager().createGameId(replayName, true),
          gameName: replayName,
          kind:     GameType.Replay,
          path:     result.filePaths[0],
        }
        this.startGameWithOptions(gco)
      }
    })
  }

  private startGameWithOptions(o: GameCreationOptions): Promise<GameInfo> {
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
    console.log('Switching to game with id', gameId)
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
        activeGameId: gameId,
      }),
    )
  }

  public show(content: AppContent, callback?: () => void) {
    this.setState({
      contentState: content,
    }, callback)
  }

  private refreshContent(inbetween: AppContent = AppContent.Blank) {
    const previousState = this.state.contentState
    this.show(inbetween, () => {
      this.show(previousState)
    })
  }

  componentDidMount() {
    promiseRetry(retry => Api.getGameManager().getGameServerStatus().then(info => {
      this.setState({ serverPort: info.port })
      if (info.status == ExecutableStatus.Status.ERROR || info.status == ExecutableStatus.Status.EXITED) {
        Logger.getLogger().logError('App', 'server', 'Server status ' + info.status.toString() + ': ' + info.error, info.error)
        alert('Es gab einen Fehler beim Starten des Game-Servers, das Programm wird wahrscheinlich nicht funktionieren!\n' +
          (info.error ? 'Fehler: ' + info.error : 'Ist Java installiert?'))
      }
    }).catch(retry))
  }

  closeGame(id: number) {
    console.log('Closing game ' + id)
    Api.getGameManager().deleteGame(id)
    if (require('electron').app.commandLine.hasSwitch('kioskMode')) {
      this.show(AppContent.GameCreation)
    } else {
      this.show(AppContent.Empty)
    }
  }

  showHtml(url: string) {
    return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <button className="top-wide" onClick={() => shell.openExternal(url)}>Extern öffnen</button>
      <iframe style={{ flex: 1, border: 0 }} src={url}/>
    </div>
  }

  render() {
    let mainPaneContent
    switch (this.state.contentState) {
      case AppContent.Administration:
        mainPaneContent =
          <Administration settings={this.state.settings} setter={(newSettings: Partial<AppSettings>) => {
            this.setState({ settings: { ...this.state.settings, ...newSettings } },
              () => saveToStorage(appSettingsKey, this.state.settings))
            if (newSettings.logDir != null) {
              window.localStorage['logDir'] = newSettings.logDir
            }
          }}/>
        break
      case AppContent.GameCreation:
        mainPaneContent =
          <GameCreation serverPort={this.state.serverPort} createGame={o => this.startGameWithOptions(o)}/>
        break
      case AppContent.GameLive:
        console.log('activeGameId: ' + this.state.activeGameId)
        mainPaneContent =
          <Game gameId={this.state.activeGameId} name={Api.getGameManager().getGameInfo(this.state.activeGameId).name}
                isReplay={Api.getGameManager().getGameInfo(this.state.activeGameId).isReplay}
                settings={this.state.settings}/>
        break
      case AppContent.Blank:
        mainPaneContent = <div/>
        break
      case AppContent.Error:
        mainPaneContent = <ErrorPage Title="Schlimmer Fehler" Message="Das Programm ist kaputt."/>
        break
      case AppContent.Rules:
        mainPaneContent = this.showHtml('https://cau-kiel-tech-inf.github.io/socha-enduser-docs/spiele/hive/')
        break
      case AppContent.Help:
        mainPaneContent = this.showHtml('https://cau-kiel-tech-inf.github.io/socha-enduser-docs/server.html#die-programmoberfl%C3%A4che')
        break
      case AppContent.Quickstart:
        mainPaneContent = this.showHtml('https://cau-kiel-tech-inf.github.io/socha-enduser-docs/getting-started')
        break
      case AppContent.JavaDocs:
        mainPaneContent = this.showHtml('https://www.software-challenge.de/javadocs/')
        break
      case AppContent.Log:
        const logger = Logger.getLogger()
        mainPaneContent = <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <button className="top-wide" onClick={() => {
            logger.clearLog()
            this.refreshContent()
          }}>Log leeren
          </button>
          <div style={{
            position:        'absolute',
            top:             '2em',
            width:           'calc(100% - 230px)',
            backgroundColor: '#eee',
          }}>Logdatei: {logger.getLogFilePath()}</div>
          <iframe style={{ flex: 1, border: 0, overflow: 'scroll' }}
                  src={logger.getLogFilePath()}
                  onLoad={() => {
                    document.querySelector('iframe')
                      .contentWindow
                      .document
                      .querySelector('body').style.overflowY = 'scroll'
                  }}/>
        </div>
        break
      case AppContent.GameWaiting:
        mainPaneContent = <div>
          <h1>Warte auf Spielstart</h1>
          <div id="errors"/>
        </div>
        break
      default:
        mainPaneContent =
          <div className="main-container">
            <div className="content">
              <h1>Willkommen bei der Software-Challenge!</h1>
              <p>Klicken Sie links auf "Neues Spiel" um zu beginnen.</p>
              <p>Diese frühe Version hat noch einige Fehler. Bitte melden Sie Fehler, die Sie finden, im Forum oder im
                Discord. Hinweise zur Ursache von Fehlern finden sich im Log, aufrufbar über "Programm-Log" auf der
                linken Seite.</p>
              <p><a href="https://cau-kiel-tech-inf.github.io/socha-enduser-docs/#die-programmoberfl%C3%A4che"
                    target="_blank">Bedienungsanleitung (aus der allgemeinen Dokumentation)</a></p>
            </div>
          </div>
        break
    }

    const app = this

    function ContentNavItem(props: { icon: string, text: string, content: AppContent }) {
      return <NavItem icon={props.icon} text={props.text} onClick={() => app.show(props.content)}
                      active={app.state.contentState == props.content}/>
    }

    if (require('electron').remote.app.commandLine.hasSwitch('kiosk')) {
      return <Window>
        <Content>
          <PaneGroup>
            <Pane>
              {mainPaneContent}
            </Pane>
          </PaneGroup>
        </Content>
      </Window>
    }

    return <Menu app={this.show.bind(this)}/>


    /*<Window>
     <Toolbar>
     <ToolbarActions>
     <ButtonGroup>
     <Button icon="menu" onClick={() => this.toggleMenu()} active={!this.state.menuRetracted}/>
     </ButtonGroup>
     {this.state.contentState == AppContent.GameLive ?
     <button title="Close Game" className="svg-button close-game"
     onClick={() => this.closeGame(this.state.activeGameId)}>
     <img className="svg-icon" src={'resources/x-circled.svg'} alt="Close Game"/>
     </button> : null}
     <Button icon="doc-text" onClick={() => { this.toggleConsole() }} pullRight={true}/>
     </ToolbarActions>
     </Toolbar>
     <Content>
     <PaneGroup>
     <RetractableSidebar retracted={this.state.menuRetracted}>
     <NavGroup>
     <NavTitle title="Spiele"/>
     <ContentNavItem key="new" content={AppContent.GameCreation} icon="+" text="Neues Spiel"/>
     <NavItem key="replay" onClick={() => this.loadReplay()} icon="↥" text="Replay laden"/>
     {Api.getGameManager().getGameInfos().map(
     t => (<NavItem key={t.id} onClick={() => this.showGame(t.id)}
     active={this.state.contentState == AppContent.GameLive && this.state.activeGameId == t.id}>
     <UnicodeIcon icon="🎳"/>{t.name} ({t.id})
     <span className="close-button-container">
     <button title="Close Game" className="svg-button close-game" onClick={e => {
     this.closeGame(t.id)
     e.stopPropagation()
     }}>
     <img className="svg-icon" src={'resources/x-circled.svg'} alt={'Close Game'}/></button></span></NavItem>
     ))}

     <NavTitle title="Informationen"/>
     <ContentNavItem key="settings" content={AppContent.Administration} icon="⚙" text="Einstellungen"/>
     <ContentNavItem key="rules" content={AppContent.Rules} icon="❔" text="Spielregeln"/>
     <ContentNavItem key="help" content={AppContent.Help} icon="❔" text="Hilfe"/>
     <ContentNavItem key="quickstart" content={AppContent.Quickstart} icon="❔" text="Getting Started"/>
     <ContentNavItem key="javadocs" content={AppContent.JavaDocs} icon="❔" text="JavaDocs"/>
     <ContentNavItem key="log" content={AppContent.Log} icon="📜" text="Logs"/>
     </NavGroup>
     </RetractableSidebar>
     <Pane>
     {mainPaneContent}
     </Pane>
     <RetractableSidebar className="wide" retracted={this.state.consoleRetracted}>
     {this.state.activeGameId ? <LogConsole gameId={this.state.activeGameId}/> : <div/>}
     </RetractableSidebar>
     </PaneGroup>
     </Content>
     </Window>*/
  }
}
