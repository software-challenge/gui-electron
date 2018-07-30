import { GenericPlayer } from './PlayerClient';
import { Logger } from '../Logger';

import { GameState, Player, PLAYERCOLOR } from '../rules/CurrentGame';

export class SimpleClient extends GenericPlayer {
  state: GameState;
  color: PLAYERCOLOR;
  constructor(name: string) {
    super(name);

    this.on('welcome', data => {
      this.color = data.mycolor;
    })

    this.on('state', gs => {
      this.state = gs;
      console.dir(gs);
    });

    this.on('moverequest', () => {
      Logger.getLogger().log("SimpleClient", "moverequest", "Move requested");
    })

  }
}
