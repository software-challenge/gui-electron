import * as React from 'react';
import Server from './Server';
import { Content } from "react-photonkit";
import { Window, Toolbar, ToolbarActions, ButtonGroup, PaneGroup, Sidebar, RetractableSidebar, Pane, NavGroup, NavTitle, NavItem, Button } from './photon-fix/Components';
import { UnicodeIcon } from './generic-components/Components';
import { Administration } from './Administration';
import { GameCreation } from './GameCreation';
import * as cp from 'child_process';

enum AppContent {
  Empty,
  GameCreation,
  GameLive,
  GameEnded,
  Administration
}

interface State {
  menuRetracted: boolean
  consoleRetracted: boolean
  contentState: AppContent
}

export class App extends React.Component<any, State> {
  constructor() {
    super();
    this.state = {
      menuRetracted: false,
      consoleRetracted: true,
      contentState: AppContent.Empty
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

  render() {
    var mainPaneContent;
    switch (this.state.contentState) {
      case AppContent.Administration:
        mainPaneContent = <Administration />;
        break;
      case AppContent.GameCreation:
        mainPaneContent = <GameCreation />;
        break;
      default:
        mainPaneContent = <span></span>
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
                <NavTitle title="Administration" />
                <NavItem onClick={() => this.switchToAdministration()} active={this.state.contentState == AppContent.Administration}>
                  <UnicodeIcon icon="⚙" />Einstellungen
                </NavItem>
              </NavGroup>
            </RetractableSidebar>
            <Pane>
              {mainPaneContent}
            </Pane>
            <RetractableSidebar className="wide" retracted={this.state.consoleRetracted}>
              Hier kommt noch das Log hin
            </RetractableSidebar>
          </PaneGroup>
        </Content>
      </Window >
    );
  }
}
