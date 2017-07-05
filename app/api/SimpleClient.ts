import { GenericPlayer } from './PlayerClient';

import { GameState, Player, PLAYERCOLOR } from './HaseUndIgel';

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
      console.log("Move requested");
    })

  }
}
