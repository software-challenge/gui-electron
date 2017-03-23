define(["require", "exports", "../code/Replay", "chai", "jsdom"], function (require, exports, Replay_1, chai, jsdom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe('Replay', () => {
        let replay;
        let xml;
        before('load xml', function (done) {
            jsdom.env('testreplay.xml', (err, window) => {
                xml = window.document;
                done();
            });
        });
        describe('#constructor', () => {
            it('should load a replay', () => {
                replay = new Replay_1.Replay('testreplay', xml);
            });
            it('should have the correct replay name', () => {
                assert.equal(replay.replayName, 'testreplay');
            });
            console.log(replay);
            it('should have all 35 states', () => {
                console.log(replay.states);
                assert.equal(replay.states.length, 35);
            });
        });
    });
});
//# sourceMappingURL=test-Replay.js.map