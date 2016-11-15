/// <reference path="../typings/mocha/mocha.d.ts" />
//  <reference path="../typings/modules/chai/chai.d.ts" />
import {Adder} from "../code/Adder";

var assert = chai.assert;

describe('Adder', () =>{
    var subject = Adder;
    beforeEach(() =>{
        subject = new Adder(3);
    })

    describe('#add', () =>{
        var result = subject.add(4);
        assert.equals(result, 7);
    })
})