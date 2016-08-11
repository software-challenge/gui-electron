"use strict";
const interfaceJarPath = '../socha/v8interface/build/jar/interface.jar';
const interfacePackage = 'v8interface';
const interfaceClassname = 'V8Interface';
const gameName = 'swc_2016_twixt';

var start = function(port, name1, timeout1, name2, timeout2){
    this.interface.setPortSync(port);
    this.server = this.interface.getServerSync();
    this.interface.addClientSync(name1, false, timeout1);
    this.interface.addClientSync(name2, false, timeout2);
    this.gameroom = this.interface.createGameSync(gameName);
    this.gameroom.pauseSync(true);
    this.reservations = this.interface.getReservationsSync(this.gameroom);
}

var step = function(){
  this.stepSync(false);
}

var init = function(){
  var java = require('java');
  java.classpath.push(interfaceJarPath);
  java.import([interfacePackage, interfaceClassname].join('.'));
  var V8Interface = java.newInstanceSync([interfacePackage, interfaceClassname].join('.'));
  return {
    'java': java,
    'interface': V8Interface,
    'start': start,
    'step': step
  };
}

module.exports = init;
