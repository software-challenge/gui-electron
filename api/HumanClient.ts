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
  }

  handleMoveRequest = async function () {
    console.log("handling move request");

    let gameReady = new Promise((res, rej) => {
      this.ui.eventProxy.once("state", () => { res() })
    })
    if (this.state == undefined) {
      console.log("HumanClient waiting for first gamestate")
      await gameReady;
    }

    //1. Build move
    let move: Action[] = [];

    this.ui.setInteractive(this.color == Player.COLOR.RED ? "red" : "blue");

    let interaction_type = "none";

    let actionState = this.state.clone();

    while (interaction_type != "send") {
      interaction_type = await this.ui.interact(actionState, this.color);
      switch (interaction_type) {
        case "action":
          move.push(this.ui.chosenAction);
          this.ui.chosenAction.perform(actionState);
          this.ui.enableSend();
          // maybe end move selection if last possible action
          // TODO: check if any more actions are possible
          //this.ui.setInteractive("off")
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
    let index = 0;
    let xml: string = '<room roomId="' + this.roomId + '">' +
      '<data class="move">' +
      move.map((action) => {
        switch (action.type) {
          case "ADVANCE":
            return '<advance order="' + index + '" distance="' + action.value + '"/>'
        }
        index += 1; // TODO: mutable state in map is ugly
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