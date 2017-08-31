import { GameRuleLogic } from './HaseUndIgelGameRules';
import { GameClient } from './Game';
import { GenericPlayer } from './PlayerClient';

import { PLAYERCOLOR, Player, GameState, Action } from './HaseUndIgel';

import { UI } from '../viewer/Engine/UI';

export class HumanClient extends GenericPlayer implements GameClient {
  color: PLAYERCOLOR;
  private ui: UI;
  private state: GameState;
  private reservation: string;
  private roomId: string;
  constructor(name: string, ui: UI, reservation: string) {
    super(name);
    this.ui = ui;
    this.reservation = reservation;
    this.on('welcome', welcomeMessage => {
      console.log(name + " got welcome message: ", welcomeMessage)
      this.color = welcomeMessage.mycolor;
      this.roomId = welcomeMessage.roomId;
    });
    this.on('moverequest', this.handleMoveRequest);
    this.on('state', s => this.state = s);
    this.on('message', m => console.log("human: " + m));
    this.on('error', error => alert("Error: " + error));
  }

  handleMoveRequest = async function () {
    console.log("handling move request");

    //1. Build move
    let move: Action[] = [];

    let interaction_type = "none";

    let actionState = this.state.clone();

    while (interaction_type != "send") {

      interaction_type = await this.ui.interact(actionState, this.color, move.length == 0);


      switch (interaction_type) {
        case "action":
          move.push(this.ui.chosenAction);
          try {
            this.ui.chosenAction.perform(actionState);
          } catch (error) {
            console.log("ERROR: " + error);
            alert(error);
            move.pop();
            continue;
          }
          if (!GameRuleLogic.mustPlayCard(actionState)) {
            this.ui.enableSend();
          }
          // maybe end move selection if last possible action
          // TODO: check if any more actions are possible
          /*
          if (!GameRuleLogic.canDoAnything(actionState)) {
            this.ui.setInteractive("off");
            interaction_type = "send";
          }
          */
          break;
        case "cancel":
          move = [];
          actionState = this.state.clone();
          this.ui.disableCancel();
          break;
      }
      if (move.length > 0) {
        this.ui.enableCancel();
      } else {
        this.ui.disableSend();
      }
    }

    //2. Send move
    this.ui.setInteractive("off")
    console.log("would send move ", move)
    let xml: string = '<room roomId="' + this.roomId + '">' +
      '<data class="move">' +
      move.map((action, index) => {
        switch (action.type) {
          case "ADVANCE":
            return '<advance order="' + index + '" distance="' + action.value + '"/>'
        }
      }) +
      '</data></room>';
    this.writeData(xml);
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