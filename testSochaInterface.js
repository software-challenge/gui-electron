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

console.log("Testing synchronous interface");
console.log(V8Interface.testSync());

console.log("Testing asynchronous interface");
var t1 = new Date().getTime();
V8Interface.testAsync((e, r) => {
	console.log(r)
	console.log(`Async method call took ${(new Date().getTime()) - t1}ms`);
});

//Create game
//var Game =V8Interface.createGameSync();

//console.log("Created game:");
