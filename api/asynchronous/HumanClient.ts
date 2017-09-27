import { remote } from 'electron';
import { GameRuleLogic } from '../rules/HaseUndIgelGameRules';
import { GameClient } from './LiveGame';
import { GenericPlayer } from './PlayerClient';

import { PLAYERCOLOR, Player, GameState, Action } from '../rules/HaseUndIgel';

import { AsyncApi } from './AsyncApi';

//const dialog = remote.dialog;

export class HumanClient extends GenericPlayer implements GameClient {
  color: PLAYERCOLOR;
  private state: GameState;
  private reservation: string;
  private roomId: string;
  constructor(name: string, reservation: string) {
    super(name);
    this.reservation = reservation;
    this.on('welcome', welcomeMessage => {
      console.log(name + " got welcome message: ", welcomeMessage)
      this.color = welcomeMessage.mycolor;
      this.roomId = welcomeMessage.roomId;
    });
    this.on('moverequest', this.handleMoveRequest);
    this.on('state', s => this.state = s);
    this.on('message', m => console.log("human: " + m));
    //${__dirname}this.on('error', error => dialog.showErrorBox("Fehler menschlicher Spieler", error));
  }

  handleMoveRequest = async function () {
    console.log("handling move request");

    //1. Build move
    let move: Action[] = [];

    let interaction_type = "none";

    let actionState = this.state.clone();

    while (interaction_type != "send") {

      AsyncApi.getAction(actionState, this.color, move.length == 0, (status, action) => {
        interaction_type = status;

        switch (interaction_type) {
          case "action":
            move.push(this.ui.chosenAction);
            try {
              this.ui.chosenAction.perform(actionState);
            } catch (error) {
              console.log("ERROR: " + error);
              alert(error);
              move.pop();
              return; //aka continue;
            }
            if (!GameRuleLogic.mustPlayCard(actionState)) {
              this.ui.enableSend();
            }
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


      });




    }

    //2. Send move
    this.ui.setInteractive("off")
    let xml: string = '<room roomId="' + this.roomId + '">' +
      '<data class="move">' +
      move.map((action, index) => {
        switch (action.type) {
          case "ADVANCE":
            return `<advance order="${index}" distance="${action.value}"/>`;
          case "CARD":
            let value = action.value ? `value="${action.value}"` : ""
            return `<card order="${index}" type="${action['cardType']}" ${value}/>`;
          case "EXCHANGE_CARROTS":
            return `<exchangeCarrots order="${index}" value="${action.value}"/>`;
          case "EAT_SALAD":
            return `<eatSalad order="${index}" />`;
          case "FALL_BACK":
            return `<fallBack order="${index}" />`;
          case "SKIP":
            return `<skip order="${index}" />`;
          default:
            throw "Unknown action type for converstion to XML: " + action.type;
        }
      }) +
      '</data></room>';
    this.writeData(xml);
  }

  start(): Promise<any> {
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