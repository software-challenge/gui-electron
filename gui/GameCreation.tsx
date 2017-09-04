import * as electron from 'electron';
import { remote } from 'electron';
import * as React from 'react';
import { Input, SelectBox, Button, CheckBox } from './photon-fix/Components';
import { GameCreationOptions, PlayerType } from '../api/GameCreationOptions';

const dialog = remote.dialog;

interface State {
  firstPlayerType: PlayerType
  firstPlayerName: string,
  firstPlayerProgramPath: string // TODO use a Maybe type
  firstPlayerDirectStart: boolean,
  secondPlayerType: PlayerType
  secondPlayerName: string,
  secondPlayerProgramPath: string, // TODO use a Maybe type
  secondPlayerDirectStart: boolean
}

export class GameCreation extends React.Component<{ gameCreationCallback: (GameCreationOptions) => void }, State> {
  private gameCreationCallback: (GameCreationOptions) => void;
  constructor() {
    super();
    var defaultClient = window.localStorage['defaultProgramPath'];
    this.state = {
      firstPlayerType: "Human",
      firstPlayerName: "Mensch Spieler 1",
      firstPlayerProgramPath: defaultClient,
      firstPlayerDirectStart: false,
      secondPlayerType: "Computer",
      secondPlayerName: "Computer Spieler 2",
      secondPlayerProgramPath: defaultClient,
      secondPlayerDirectStart: false
    }
  }

  componentDidMount() {
    console.log(this.props);
    this.gameCreationCallback = this.props.gameCreationCallback;
  }

  // To be called as onChange handler on form controls
  private handleControlChange(setter) {
    return function (event) {
      var val = event.target.value;
      this.setState((prev, _props) => {
        setter(prev, val)
        return prev;
      });
    }.bind(this)
  }

  // shows a file select dialog and calls the given setter with the selected file
  private clientFileSelectDialog(setter) {
    dialog.showOpenDialog(
      {
        title: "Wähle einen Computerspieler",
        properties: ["openFile"]
      },
      function (filenames) {
        // dialog returns undefined when user clicks cancel or an array of strings (paths) if user selected a file
        if (filenames && filenames.length > 0) {
          window.localStorage['defaultProgramPath'] = filenames[0];
          this.setState((prev, _props) => {
            setter(prev, filenames[0])
          });
        }
      }.bind(this)
    )
  }

  // returns UI to make further configurations for a player of playerType, takes a
  // mutator function which is used to set the clientFilePath
  private playerControl(playerType: PlayerType, playerProgramPath: string, pathMutator: (State, string) => string, directStart: boolean, directStartSetter: (State, boolean) => boolean) {
    switch (playerType) {
      case "Human":
        return <p>menschlicher Spieler</p>;
      case "Computer":
        return (<div>
          Wähle ein Programm zum starten<span> </span>
          <Button text="Computerspieler wählen"
            onClick={() => this.clientFileSelectDialog(pathMutator)} />
          <code>{playerProgramPath}</code>
          <CheckBox label="direkt aufrufen (kein Java Client)" value={directStart} onChange={(e) => this.handleControlChange(directStartSetter)(e)} />
        </div>);
      case "External":
        return <p>Das Programm muss nach Erstellung des Spiels gestartet werden. Es sollte sich dann auf localhost, Port 13050 verbinden.</p>;
    }
  }

  // is called when the user wants to start a game with a valid configuration
  private handleStartGame() {
    this.gameCreationCallback(
      new GameCreationOptions(
        this.state.firstPlayerType,
        this.state.firstPlayerName,
        this.state.firstPlayerProgramPath,
        this.state.firstPlayerDirectStart ? "Direct" : "Java",
        this.state.secondPlayerType,
        this.state.secondPlayerName,
        this.state.secondPlayerProgramPath,
        this.state.secondPlayerDirectStart ? "Direct" : "Java",
      )
    );
  }

  // checks if the current configuration is valid for starting a game
  private validConfiguration() {
    // only non-empty player names
    if (this.state.firstPlayerName.trim() == "") {
      return false;
    }
    if (this.state.secondPlayerName.trim() == "") {
      return false;
    }
    // the configuration is only invalid if the user selected "Computer" but didn't select a program
    if (this.state.firstPlayerType == "Computer" && this.state.firstPlayerProgramPath == undefined) {
      return false;
    }
    if (this.state.secondPlayerType == "Computer" && this.state.secondPlayerProgramPath == undefined) {
      return false;
    }
    return true;
  }

  render() {
    var items = [
      { label: "Mensch", value: "Human" },
      { label: "Computer", value: "Computer" },
      { label: "manuell gestartetes Programm", value: "External" }
    ];
    var firstPlayerControl = this.playerControl(
      this.state.firstPlayerType,
      this.state.firstPlayerProgramPath,
      (s, v) => s.firstPlayerProgramPath = v,
      this.state.firstPlayerDirectStart,
      (s, v) => s.firstPlayerDirectStart = Boolean(v)
    );
    var secondPlayerControl = this.playerControl(
      this.state.secondPlayerType,
      this.state.secondPlayerProgramPath,
      (s, v) => s.secondPlayerProgramPath = v,
      this.state.secondPlayerDirectStart,
      (s, v) => s.secondPlayerDirectStart = Boolean(v)
    );
    var startControl;
    if (this.validConfiguration()) {
      if (this.state.firstPlayerType != "External" && this.state.secondPlayerType != "External") {
        startControl = <Button text="Start!" pullRight={true} onClick={() => this.handleStartGame()} />;
      } else {
        startControl = <p>Aktuell sind Spiele mit externen Clients noch nicht unterstuetzt!</p>
      }
    } else {
      startControl = <p>Ungueltige Einstellungen!</p>
    }
    return (
      <div className="game-creation main-container">
        <Input value={this.state.firstPlayerName} onChange={(event) => this.handleControlChange((p, v) => p.firstPlayerName = v)(event)} />
        <SelectBox value={this.state.firstPlayerType} items={items} onChange={(event) => this.handleControlChange((p, v) => p.firstPlayerType = v)(event)} />
        {firstPlayerControl}
        <div id="vs">gegen</div>
        <Input value={this.state.secondPlayerName} onChange={(event) => this.handleControlChange((p, v) => p.secondPlayerName = v)(event)} />
        <SelectBox value={this.state.secondPlayerType} items={items} onChange={(event) => this.handleControlChange((p, v) => p.secondPlayerType = v)(event)} />
        {secondPlayerControl}
        <div id="start">
          {startControl}
        </div>
      </div>
    );
  }
}
