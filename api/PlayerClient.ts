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

  private joinRequest: Promise<Array<any>>;
  private joined: () => void;

  constructor(name: string) {
    super(false, name);
    this.on('message', msg => this.handleMessage(msg));
  }

  private async handleMessage(msg: string) {
    msg = msg.replace('<protocol>', ''); //Strip unmatched protocol tag //Really dirty hack
    Api.getLogger().log("GenericPlayer", "handleMessage", msg);
    //var decoded = await Parser.getJSONFromXML(msg);
    Parser.getJSONFromXML(msg).then(decoded => {
      Api.getLogger().log("GenericPlayer", "handleMessage", JSON.stringify(decoded));
      if (decoded.joined || !decoded.room || !decoded.room.data) {
        return; //Forgot that this happens
      }
      switch (decoded.room.data[0]['$'].class.trim()) {//Sometimes, extra linebreaks end up here
        case 'memento':
          var state = decoded.room.data[0].state[0];
          var gs = GameState.fromJSON(state);
          this.emit('state', gs);
          break;
        case 'sc.framework.plugins.protocol.MoveRequest':
          this.emit('moverequest');
          break;
        case 'welcomeMessage':
          if (this.joined) {
            this.joined();
          }
          this.emit('welcome', { mycolor: Player.ColorFromString(decoded.room.data[0]['$'].color), roomId: decoded.room['$'].roomId });
          break;
        case 'error':
          var error = decoded.room.data[0].$.error;
          console.log(decoded.room);
          this.emit('error', error);
          break;
        default:
          throw `Unknown data class: ${decoded.room.data[0]['$'].class}\n\n${JSON.stringify(decoded)}`;
      }
    }).catch(error => console.log("Error in Parser.getJSONFromXML: " + error));
  }

  joinPrepared(reservation: string): Promise<Array<any>> {
    let requestJoin = new Promise((resolve, reject) => {
      this.writeData(`<protocol><joinPrepared reservationCode="${reservation}" />`, resolve);
    });
    this.joinRequest = Promise.all([requestJoin, new Promise((resolve, reject) => { this.joined = resolve; })]);
    return this.joinRequest;
  }


}