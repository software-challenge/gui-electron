/// <reference path="../typings/mocha/mocha.d.ts" />
//  <reference path="../typings/modules/chai/chai.d.ts" />
import {Adder} from "../code/Adder";

import chai = require('chai');

var assert = chai.assert;

describe('Adder', () =>{
    let subject:Adder;

    describe('#add', () =>{
        subject = new Adder(3);
        var result = subject.add(4);
        assert.equal(result,7);
    })
})