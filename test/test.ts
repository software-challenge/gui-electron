///  <reference path="../typings/index.d.ts" />
import {Adder} from "../code/Adder";

import chai = require('chai');

var assert = chai.assert;

describe('Adder', () =>{
    let subject:Adder;
    describe('#add', () =>{
        subject = new Adder(3);
        var result = subject.add(4);
        assert.equal(result,7, "3 + 4 is seven");
    })
    describe('#constructor', () =>{
        subject = new Adder(10);
        var result = subject.add(1);
        assert.equal(result, 11);
    });
})