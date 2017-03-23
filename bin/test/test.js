define(["require", "exports", "../code/Adder", "chai"], function (require, exports, Adder_1, chai) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe('Adder', () => {
        let subject;
        describe('#add', () => {
            subject = new Adder_1.Adder(3);
            var result = subject.add(4);
            assert.equal(result, 7, "3 + 4 is seven");
        });
        describe('#constructor', () => {
            subject = new Adder_1.Adder(10);
            var result = subject.add(1);
            assert.equal(result, 11);
        });
    });
});
//# sourceMappingURL=test.js.map