var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./Replay", "./Helpers"], function (require, exports, Replay_1, Helpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Loader;
    (function (Loader) {
        Loader.getReplay = function (url) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log("loading replay for url " + url);
                let xmldoc = yield Helpers_1.Helpers.getXmlDocument(url);
                return new Promise(resolve => {
                    let replayName = /\/?(\w+)\./.exec(url)[1]; //Extract replay name from url
                    resolve(new Replay_1.Replay(replayName, xmldoc));
                });
            });
        };
    })(Loader = exports.Loader || (exports.Loader = {}));
});
//# sourceMappingURL=Loader.js.map