import { Message, MessageContent } from '../rules/Message';
import { GameCreationOptions } from '../rules/GameCreationOptions';
import { Game } from '../rules/Game';
import { LiveGame } from './LiveGame';
import { Replay } from './Replay';
import { AsyncApi } from './AsyncApi';
import { GameStatus } from '../rules/GameStatus';
import { TransferableActionRequest } from '../rules/TransferableActionRequest';

export class AsyncGameManager {
  private games: Map<string, Game>;

  constructor() {
    AsyncApi.getServer();
    this.games = new Map<string, Game>();
  }

  public createLiveGame(gco: GameCreationOptions): LiveGame {
    var g = new LiveGame(gco, gco.gameName);
    this.games.set(gco.gameName, g);
    return g;
  }

  public createReplayGame(gco: GameCreationOptions): Replay {
    var g = new Replay(gco.firstPlayerPath, gco.gameName);
    this.games.set(gco.gameName, g);
    return g;
  }

  public handleMessage(m: Message) {
    switch (m.message_type) {
      case "stop":
        AsyncApi.getServer().stop();
        let stopped_response = new Message();
        stopped_response.message_type = "stopped";
        process.send(stopped_response);
        break;

      case "list games":
        let response = new Message();
        response.message_type = "games list";
        response.message_content = new MessageContent.GamesListContent();
        response.message_content.gameNames = Array.from(this.games.keys());
        process.send(response);
        break;

      case "start game":
        let content: MessageContent.StartGameContent = m.message_content;
        if (content.options.firstPlayerStartType == "Replay") {
          this.createReplayGame(content.options);
        } else {
          this.createLiveGame(content.options);
        }
        let start_game_response_message = new Message();
        start_game_response_message.gameName = content.options.gameName;
        start_game_response_message.message_type = "game started";
        process.send(start_game_response_message);
        break;

      case "report status": //Get the current state of a game
        if (this.games.has(m.gameName)) {//check if this game even exists
          let game: any = this.games.get(m.gameName);//Fetch game, prepare answer
          let report_status_response = new Message();
          report_status_response.gameName = m.gameName;
          report_status_response.message_type = "status report";
          report_status_response.message_content = new MessageContent.StatusReportContent();
          report_status_response.message_content.numberOfStates = game.getStateCount();

          if (game.isReplay) {//Game is a replay, all states should be loaded, report so
            report_status_response.message_content.gameStatus = "REPLAY";
            report_status_response.message_content.gameResult = game.getResult();
          } else {//Game is a live game and might or might not be finished, let's find out
            let lg: LiveGame = game;
            if (lg.isLive()) {
              if (AsyncApi.hasActionRequest(m.gameName)) {//If there's an action request currently lodged with the API
                report_status_response.message_content.gameStatus = "REQUIRES INPUT";
                var [id, ar] = AsyncApi.getActionRequest(m.gameName);//Get the request and assemble the response. We can request this ActionRequest many times, but only redeem it once
                var tar: TransferableActionRequest = {
                  color: ar.color,
                  isFirstAction: ar.isFirstAction,
                  state: ar.state,
                  uiHints: ar.uiHints,
                  id: id
                }
                report_status_response.message_content.actionRequest = tar;
              } else { //Game is live, but doesn't require input
                report_status_response.message_content.gameStatus = "RUNNING";
              }
            } else {//Game has finished
              report_status_response.message_content.gameStatus = "FINISHED";
              report_status_response.message_content.gameResult = lg.getResult();
            }
          }
          process.send(report_status_response);
        } else {//We don't have this game
          let get_status_error_response = new Message();
          get_status_error_response.message_type = "error";
          get_status_error_response.message_content = "Tried to get status for game " + m.gameName + " but that game was not in memory";
          process.send(get_status_error_response);
        }
        break;

      case "get state":
        console.log("get state");
        let state_content: MessageContent.GetStateContent = m.message_content;
        if (this.games.has(m.gameName)) {
          console.log(m.gameName, state_content.turn);
          this.games.get(m.gameName).getState(state_content.turn).then(gs => {
            console.log("got state");
            let get_state_response = new Message();
            get_state_response.gameName = m.gameName;
            get_state_response.message_type = "gamestate";
            get_state_response.message_content = new MessageContent.GameStateContent();
            get_state_response.message_content.gameState = gs;
            process.send(get_state_response);
          });
        } else {
          let get_state_error_response = new Message();
          get_state_error_response.message_type = "error";
          get_state_error_response.message_content = "Tried to get state for game " + m.gameName + " but that game was not in memory";
          process.send(get_state_error_response);
        }
        break;

      case "send action":
        let action_content: MessageContent.SendActionContent = m.message_content;
        if (this.games.has(m.gameName)) {
          console.log("Message: \n" + JSON.stringify(m, null, '\t'));
          AsyncApi.redeemActionRequest(m.gameName, action_content.id, action_content.actionMethod, action_content.action);
          let send_action_response = new Message();
          send_action_response.gameName = m.gameName;
          send_action_response.message_type = "action sent";
          process.send(send_action_response);
        } else {
          let error_response = new Message();
          error_response.message_type = "error";
          error_response.message_content = "Tried to send action for game " + m.gameName + ", request id " + action_content.id + " but that game was not in memory";
          process.send(error_response);
        }
        break;
    }
  }
}