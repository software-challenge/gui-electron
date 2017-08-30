import * as electron from 'electron';
import { remote } from 'electron';
import * as React from 'react';
import { SelectBox, Button } from './photon-fix/Components';
import { GameCreationOptions, PlayerType } from '../api/GameCreationOptions';

const dialog = remote.dialog;

interface State {
  firstPlayerType: PlayerType
  firstPlayerProgramPath: string // TODO use a Maybe type
  secondPlayerType: PlayerType
  secondPlayerProgramPath: string // TODO use a Maybe type
}

export class GameCreation extends React.Component<{ gameCreationCallback: (GameCreationOptions) => void }, State> {
  private gameCreationCallback: (GameCreationOptions) => void;
  constructor() {
    super();
    var defaultClient = window.localStorage['defaultProgramPath'];
    this.state = {
      firstPlayerType: "Computer",
      firstPlayerProgramPath: defaultClient,
      secondPlayerType: "Computer",
      secondPlayerProgramPath: defaultClient
    }
  }

  componentDidMount() {
    console.log(this.props);
    this.gameCreationCallback = this.props.gameCreationCallback;
  }

  // To be called as onChange handler on player type select boxes,
  // takes a function to set the first or second player type.
  private handlePlayerChange(setter) {
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
  private playerControl(playerType: PlayerType, playerProgramPath: string, pathMutator: (State, string) => string) {
    switch (playerType) {
      case "Human":
        return <p>Menschen sind schwach.</p>;
      case "Computer":
        return (<div>
          Wähle ein Programm zum starten<span> </span>
          <Button text="Computerspieler wählen"
            onClick={() => this.clientFileSelectDialog(pathMutator)} />
          <code>{playerProgramPath}</code>
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
        this.state.firstPlayerProgramPath,
        this.state.firstPlayerType,
        this.state.secondPlayerProgramPath
      )
    );
  }

  // checks if the current configuration is valid for starting a game
  private validConfiguration() {
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
      (p, v) => p.firstPlayerProgramPath = v
    );
    var secondPlayerControl = this.playerControl(
      this.state.secondPlayerType,
      this.state.secondPlayerProgramPath,
      (p, v) => p.secondPlayerProgramPath = v
    );
    var startControl;
    if (this.validConfiguration()) {
      if (this.state.firstPlayerType == "Computer" && this.state.secondPlayerType == "Computer") {
        startControl = <Button text="Start!" onClick={() => this.handleStartGame()} />;
      } else {
        startControl = <p>Aktuell sind nur Spiele Computer gegen Computer moeglich!</p>
      }
    } else {
      startControl = <p>Bitte wähle ein Programm aus.</p>
    }
    return (
      <div className="game-creation">
        <SelectBox value={this.state.firstPlayerType} items={items} onChange={(event) => this.handlePlayerChange((p, v) => p.firstPlayerType = v)(event)} />
        {firstPlayerControl}
        gegen
        <SelectBox value={this.state.secondPlayerType} items={items} onChange={(event) => this.handlePlayerChange((p, v) => p.secondPlayerType = v)(event)} />
        {secondPlayerControl}
        {startControl}
      </div>
    );
  }
}
