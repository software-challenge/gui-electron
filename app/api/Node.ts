import { Api, ExecutableStatus } from './Api';
import { ServerEvent } from './Server';
import { GenericClient } from './GenericClient';
import { Helpers } from './Helpers';
import "process";

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

let server_ready = new Promise((resolve, reject) => {
  try {
    server.on("stdout", s => {
      if (/ClientManager running/.test(s)) {
        Helpers.log("Server ready");
        resolve();
      }
    });
  } catch (e) {
    reject(e);
  }
})




// 3. Start observer client
server_ready.then(() => {
  Helpers.log("Starting client");
  var c = new GenericClient();
});

