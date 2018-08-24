import { Api } from '../api/Api';
import * as React from 'react';
import * as electron from 'electron';
import { remote } from 'electron';
import { Content } from "react-photonkit";
import { Window, Toolbar, ToolbarActions, ButtonGroup, PaneGroup, Sidebar, RetractableSidebar, Pane, NavGroup, NavTitle, NavItem, Button } from './photon-fix/Components';
import { UnicodeIcon } from './generic-components/Components';
import { Administration } from './Administration';
import { GameCreation } from './GameCreation';
import * as cp from 'child_process';
import { GameCreationOptions, StartType, Replay, Versus, GameType } from '../api/rules/GameCreationOptions';
import { Game } from './Game';
import { LogConsole } from './LogConsole';
import { Logger } from '../api/Logger';
import { ErrorPage } from './ErrorPage';
import { ApplicationStatus } from './ApplicationStatus';
import { Hotfix } from './Hotfix';
import Iframe from 'react-iframe';

const dialog = remote.dialog;
const shell = remote.shell;

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
  Rules
}

interface State {
  menuRetracted: boolean;
  consoleRetracted: boolean;
  contentState: AppContent;
  activeGameId: number;
}

export class App extends React.Component<any, State> {

  constructor(props) {
    super(props);
    this.state = {
      menuRetracted: false,
      consoleRetracted: true,
      contentState: Hotfix.isGameReload() ? AppContent.GameWaiting : AppContent.Empty,
      activeGameId: null
    };
    Hotfix.init((gco => {
      Api.getGameManager().createGame(gco, info => {
        this.showGame(info.id);
      });
    }).bind(this));
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
          //window.localStorage[localStorageProgramPath] = filenames[0];
          console.log("Attempting to load " + filenames[0]);
          var liofs = filenames[0].lastIndexOf('/');
          if (liofs == -1) {
            liofs = filenames[0].lastIndexOf('\\');
          }
          var replayName = filenames[0];
          if (liofs != -1) {
            replayName = replayName.substring(liofs + 1);
          }
          var liofp = replayName.lastIndexOf('.');
          if (liofp != -1) {
            replayName = replayName.substring(0, liofp);
          }
          let gco: Replay = {
            gameId: Api.getGameManager().createGameId(replayName, true),
            gameName: replayName,
            kind: GameType.Replay,
            path: filenames[0]
          };
          //new GameCreationOptions(null, null, filenames[0], StartType.Replay, null, null, null, null, replayName);
          Api.getGameManager().createGame(gco, info => {
            this.showGame(info.id);
          });
          //Hotfix.reloadIntoGame(gco);
        }
      }
    );
  }

  private startGameWithOptions(o: Versus) {
    //Hotfix.reloadIntoGame(o);
    Api.getGameManager().createGame(o, info => {
      this.showGame(info.id);
    });
    Logger.getLogger().log('App', 'startGameWithOptions', 'starting game with options: ' + JSON.stringify(o));
  }

  private toggleMenu() {
    this.setState((prev, props) => {
      return {...prev, menuRetracted: !prev.menuRetracted};
    });
  }

  private toggleConsole() {
    this.setState((prev, props) => {
      return {...prev, consoleRetracted: !prev.consoleRetracted};
    });
  }

  private showGame(gameId: number) {
    console.log("Switching to game with id " + gameId);
    /* FIXME: Game.tsx depends on a componentWillUnmount call when switching to
    another game. But React doesn't unmount the Game component if we are just
    switching between two games (keeping contentState at AppContent.GameLive).
    So we are switching to GameWaiting before to trigger an unmount. The
    expectation was that changing the props always unmounts the component, but
    this seems not to be true. Better move the code out of the unmount callback
    and research how to listen for property changes. */
    this.refreshContent(AppContent.GameWaiting)
    this.setState((prev, _props) => {
      return {...prev, contentState: AppContent.GameWaiting};
    }, () =>
      this.setState((prev, _props) => {
        return {...prev, contentState: AppContent.GameLive, activeGameId: gameId};
      }));
    document.getElementById('game-name').innerText = Api.getGameManager().getGameInfo(gameId).name;
  }

  private show(content: AppContent) {
    this.setState((prev, props) => {
      return {...prev, contentState: content};
    });
  }

  private refreshContent(inbetween: AppContent = AppContent.Blank) {
    const previousState = this.state.contentState
    this.setState((prev, _props) => {
      return {...prev, contentState: inbetween};
    }, () => { this.setState((prev, _props) => {
      console.log("Setting state to", previousState)
      return {...prev, contentState: previousState};
    }) });
  }

  changeGameName(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      var newGameName = document.getElementById('game-name').innerText.trim();
      console.log(newGameName);
      Api.getGameManager().renameGame(this.state.activeGameId, newGameName);
      Api.getGameManager().hasGame(newGameName, () => {
        document.getElementById('game-name').blur();
        this.setState((prev, _props) => {
          return {...prev, activeGame: newGameName};
        });
      });
    }
  }

  closeGame(id: number) {
    console.log("Closing game "+id)
    Api.getGameManager().deleteGame(id);
    this.setState((prev, _props) => {
      return {...prev, contentState: AppContent.Empty};
    });
  }

  render() {
    var mainPaneContent;
    switch (this.state.contentState) {
      case AppContent.Administration:
        mainPaneContent = <Administration />;
        break;
      case AppContent.GameCreation:
        mainPaneContent = <GameCreation gameCreationCallback={o => this.startGameWithOptions(o)} />;
        break;
      case AppContent.GameLive:
        console.log("activeGameId: " + this.state.activeGameId);
        mainPaneContent = <Game gameId={this.state.activeGameId} name={Api.getGameManager().getGameInfo(this.state.activeGameId).name} isReplay={Api.getGameManager().getGameInfo(this.state.activeGameId).isReplay} />;
        break;
      case AppContent.Blank:
        mainPaneContent = <div/>;
        break;
      case AppContent.Error:
        mainPaneContent = <ErrorPage Title="Schlimmer Fehler" Message="Das Programm ist kaputt." />;
        break;
      case AppContent.Rules:
        mainPaneContent = <Iframe url="https://cau-kiel-tech-inf.github.io/socha-enduser-docs/spiele/piranhas/" />;
        break;
      case AppContent.Help:
        mainPaneContent = <div>
          <button className="top-wide" onClick={() => shell.openExternal("https://cau-kiel-tech-inf.github.io/socha-enduser-docs/#die-programmoberfl%C3%A4che")}>Extern öffnen</button>
          <Iframe styles={{height: "calc(100% - 2em)"}} url="https://cau-kiel-tech-inf.github.io/socha-enduser-docs/#die-programmoberfl%C3%A4che" />
        </div>;
        break;
      case AppContent.Log:
        mainPaneContent = <Iframe url={Logger.getLogger().getLogFilePath()} />;
        break;
      case AppContent.GameWaiting:
        mainPaneContent = <h1>Warte auf Spielstart</h1>;
        break;
      default:
        mainPaneContent =
          <div className="main-container">
            <img src="resources/piranhas/piranhas-logo.png" style={{width: "100%"}} />
            <h1>Willkommen bei der Software-Challenge!</h1>
            <p>Klicken Sie links auf "Neues Spiel" um zu beginnen.</p>
            <p>Diese frühe Version hat noch einige Fehler. Bitte melden Sie Fehler, die Sie finden, im Forum oder im Discord. Hinweise zur Ursache von Fehlern finden sich im Log, aufrufbar über "Programm-Log" auf der linken Seite.</p>
            <p><a href="https://cau-kiel-tech-inf.github.io/socha-enduser-docs/#die-programmoberfl%C3%A4che" target="_blank">Bedienungsanleitung (aus der allgemeinen Dokumentation)</a></p>
          </div>;
        break;
    }

    //TODO: Fix renaming
    return (
      <Window>
        <Toolbar>
          <ToolbarActions>
            <ButtonGroup>
              <Button icon="menu" onClick={() => { this.toggleMenu(); }} active={!this.state.menuRetracted} />
            </ButtonGroup>
            {this.state.contentState == AppContent.GameLive ? <span id="game-name" contentEditable={/*!Api.getGameManager().isReplay(this.state.activeGame)*/ true} onKeyDown={this.changeGameName.bind(this)} /> : null}
            {this.state.contentState == AppContent.GameLive ? <button title="Close Game" className="svg-button close-game" onClick={() => this.closeGame(this.state.activeGameId)}><img className="svg-icon" src="resources/x-circled.svg" /></button> : null}
            <Button icon="doc-text" onClick={() => { this.toggleConsole(); }} pullRight={true} />
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
                    <UnicodeIcon icon="🎳" />{t.name} ({t.id})<span className="close-button-container"><button title="Close Game" className="svg-button close-game" onClick={e => { this.closeGame(t.id); e.stopPropagation() }}><img className="svg-icon" src="resources/x-circled.svg" /></button></span></NavItem>
                  ))}
                <NavTitle title="Informationen" />
                <NavItem key="rules" onClick={() => this.show(AppContent.Rules)}>
                  <UnicodeIcon icon="❔" />Spielregeln
                </NavItem>
                <NavItem key="help" onClick={() => this.show(AppContent.Help)}>
                  <UnicodeIcon icon="❔" />Hilfe
                </NavItem>
                <NavItem key="log" onClick={() => this.show(AppContent.Log)}>
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
    );
  }
}
