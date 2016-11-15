///  <reference path="../typings/index.d.ts" />
import {Replay} from "../code/Replay";

import chai = require('chai');

import jsdom = require('jsdom');

var assert = chai.assert;

describe('Replay', () =>{
    let replay:Replay;
    let xml:XMLDocument;
    before('load xml', function(done){
        jsdom.env('testreplay.xml', (err, window) => {
            xml = window.document;
            done();
        })
    });
    describe('#constructor', () =>{
        it('should load a replay', ()=>{
            replay = new Replay('testreplay',xml);
        });
        it('should have the correct replay name', () =>{
            assert.equal(replay.replayName, 'testreplay');
        });
        console.log(replay)
        it('should have all 35 states', ()=>{
            console.log(replay.states);
            assert.equal(replay.states.length, 35);
        });
        
    })
})