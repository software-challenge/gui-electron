import { GenericPlayer } from './PlayerClient';

import { PLAYERCOLOR, Player, GameState, Action } from './HaseUndIgel';

import { UI } from '../viewer/Engine/UI';

export class HumanClient extends GenericPlayer {
  color: PLAYERCOLOR;
  private ui: UI;
  constructor(name: string, ui: UI) {
    super(name);
    this.ui = ui;
    this.on('welcome', welcomeMessage => this.color = welcomeMessage.mycolor);
    this.on('moverequest', this.handleMoveRequest);
  }

  handleMoveRequest = async function () {
    //1. Build move
    let move: Action[] = [];

    this.ui.setInteractive(this.color == Player.COLOR.RED ? "red" : "blue");

    let interaction_type = "none";

    while (interaction_type != "send") {
      interaction_type = await this.ui.interact();
      switch (interaction_type) {
        case "action":
          move.push(this.ui.chosenAction);
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
}