 "use strict";
var fs = require("fs");

//Load JVM
var java = require("java");
java.classpath.push("../socha/v8interface/build/jar/interface.jar");
java.import("v8interface.V8Interface");
//Create Interface
var V8Interface = java.newInstanceSync("v8interface.V8Interface");

console.log("Created interface:");
console.log(V8Interface);

var port = 7000;
V8Interface.setPortSync(port);

var server = V8Interface.getServerSync();

var clname1 = "Name1";
var clname2 = "Name2";

V8Interface.addClient(clname1, false, true);
V8Interface.addClient(clname2, false, true);

var gameroom = V8Interface.createGameSync("swc_2016_twixt");

gameroom.pauseSync(true);

gameroom.step(false);

var reservations = V8Interface.getReservationsSync(gameroom);

console.log(reservations);

const spawn = require('child_process').spawn;

var args1 = ["-jar", "twixt_player.jar" ,"--host", "localhost", "--port" , port, "--reservation", reservations[0]];
var args2 = ["-jar", "twixt_player.jar" ,"--host", "localhost", "--port" , port, "--reservation", reservations[1]];


var cmd2 = `java -jar twixt_player.jar --host localhost --port ${port} --reservation ${reservations[1]}`;

var proc1 = spawn('java', args1);
var proc2 = spawn('java', args2);

proc1.stdout.on('data', data => console.log(""+ data));
proc2.stdout.on('data', data => console.log(""+ data));

proc1.stderr.on('data', data => console.log("Error:" + data));
proc2.stderr.on('data', data => console.log("Error:" + data));

//Start client with java -jar -Xmx1250m C:\Users\FrikJonda\Documents\GitHub\socha\deploy\simple_client\twixt_player\jar\java8\twixt_player.jar --host localhost --port 13050 --reservation 1e7bcc3d-fbf7-4a0e-870a-2e8b999d7378

//executable --host localhost --port [port] --reservation [reservation]

//Create game
//var Game =V8Interface.createGameSync();

//console.log("Created game:");


var readLog = () => {
	V8Interface.getLogEntry((e,l) => {
		console.log("JAVA LOG: " + l);
		//readLog();
	});
}

readLog();
