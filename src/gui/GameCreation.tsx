import * as electron from 'electron';
import { remote } from 'electron';
import * as React from 'react';
import { Input, SelectBox, Button, CheckBox } from './photon-fix/Components';
import { GameCreationOptions, Versus, GameType, PlayerType, StartType, Player, HumanPlayer, ManualPlayer, ComputerPlayer } from '../api/rules/GameCreationOptions';
import { Api } from '../api/Api';

import { Casts } from '../helpers/Casts';

import * as fs from 'fs';

const dialog = remote.dialog;

const localStorageCreationOptions = 'creationOptions';
const localStorageProgramPath = 'defaultProgramPath';

type Errors = Array<string>;

// Type to hold the value for an input along with its validation status
type FieldState<V> = {
  value: V,
  errors: Errors
};

// The game creation form holds settings for two players, which structure are the same for each player.
interface FormState {
  generalErrors: Errors;
  gameName: FieldState<string>;
  players: PlayerFormState[];
}

// These are the settings for each player.
interface PlayerFormState {
  type: FieldState<PlayerType>;
  name: FieldState<string>;
  path: FieldState<string>;
  startType: FieldState<StartType>;
  timeoutEnabled: FieldState<boolean>;
}

class ErrorList extends React.PureComponent<{ errors: Array<string> }> {
  render() {
    const listItems = this.props.errors.map((error) =>
      <li>{error}</li>
    );
    return <ul>{listItems}</ul>;
  }
}

export class GameCreation extends React.Component<{ gameCreationCallback: (GameCreationOptions) => void }, FormState> {
  constructor(props) {
    super(props);

    let defaults = {
      generalErrors: [],
      gameName: this.unvalidatedField("Neue Begegnung"),
      players: [this.newPlayerForm(PlayerType.Computer), this.newPlayerForm(PlayerType.Human)]
    };

    var lastCreationOptions = window.localStorage[localStorageCreationOptions];
    if (lastCreationOptions == null) {
      var defaultClient = window.localStorage[localStorageProgramPath];
      this.state = defaults;
    } else {
      const parsedState: FormState = JSON.parse(lastCreationOptions);
      if (parsedState == null ||
          parsedState.generalErrors == null || parsedState.gameName == null || parsedState.players == null ||
          parsedState.players.some(form => form == null || form.name == null || form.startType == null || form.timeoutEnabled == null)) {
        window.localStorage[localStorageCreationOptions] = null;
        this.state = defaults;
      } else {
        this.state = parsedState;
      }
    }
    this.state.players.forEach(player => this.refreshPlayerName(player))
  }

  private newPlayerForm(type: PlayerType) {
    return {
      type: this.unvalidatedField(type),
      name: this.unvalidatedField(type),
      path: this.unvalidatedField(null),
      /* startType should never be null, because when switching from
      human to computer this field is not updated and would stay null, which
      is an invalid value for PlayerType.Computer, but not marked as invalid
      because the user can't enter this value directly */
      startType: this.unvalidatedField(StartType.Java),
      timeoutEnabled: this.unvalidatedField(true)
    }
  }

  private unvalidatedField(value) { return { value: value, errors: [] }; }

  // To be called as onChange handler on form controls. Takes a setter function which changes the form state according to the new value. Special handling for checkboxes, because they provide their value different from all other input elements.
  private handleControlChange(setter: (s: FormState, val: string) => void, checkbox = false): (event: any) => void {
    return function (event) {
      var val = checkbox ? event.target.checked.toString() : event.target.value;
      this.setState((prev, _props) => {
        setter(prev, val);
        return prev;
      });
    }.bind(this);
  }

  // shows a file select dialog and calls the given setter with the selected file
  private clientFileSelectDialog(setter: (s: FormState, firstSelectedFilename: string) => void): void {
    dialog.showOpenDialog(
      {
        title: "Wähle einen Computerspieler",
        properties: ["openFile"]
      },
      function (filenames) {
        // dialog returns undefined when user clicks cancel or an array of strings (paths) if user selected a file
        if (filenames && filenames.length > 0) {
          window.localStorage[localStorageProgramPath] = filenames[0];
          this.setState((prev, _props) => {
            setter(prev, filenames[0]);
            return prev;
          });
        }
      }.bind(this)
    );
  }

  private createPlayer(playerSettings: PlayerFormState): Player {
    switch (playerSettings.type.value) {
      case PlayerType.Human:
        return {
          kind: PlayerType.Human,
          name: playerSettings.name.value,
          timeoutPossible: false
        } as HumanPlayer;
      case PlayerType.Computer:
        return {
          kind: PlayerType.Computer,
          name: playerSettings.name.value,
          timeoutPossible: playerSettings.timeoutEnabled.value,
          path: playerSettings.path.value,
          startType: playerSettings.startType.value
        };
      case PlayerType.Manual:
        return {
          kind: PlayerType.Manual,
          name: playerSettings.name.value,
          timeoutPossible: playerSettings.timeoutEnabled.value
        };
    }
  }
  // is called when the user wants to start a game with a valid configuration
  private handleStartGame(parsed: GameCreationOptions) {
    window.localStorage[localStorageCreationOptions] = JSON.stringify(this.state);
    if (this.state.players.some(p => p.type.value == PlayerType.Manual)) {
      document.getElementById('waiting').style.opacity = "1";
    }
    this.props.gameCreationCallback(parsed);
  }

  private isEmpty(v: string): boolean {
    return (v == null) || v.trim() === "";
  }

  private invalidPath(path: string): boolean {
    return this.isEmpty(path) || !fs.existsSync(path);
  }

  // Validates form settings an sets appropriate error states for invalid states. Returns true if settings are valid, false if not.
  private validate(state: FormState): boolean {
    var valid = true;
    state.generalErrors = [];
    state.gameName.errors = [];
    if (this.isEmpty(state.gameName.value)) {
      state.gameName.errors.push("Der Name des Spiels darf nicht leer sein.");
      valid = false;
    }
    state.players.map((player: PlayerFormState) => {
      player.name.errors = [];
      if (this.isEmpty(player.name.value)) {
        player.name.errors.push("Der Name des Spielers darf nicht leer sein.");
        valid = false;
      }
      player.path.errors = [];
      if (player.type.value == PlayerType.Computer) {
        if (this.invalidPath(player.path.value)) {
          player.path.errors.push("Bitte wähle einen Computerspieler aus.");
          valid = false;
        }
      }
    });
    return valid;
  }

  private hasErrors(field: FieldState<any>):boolean {
    return field.errors.length > 0;
  }

  // Returns the sub-form to make changes to the settings for each player. Takes a function which should select the player for which the sub-form should show and change the settings.
  private playerControl(formState: FormState, player: (s:FormState) => PlayerFormState ) {
    let playerForm = player(formState)
    switch (playerForm.type.value) {
      case PlayerType.Human:
        return <p>menschlicher Spieler</p>;
      case PlayerType.Computer:
        return (<div>
          Wähle ein Programm zum starten<span> </span>
          <Button text="Computerspieler wählen"
            onClick={() => this.clientFileSelectDialog((state, firstSelectedPath) => { if (firstSelectedPath) { player(state).path.value = firstSelectedPath; this.refreshPlayerName(playerForm); } } )} />
          <code className={this.hasErrors(playerForm.path) ? 'validation-errors' : ''}>{playerForm.path.value}</code>
          <label className="validation-errors">{playerForm.path.errors}</label>
          <CheckBox label="mit Java aufrufen" value={playerForm.startType.value == StartType.Java} onChange={(e) => this.handleControlChange((state, value) => { console.log("Checkbox value change:", value); player(state).startType.value = (Casts.stringToBoolean(value) ? StartType.Java : StartType.Direct); }, true)(e)} />
        </div>);
      case PlayerType.Manual:
        return <p>Das Programm muss nach Erstellung des Spiels gestartet werden. Es sollte sich dann auf localhost, Port 13050 verbinden.</p>;
    }
  }

  refreshPlayerName(player: PlayerFormState) {
    player.name.value = function() {
      let labelFor = (t: PlayerType):string => {
        switch (t) {
          case PlayerType.Human: return "Mensch"
          case PlayerType.Computer: return "AI"
          case PlayerType.Manual: return "AI-Manual"
        }
      }
      switch(player.type.value) {
        case PlayerType.Computer: return player.path.value != null ? labelFor(PlayerType.Computer)+"-"+player.path.value.split('\\').pop().split('/').pop().split(".")[0] : labelFor(PlayerType.Computer)
        default: return labelFor(player.type.value)
      }
    }.bind(this)()
    this.state.gameName.value = this.state.players[0].name.value + " vs " + this.state.players[1].name.value
  }

  render() {
    console.log(JSON.stringify(this.state));
    const playerTypes = [
      { label: "Mensch", value: PlayerType.Human },
      { label: "Computer", value: PlayerType.Computer },
      { label: "Manuell gestarteter Client", value: PlayerType.Manual }
    ];

    var startControl;
    if (this.validate(this.state)) {
      // current settings are valid, user may start the game
      startControl = <Button text="Start!" pullRight={true} onClick={() => {
        // game should be started, create a game configuration from the given settings
        this.handleStartGame({
          kind: GameType.Versus,
          firstPlayer: this.createPlayer(this.state.players[0]),
          secondPlayer: this.createPlayer(this.state.players[1]),
          gameName: this.state.gameName.value,
          gameId: Api.getGameManager().createGameId(this.state.gameName.value, false)
        });
      }} />;
    } else {
      startControl = <div className="validation-errors pull-right">
        <p>Bitte korrigieren Sie die rot markierten Probleme, um ein Spiel zu starten.</p>
        <ErrorList errors={this.state.generalErrors} />
      </div>;
    }

    let playerForm = (player: integer) => (
      <div>
        <Input id={"input_playerName" + player} value={this.state.players[player].name.value} onChange={(event) => this.handleControlChange((state, value) => state.players[player].name.value = value)(event)} invalid={this.hasErrors(this.state.players[player].name)} />
        <label htmlFor={"input_playerName" + player} className="validation-errors">{this.state.players[player].name.errors}</label>
        <br />
        <SelectBox value={this.state.players[player].type.value} items={playerTypes} onChange={(event) => this.handleControlChange((state, value: PlayerType) => {state.players[player].type.value = value; this.refreshPlayerName(state.players[player])})(event)} />
        {this.playerControl(this.state, s => s.players[player])}
      </div>
    )
    return (
      <div className="game-creation main-container">
        <Input id="input_gameName" value={this.state.gameName.value} onChange={(event) => this.handleControlChange((state, value) => state.gameName.value = value)(event)} invalid={this.hasErrors(this.state.gameName)} />
        <label htmlFor="input_gameName" className="validation-errors">{this.state.gameName.errors}</label>
        <br />

        {playerForm(0)}
        <div id="vs">gegen</div>
        {playerForm(1)}

        <div id="waiting">
          Warte auf manuellen Spieler
        </div>
        <div id="start">
          {startControl}
        </div>
      </div>
    );
  }
}
