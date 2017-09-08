import * as React from 'react';
import * as electron from 'electron';
import { remote } from 'electron';
import Server from './Server';
import { Content } from "react-photonkit";
import { Window, Toolbar, ToolbarActions, ButtonGroup, PaneGroup, Sidebar, RetractableSidebar, Pane, NavGroup, NavTitle, NavItem, Button } from './photon-fix/Components';
import { UnicodeIcon } from './generic-components/Components';
import { Administration } from './Administration';
import { GameCreation } from './GameCreation';
import * as cp from 'child_process';
import { GameCreationOptions } from '../api/GameCreationOptions';
import { Game } from './Game';
import { LogConsole } from './LogConsole';

const dialog = remote.dialog;

enum AppContent {
  Empty,
  GameCreation,
  GameLive,
  GameEnded,
  GameReplay,
  Administration
}

interface State {
  menuRetracted: boolean
  consoleRetracted: boolean
  contentState: AppContent
  activeGame: string
}

export class App extends React.Component<any, State> {
  private gameCreationOptions;
  private replayPath:string;
  constructor() {
    super();
    this.state = {
      menuRetracted: false,
      consoleRetracted: true,
      contentState: AppContent.Empty,
      activeGame: null
    }
  }

  private toggleMenu() {
    this.setState((prev, props) => {
      prev.menuRetracted = !prev.menuRetracted;
      return prev;
    });
  }

  private toggleConsole() {
    this.setState((prev, props) => {
      prev.consoleRetracted = !prev.consoleRetracted;
      return prev;
    });
  }

  private switchToAdministration() {
    this.setState((prev, props) => {
      prev.contentState = AppContent.Administration;
      return prev;
    });
  }

  private switchToNewGame() {
    this.setState((prev, props) => {
      prev.contentState = AppContent.GameCreation;
      return prev;
    });
  }

  private loadReplay() {
    dialog.showOpenDialog(
      {
        title: "Wähle ein Replay",
        properties: ["openFile"]
      },
      (filenames) => {
        // dialog returns undefined when user clicks cancel or an array of strings (paths) if user selected a file
        if (filenames && filenames.length > 0) {
          //window.localStorage[localStorageProgramPath] = filenames[0];
          this.replayPath = filenames[0];
          this.setState((prev, _props) => {
            prev.contentState = AppContent.GameReplay;
            return prev;
          });
        }
      }
    );
  }

  private startGameWithOptions(o: GameCreationOptions) {
    console.log(this);
    this.gameCreationOptions = o;
    console.log('starting game with options: ' + JSON.stringify(o));
    this.setState((prev, props) => {
      prev.contentState = AppContent.GameLive;
      return prev;
    });
    this.forceUpdate();
  }

  private setActiveGameName(name: string) {
    this.setState((prev, props) => {
      prev.activeGame = name;
      console.log("Active game: " + name);
      return prev;
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
        console.log("starting game");
        mainPaneContent = <Game options={this.gameCreationOptions} nameCallback={n => /*this.setActiveGameName(n)*/ console.log(n)} />
        break;
      case AppContent.GameReplay:
        console.log("starting replay");
        mainPaneContent = <Game options={this.replayPath} nameCallback={n => console.log(n)} />
        break;
      default:
        mainPaneContent =
          <div className="main-container">
            <h1>Willkommen bei der Software-Challenge!</h1>
            <p>Klicken Sie links auf "Neues Spiel" um zu beginnen.</p>
            <p>Diese frühe Version hat noch einige Fehler. Bitte melden Sie Fehler, die Sie finden, im Forum. Bei Problemen hilft oft ein Neustart des Programms.</p>
            <p><a href="https://cau-kiel-tech-inf.github.io/socha-enduser-docs/#die-programmoberfl%C3%A4che" target="_blank">Bedienungsanleitung (aus der allgemeinen Dokumentation)</a></p>
          </div>
        break;
    }

    return (
      <Window>
        <Toolbar>
          <ToolbarActions>
            <ButtonGroup>
              <Button icon="menu" onClick={() => { this.toggleMenu() }} active={!this.state.menuRetracted} />
            </ButtonGroup>
            <Button icon="doc-text" onClick={() => { this.toggleConsole() }} pullRight={true} />
          </ToolbarActions>
        </Toolbar>
        <Content>
          <PaneGroup>
            <RetractableSidebar retracted={this.state.menuRetracted}>
              <NavGroup>
                <NavTitle title="Spiele" />
                <NavItem onClick={() => this.switchToNewGame()} active={this.state.contentState == AppContent.GameCreation}>
                  <UnicodeIcon icon="+" />Neues Spiel
                </NavItem>
                <NavItem onClick={() => this.loadReplay()}>
                  <UnicodeIcon icon="💾" />Replay laden
                </NavItem>
                <NavTitle title="Administration" />
                <NavItem onClick={() => this.switchToAdministration()} active={this.state.contentState == AppContent.Administration}>
                  <UnicodeIcon icon="⚙" />Einstellungen
                </NavItem>
                <NavItem><a href="https://cau-kiel-tech-inf.github.io/socha-enduser-docs/#die-programmoberfl%C3%A4che" target="_blank">Hilfe</a></NavItem>
              </NavGroup>
            </RetractableSidebar>
            <Pane>
              {mainPaneContent}
            </Pane>
            <RetractableSidebar className="wide" retracted={this.state.consoleRetracted}>
              {this.state.activeGame ? <LogConsole game={this.state.activeGame} /> : <div />}
            </RetractableSidebar>
          </PaneGroup>
        </Content>
      </Window >
    );
  }
}
