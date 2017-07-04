import { Api, ExecutableStatus } from './Api';
import { ServerEvent } from './Server';
import { ObserverClient } from './ObserverClient';
import { Helpers } from './Helpers';
import "process";
import { PlayerClientOptions, GenericPlayer } from './PlayerClient';

async function main() {

  //1. Create Server
  Helpers.log("Starting server");
  var server = Api.getServer(false); //Create a server but don't start it yet

  server.on('stdout', s => console.log(s));
  server.on('stderr', s => console.error("ERROR: " + s));
  server.on('status', s => console.log(Helpers.getLogLine("SERVER STATUS: " + ExecutableStatus.toString(s))));

  //Exit hooks to terminate the server
  process.on('beforeExit', () => server.stop());
  process.on('SIGINT', () => { server.stop(); process.exit(0); });
  // 2. Start server and wait for okay signal



  server.start();

  await server.ready;

  // 3. Start observer client
  Helpers.log("Starting client");
  var c = new ObserverClient();

  await c.ready;

  Helpers.log("Preparing room");

  var p1 = new PlayerClientOptions('p1', false, true);
  var p2 = new PlayerClientOptions('p2', false, true);

  var reservation = await c.prepareRoom(p1, p2);

  await c.observeRoom(reservation.roomId);

  Helpers.log("Observing room");

  //Creating players
  Helpers.log("Creating player 1");
  var red = new GenericPlayer();
  var rid = await red.joinPrepared(reservation.reservation1);
  console.log(rid);

  Helpers.log("Creating player 2");
  //var blue = new GenericPlayer();
  //blue.joinPrepared(reservation.reservation2);




  Helpers.log("Requesting step");

  await c.requestStep(reservation.roomId);

}

main();