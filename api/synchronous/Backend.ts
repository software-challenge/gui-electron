// TODO replace with fetch:
import * as request from 'request';
import { Settings } from '../../viewer/Settings';

// provides access to the nodeJS backend over HTTP
// as definedin AsyncGameManager.ts
export class Backend {

  public static urlFor(path: string): string {
    return 'http://localhost:' + Settings.Port + path;
  }
  public static gameServerStatus(): Promise<string> {
    console.log("requesting game server status");
    return new Promise<string>((res, rej) => {
      request(Backend.urlFor('/check-game-server-connection'), (error, response, body) => {
        console.log("got response", error, response);
        if (error) {
          rej(error);
        } else {
          res(body);
        }
      });
    });
  }

  public static ready(): Promise<void> {
    return new Promise<void>((res, rej) => {
      const tries = 3;
      let tryConnect = (triesLeft) => {
        request(Backend.urlFor('/'), (error, response, body) => {
          if (error) {
            if (triesLeft > 0) {
              setTimeout(tryConnect(triesLeft - 1), 1000);
            } else {
              rej(`could not reach server after #{tries} tries!r`);
            }
          } else {
            res();
          }
        });
      };
      tryConnect(tries);
    });
  }
}
