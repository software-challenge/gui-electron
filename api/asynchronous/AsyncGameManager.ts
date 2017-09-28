import { Message, MessageContent } from '../rules/Message';
import { GameCreationOptions } from '../rules/GameCreationOptions';
import { Game } from '../rules/Game';
import { LiveGame } from './LiveGame';
import { Replay } from './Replay';
import { AsyncApi } from './AsyncApi';
import { GameStatus } from '../rules/GameStatus';

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

      case "report status":
        if (this.games.has(m.gameName)) {
          let game = this.games.get(m.gameName);
          let report_status_response = new Message();
          report_status_response.gameName = m.gameName;
          report_status_response.message_type = "status report";
          report_status_response.message_content = new MessageContent.StatusReportContent();
          if (game.isReplay) {
            report_status_response.message_content.gameStatus = "FINISHED";
          } else {
            //TODO
          }
          process.send(report_status_response);
        } else {
          let get_status_error_response = new Message();
          get_status_error_response.message_type = "error";
          get_status_error_response.message_content = "Tried to get status for game " + m.gameName + " but that game was not in memory";
          process.send(get_status_error_response);
        }
        break;

      case "get state":
        let state_content: MessageContent.GetStateContent = m.message_content;
        if (this.games.has(m.gameName)) {
          this.games.get(m.gameName).getState(state_content.turn).then(gs => {
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
    }
  }
}