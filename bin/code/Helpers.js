var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Helpers;
    (function (Helpers) {
        Helpers.ajax = function (url, callback) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    callback(xhttp.responseText);
                }
            };
            xhttp.open("GET", url);
            xhttp.send();
        };
        Helpers.getXmlDocument = function (url) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise(resolve => {
                    Helpers.ajax(url, (replay) => {
                        var parser = new DOMParser(); //Parse to xml DOM tree
                        var xml = parser.parseFromString(replay, "text/xml");
                        resolve(xml);
                    });
                });
            });
        };
        var uid = 0;
        Helpers.getUID = function () {
            return uid++;
        };
    })(Helpers = exports.Helpers || (exports.Helpers = {}));
});
//# sourceMappingURL=Helpers.js.map