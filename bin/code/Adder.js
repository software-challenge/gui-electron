define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Adder {
        constructor(x) {
            this.add = function (a) {
                return a + this.x;
            };
            this.x = x;
        }
    }
    exports.Adder = Adder;
});
//# sourceMappingURL=Adder.js.map