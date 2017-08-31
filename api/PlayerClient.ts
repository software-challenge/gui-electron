import { GenericClient } from './GenericClient';
import { Parser } from './Parser';
import { Player, GameState } from './HaseUndIgel';
import { Api } from './Api';


export class PlayerClientOptions {
  constructor(displayName: string, canTimeout: boolean, shouldBePaused: boolean) {
    this.displayName = displayName;
    this.canTimeout = canTimeout;
    this.shouldBePaused = shouldBePaused;
  }
  displayName: string;
  canTimeout: boolean;
  shouldBePaused: boolean;
}

export class GenericPlayer extends GenericClient {

  constructor(name: string) {
    super(false, name);

    this.on('message', msg => this.handleMessage(msg));

  }

  private async handleMessage(msg: string) {
    msg = msg.replace('<protocol>', ''); //Strip unmatched protocol tag //Really dirty hack
    Api.getLogger().log("GenericPlayer", "handleMessage", msg);
    var decoded = await Parser.getJSONFromXML(msg);
    Api.getLogger().log("GenericPlayer", "handleMessage", JSON.stringify(decoded));
    if (decoded.joined) {
      return; //Forgot that this happens
    }
    switch (decoded.room.data[0]['$'].class) {
      case 'memento':
        var state = decoded.room.data[0].state[0];
        var gs = GameState.fromJSON(state);
        this.emit('state', gs);
        break;
      case 'sc.framework.plugins.protocol.MoveRequest':
        this.emit('moverequest');
        break;
      case 'welcomeMessage':
        this.emit('welcome', { mycolor: Player.ColorFromString(decoded.room.data[0]['$'].color), roomId: decoded.room['$'].roomId });
        break;
      case 'error':
        this.emit('error', decoded.room.data[0]['$'].error);
      default:
        throw `Unknown data class: ${decoded.room.data[0]['$'].class}\n\n${JSON.stringify(decoded)}`;
    }
  }

  joinPrepared(reservation: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeData(`<protocol><joinPrepared reservationCode="${reservation}" />`, () => resolve());
    });
  }


}