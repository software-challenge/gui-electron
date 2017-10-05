import { remote } from 'electron';
import { GameRuleLogic } from '../rules/HaseUndIgelGameRules';
import { GameClient } from './LiveGame';
import { GenericPlayer } from './PlayerClient';

import { PLAYERCOLOR, Player, GameState, Action } from '../rules/HaseUndIgel';

import { AsyncApi } from './AsyncApi';
import { UIHint } from '../rules/UIHint';

import { LiveGame } from './LiveGame'

//const dialog = remote.dialog;

export class HumanClient extends GenericPlayer implements GameClient {
  color: PLAYERCOLOR;
  private state: GameState;
  private reservation: string;
  private roomId: string;
  private game: LiveGame;
  constructor(name: string, reservation: string, game: LiveGame) {
    super(name);
    this.reservation = reservation;
    this.game = game;
    this.on('welcome', welcomeMessage => {
      console.log(name + " got welcome message: ", welcomeMessage)
      this.color = welcomeMessage.mycolor;
      this.roomId = welcomeMessage.roomId;
    });
    this.on('moverequest', this.handleMoveRequest);
    this.on('state', s => this.state = s);
    this.on('message', m => console.log("human: " + m));
    //this.on('error', error => dialog.showErrorBox("Fehler menschlicher Spieler", error));
  }

  handleMoveRequest = async function () {
    console.log("handling move request");

    //1. Build move

    let interact = (interaction_type, move: Action[], actionState: GameState, ui_hints: UIHint[], send_move) => {
      if (interaction_type != "send") {//TODO: Fix this
        AsyncApi.lodgeActionRequest(this.game.name, actionState, this.color, move.length == 0, ui_hints, (method, action) => {
          interaction_type = method;
          ui_hints = [];
          switch (interaction_type) {
            case "action":
              move.push(action);
              try {
                action.perform(actionState);
              } catch (error) {
                console.log("ERROR: " + error);
                move.pop();
                return; //aka continue;
              }
              if (!GameRuleLogic.mustPlayCard(actionState)) {
                ui_hints.push('enable send');
              }
              break;
            case "cancel":
              move = [];
              actionState = this.state.clone();
              ui_hints.push('disable cancel');
              break;
          }
          if (move.length > 0) {
            ui_hints.push('enable cancel');
          } else {
            ui_hints.push('disable send');
          }
          interact(interaction_type, move, actionState, ui_hints, send_move);
        });
      } else {
        send_move(move)
      }
    }



    //2. Send move
    let send_move = (move) => {
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
        }).join('') +
        '</data></room>';
      this.writeData(xml);
    };

    interact("none", [], this.state.clone(), [], send_move);

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