import { GameClient } from './Game';
import { GenericPlayer } from './PlayerClient';

import { PLAYERCOLOR, Player, GameState, Action } from './HaseUndIgel';

import { UI } from '../viewer/Engine/UI';

export class HumanClient extends GenericPlayer implements GameClient {
  color: PLAYERCOLOR;
  private ui: UI;
  private state: GameState;
  private reservation: string;
  constructor(name: string, ui: UI, reservation: string) {
    super(name);
    this.ui = ui;
    this.reservation = reservation;
    this.on('welcome', welcomeMessage => this.color = welcomeMessage.mycolor);
    this.on('moverequest', this.handleMoveRequest);
    this.on('state', s => this.state = s);
    this.on('message', m => console.log("human: " + m));
  }

  handleMoveRequest = async function () {
    console.log("handling move request");
    //1. Build move
    let move: Action[] = [];

    this.ui.setInteractive(this.color == Player.COLOR.RED ? "red" : "blue");

    let interaction_type = "none";

    let actionState = this.state;

    while (interaction_type != "send") {
      interaction_type = await this.ui.interact(actionState, this.color);
      switch (interaction_type) {
        case "action":
          move.push(this.ui.chosenAction);
          this.ui.chosenAction.perform(actionState);
          break;
        case "cancel":
          move.pop();
          break;
      }
    }

    //2. Send move
    //Build xml and this.writeData it out
    throw "Not implemented!";
  }

  start(): Promise<void> {
    console.log("Human player starting");
    return this.joinPrepared(this.reservation)
  }

  stop() {
    var stop = async function () {
      console.log("Human player stopped")
    }.bind(this);
    return stop();
  }
}