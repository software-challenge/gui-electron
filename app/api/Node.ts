import { Api, ExecutableStatus } from './Api';
import { ServerEvent } from './Server';
import { GenericClient } from './GenericClient';
import { Helpers } from './Helpers';

//1. Create Server

var server = Api.getServer(false); //Create a server but don't start it yet

server.on('stdout', s => console.log(s));
server.on('stderr', s => console.error(s));
server.on('status', s => console.log(Helpers.getLogLine("SERVER STATUS: " + ExecutableStatus.toString(s))));

// 2. Start server and wait for okay signal
server.start();

// 3. Start observer client
setTimeout(() => { var c = new GenericClient() }, 5000);