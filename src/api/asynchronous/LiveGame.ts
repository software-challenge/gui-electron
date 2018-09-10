import { remote } from 'electron';
import { GenericClient } from './GenericClient';
import { ObserverClient, RoomReservation } from './ObserverClient';
import { GameState, GameResult } from '../rules/CurrentGame';
import { GameCreationOptions, Versus, GameType, PlayerType, StartType } from '../rules/GameCreationOptions';
import { AsyncApi } from './AsyncApi';
import { Logger as SC_Logger } from '../Logger';
import { ConsoleMessage } from '../rules/ConsoleMessage';
import { ExecutableStatus } from '../rules/ExecutableStatus';
import { ExecutableClient } from './ExecutableClient';
import { PlayerClientOptions } from './PlayerClient';
import { HumanClient } from './HumanClient';
import { EventEmitter } from "events";
import { Helpers } from '../Helpers';
import { Game } from '../rules/Game';
import { Logger } from '../Logger';
//const dialog = remote.dialog;


export class LiveGame extends Game {
  observer: ObserverClient;
  client1: GameClient;
  client2: GameClient;
  private is_live: boolean;
  private has_finished: boolean;
  private roomId: Promise<string>;


  constructor(gco: GameCreationOptions) {
    super(gco.gameId);
    this.isReplay = false;
    let Logger = SC_Logger.getLogger().focus("Game", "constructor");
    Logger.log("Creating game " + gco.gameId);
    Logger.log("Options: " + JSON.stringify(gco, null ,2));
    let timeout = 10000;

    let gameStartSuccessful;
    let gameStartError;
    this.ready = new Promise<void>((res, rej) => { gameStartSuccessful = res; gameStartError = rej; });

    this.roomId =
      AsyncApi.getServer().then(server => {

        //Register hook to go offline
        server.on('status', s => {
          if (s == ExecutableStatus.Status.EXITED) {
            //Server exited.
            //Stop client processes, set game to not live
            this.is_live = false;
          }
        });
        //Wait for server to start
        return server.ready.then(() => server)
      })
      .then(server => {
        Logger.log("API Server is ready");
        //Create observer
        Logger.log("Creating Observer Client");
        this.observer = new ObserverClient(server.getHost(), server.getPort());

        this.observer.once('state', s => {
          Logger.log("First gamestate received, game successfully started");
          gameStartSuccessful()
          this.roomId.then(id => this.observer.setPaused(id, false))
        });

        this.observer.on('state', s => {
          this.gameStates.push(s);
          this.emit('state' + (this.gameStates.length - 1), s);
          this.emit('state_update');
        });

        this.observer.on('result', r => {
          gameStartSuccessful()
          this.gameResult = r;
          this.is_live = false;
        });

        this.observer.on('message', msg => {
          let m: ConsoleMessage = {
            sender: "observer",
            type: "output",
            text: msg
          };
          this.messages.push(m);
          // this.emit('message', m);
        });

        return Promise.all([server, this.observer.ready]);
      })
      .then(results => {
        let server = results[0]
        let observer = results[1]
        Logger.log("Observer ready");

        if (gco.kind === GameType.Versus) {
          let matchPlayerTypes = (kinds: Array<[PlayerType, PlayerType]>):boolean => {
            return kinds.some(t => gco.firstPlayer.kind === t[0] && gco.secondPlayer.kind === t[1])
          }

          if (matchPlayerTypes([
            [PlayerType.Computer, PlayerType.Computer],
            [PlayerType.Human,    PlayerType.Computer],
            [PlayerType.Computer, PlayerType.Human],
            [PlayerType.Human,    PlayerType.Human]])) {
            //Reserve room, start clients, done
            Logger.log("Automatic game");

            var p1 = new PlayerClientOptions(gco.firstPlayer.name, gco.firstPlayer.timeoutPossible);
            var p2 = new PlayerClientOptions(gco.secondPlayer.name, gco.secondPlayer.timeoutPossible);

            Logger.log("Starting automatic game");
            this.observer.prepareRoom(p1, p2).then(reservation => {
              let roomId = reservation.roomId
              Logger.log("Reserved room with id " + roomId)
              return this.observer.observeRoom(roomId).then(() => {
                Logger.log("Observing room with id " + roomId);
                return reservation
              })
            }).then(reservation => {
              if (gco.firstPlayer.kind == PlayerType.Computer) {
                this.client1 = new ExecutableClient(
                  gco.firstPlayer,
                  reservation.reservation1,
                  server.getHost(),
                  server.getPort()
                )
              } else {
                this.client1 = new HumanClient(
                  server.getHost(),
                  server.getPort(),
                  gco.firstPlayer.name,
                  reservation.reservation1,
                  this.id
                );
              }
              Logger.log("Client 1 started");

              if (gco.secondPlayer.kind == PlayerType.Computer) {
                this.client2 = new ExecutableClient(
                  gco.secondPlayer,
                  reservation.reservation2,
                  server.getHost(),
                  server.getPort()
                )
              } else {
                this.client2 = new HumanClient(
                  server.getHost(),
                  server.getPort(),
                  gco.secondPlayer.name,
                  reservation.reservation2,
                  this.id
                )
              }
              Logger.log("Client 2 started");

              // wait for clients to start
              // NOTE that the order of resolution of the connect-promises is arbitrary
              return Promise.all([
                this.client1.start(),
                this.client2.start()])
                .then(() => this.is_live = true)
            })
          } else if (matchPlayerTypes([
            [PlayerType.Human,   PlayerType.Manual],
            [PlayerType.Manual,  PlayerType.Human],
            [PlayerType.Computer,PlayerType.Manual],
            [PlayerType.Manual,  PlayerType.Computer]])) {

            Logger.log("Starting half-automatic half-manual game");
            //Wait for manual client to connect, start other client
            let auto_client: GameClient;
            let auto_client_is_human_client: boolean = false;
            this.observer.awaitJoinGameRoom().then(roomId => {
              return this.observer.observeRoom(roomId).then(() => {
                Logger.log("Observing room with id " + roomId);
                return roomId
              });
            }).then(roomId => {
              Logger.log("Configure automatic client");
              //Configure one client
              if (gco.firstPlayer.kind == PlayerType.Manual) {
                if (gco.secondPlayer.kind == PlayerType.Computer) {
                  this.client2 = new ExecutableClient(
                    gco.secondPlayer,
                    undefined,
                    server.getHost(),
                    server.getPort()
                  )
                } else {
                  this.client2 = new HumanClient(
                    server.getHost(),
                    server.getPort(),
                    gco.secondPlayer.name,
                    undefined,
                    this.id
                  )
                }
                if (gco.secondPlayer.kind == PlayerType.Human) {
                  auto_client_is_human_client = true;
                }
                auto_client = this.client2;
              } else {
                if (gco.firstPlayer.kind == PlayerType.Computer) {
                  this.client1 = new ExecutableClient(gco.firstPlayer, undefined, server.getHost(), server.getPort())
                } else {
                  this.client1 = new HumanClient(server.getHost(), server.getPort(), gco.firstPlayer.name, undefined, this.id)
                }
                if (gco.firstPlayer.kind == PlayerType.Human) {
                  auto_client_is_human_client = true;
                }
                auto_client = this.client1;
              }

              //Add client to room
              return auto_client.start().then(() => {
                //Disable timeout if human
                if (auto_client_is_human_client) {
                  Logger.log("Disabling timeout for human client in slot 1");
                  this.observer.setTimeoutEnabled(roomId, 1, false);
                }
                this.is_live = true;
                return roomId
              })
            })
          } else if (matchPlayerTypes([
            [PlayerType.Manual, PlayerType.Manual]])) {
            Logger.log("Starting manual game");
            Logger.log("Waiting for room creation");
            return this.observer.awaitJoinGameRoom().then(roomId => {
              //Observe room
              return this.observer.observeRoom(roomId).then(() => {
                Logger.log("Observing room with id " + roomId);
                return roomId
              });
            });

          } else {
            let message = "Something went wrong. Player types: " + JSON.stringify([gco.firstPlayer.kind, gco.secondPlayer.kind])
            Logger.log(message);
            return Promise.reject(message)
          }
        }
      })
  }

  getMessages(): ConsoleMessage[] {
    return this.messages;
  }

  /**
   * Returns true, if the game is currently running
   */
  isLive(): boolean {
    return this.is_live;
  }

  getState(n: number): Promise<GameState> {
    if (this.gameStates[n]) { //If our next state is already buffered
      return Promise.resolve(this.gameStates[n]);
    } else {//Wait for new state to be emitted
      return new Promise((res, rej) => {
        this.once('state' + n, s => {
          res(s);
        });
      });
    }
  }

  getStateNumber(state: GameState): number {
    return this.gameStates.findIndex((s: GameState) => { return s.turn == state.turn; });
  }

  requestNext() {
    if (this.is_live) {
      this.roomId.then(id => this.observer.requestStep(id))
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
        Logger.getLogger().log("LiveGame", "saveReplay", "Error saving replay: " + err);
        return err;
      }
      Logger.getLogger().log("LiveGame", "saveReplay", "Replay saved in " + path);
    });
  }

  cancel() {
    this.roomId.then(id => this.observer.cancelGame(id))
  }

}



export interface GameClient {
  ready: Promise<void>;
  start(): Promise<void>;
  stop();
}
