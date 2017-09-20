import { remote } from 'electron';
import { GenericClient } from './GenericClient';
import { ObserverClient, RoomReservation } from './ObserverClient';
import { GameState, GameResult } from './HaseUndIgel';
import { GameCreationOptions, PlayerType, StartType } from './GameCreationOptions';
import { Api, ExecutableStatus, ConsoleMessage } from './Api';
import { ExecutableClient } from './ExecutableClient';
import { PlayerClientOptions } from './PlayerClient';
import { HumanClient } from './HumanClient';
import { EventEmitter } from "events";
import { Helpers } from './Helpers';
import { Game } from './Game';
const dialog = remote.dialog;

export class LiveGame extends Game {
  observer: ObserverClient;
  client1: GameClient;
  client2: GameClient;
  private is_live: boolean;
  private roomId: string;


  constructor(gco: GameCreationOptions, name: string) {
    super(name);
    this.isReplay = false;
    let Logger = Api.getLogger().focus("Game", "constructor");
    Logger.log("Creating game " + name);
    Logger.log("Options: " + JSON.stringify(gco));
    let gameStartSuccessful;
    let gameStartError;
    this.ready = new Promise<void>((res, rej) => { gameStartSuccessful = res; gameStartError = rej; });
    // if the game didn't start after 10 seconds, assume error
    let timeout = 10000;
    setTimeout(() => gameStartError(`game didn't start after ${timeout}ms`), timeout);
    var construct = (async function () {
      //Register hook to go offline
      Api.getServer().on('status', s => {
        if (s == ExecutableStatus.Status.EXITED) {
          //Server exited.
          //Stop client processes, set game to not live
          this.is_live = false;
        }
      });
      //Wait for server to start
      await Api.getServer().ready;

      Logger.log("API Server is ready");

      //Create observer
      Logger.log("Creating Observer Client");
      this.observer = new ObserverClient();

      this.observer.on('state', s => {
        gameStartSuccessful();
        this.gameStates.push(s);
        this.emit('state' + (this.gameStates.length - 1), s);
        this.emit('state_update');
      });

      this.observer.on('result', r => {
        gameStartSuccessful();
        this.gameResult = r;
        this.is_live = false;
      })

      this.observer.on('message', msg => {
        let m: ConsoleMessage = {
          sender: "observer",
          type: "output",
          text: msg
        };
        this.messages.push(m);
        // this.emit('message', m);
      });

      await this.observer.ready;

      Logger.log("Observer ready");

      /*
       * When enabled, the server requests a new move only after the observer sends a step request.
       * But because we buffer all rounds, there is no need for pausing.
       */
      let pause = false;

      //Create room
      let firstCanTimeout = gco.firstPlayerType != "Human";
      let firstShouldBePaused = pause;
      let secondCanTimeout = gco.secondPlayerType != "Human";
      let secondShouldBePaused = pause;
      var p1 = new PlayerClientOptions(gco.firstPlayerName, firstCanTimeout, firstShouldBePaused);
      var p2 = new PlayerClientOptions(gco.secondPlayerName, secondCanTimeout, secondShouldBePaused);

      var reservation: RoomReservation = await this.observer.prepareRoom(p1, p2);
      this.roomId = reservation.roomId;

      Logger.log("Reserved room with id " + this.roomId);

      //Observe room
      await this.observer.observeRoom(reservation.roomId);
      Logger.log("Observing room with id " + this.roomId);

      let configureClient = (type: PlayerType, startType: StartType, name: string, path: string, reservation: string): GameClient => {
        switch (type) {
          case "Computer":
            let executableClient;
            switch (startType) {
              case "Java":
                executableClient = new ExecutableClient('java', ['-jar'], path, '127.0.0.1', 13050, reservation);
                break;
              case "Direct":
                executableClient = new ExecutableClient(path, [], null, '127.0.0.1', 13050, reservation);
                break;
            }

            executableClient.on('stdout', msg => {
              let m: ConsoleMessage = {
                sender: "red",
                type: "output",
                text: msg
              };
              this.messages.push(m);
              this.emit('message', m);
              Api.getLogger().log("Livegame", "executableClient.on('stdout')", msg);
            });

            executableClient.on('stderr', msg => {
              let m: ConsoleMessage = {
                sender: "red",
                type: "error",
                text: msg
              };
              this.messages.push(m);
              this.emit('message', m);
              Api.getLogger().log("Livegame", "executableClient.on('stderr')", msg);
            });
            executableClient.on('error', msg => {
              Api.getLogger().log("Livegame", "executableClient.on('error')", "got error: " + msg);
              gameStartError(`client "${name}" sent error: ${msg}`);
            })

            executableClient.on('status', s => {
              Api.getLogger().log("Livegame", "executableClient.on('status')", "status changed to " + ExecutableStatus.toString(s));
              if (s == ExecutableStatus.Status.EXITED) {
                if (this.is_live) {
                  dialog.showErrorBox("Spielerstellung", "Client " + name + " hat sich beendet.");
                  gameStartError(`client "${name}" exited.`);
                }
              }
            })
            return executableClient;
          case "Human":
            let humanClient = new HumanClient(name, Api.getViewer().ui, reservation)
            return humanClient;
          case "External":
            throw "TODO";
        }
      }

      this.client1 = configureClient(gco.firstPlayerType, gco.firstPlayerStartType, gco.firstPlayerName, gco.firstPlayerPath, reservation.reservation1)
      this.client2 = configureClient(gco.secondPlayerType, gco.secondPlayerStartType, gco.secondPlayerName, gco.secondPlayerPath, reservation.reservation2)

      // wait for clients to start
      // NOTE that the order of resolution of the connect-promises is arbitrary
      await Promise.all([this.client1.start(), this.client2.start()]).catch((reason) => gameStartError(reason));

      this.is_live = true;
    }).bind(this);

    construct();
  }

  getMessages(): ConsoleMessage[] {
    return this.messages;
  }

  /**
   * Returns true, if the game is currently running
   */
  getLive(): boolean {
    return this.is_live;
  }

  getState(n: number): Promise<GameState> {
    if (this.gameStates[n]) { //If our next state is already buffered
      return Promise.resolve(this.gameStates[n]);
    } else {//Wait for new state to be emitted
      return new Promise((res, rej) => {
        this.once('state' + n, s => {
          res(s);
        })
      })
    }
  }

  getStateNumber(state: GameState): number {
    return this.gameStates.findIndex((s: GameState) => { return s.turn == state.turn; })
  }

  requestNext() {
    if (this.is_live) {
      this.observer.requestStep(this.roomId);
    }
  }

  getLog(): string {
    return this.observer.log;
  }

  saveReplay(path) {
    var fs = require('fs');
    let data = this.observer.getAllData();
    let protocolTag = "</protocol>";
    if (!data.endsWith(protocolTag)) {
      data = data + protocolTag;
    }
    fs.writeFile(path, data, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  }
}



export interface GameClient {
  ready: Promise<void>;
  start(): Promise<void>;
  stop();
}
