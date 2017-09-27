import { Message } from '../rules/Message';
import { GameCreationOptions } from '../rules/GameCreationOptions';
import { Game } from '../rules/Game';
import { LiveGame } from './LiveGame';
import { Replay } from './Replay';
import { AsyncApi } from './AsyncApi';

export class AsyncGameManager {
  private games: Game[] = [];

  constructor() {
    AsyncApi.getServer();
  }

  public createLiveGame(gco: GameCreationOptions, name: string): LiveGame {
    var g = new LiveGame(gco, name);
    this.games.push(g);
    return g;
  }

  public createReplayGame(replayPath: string, name: string): Replay {
    var g = new Replay(replayPath, name);
    this.games.push(g);
    return g;
  }

  public handleMessage(m: Message) {
    switch (m.message_type) {
      case "stop":
        AsyncApi.getServer().stop();
        break;
    }
  }
}