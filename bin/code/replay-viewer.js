define(["require", "exports", "./Viewer", "./Loader"], function (require, exports, Viewer_1, Loader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let viewers = [];
    exports.init = function () {
        //Find all viewer nodes in the document and create a viewer in them
        let viewerNodes = document.getElementsByTagName("replay-viewer");
        for (let i = 0; i < viewerNodes.length; i++) {
            if (viewerNodes[i] != undefined) {
                let replay = viewerNodes[i];
                let replayButton = document.createElement('button');
                replayButton.innerText = "Anzeigen";
                replayButton.addEventListener('click', () => {
                    (function () {
                        replay.removeChild(replayButton);
                        replay.removeAttribute('style'); // remove the display inline style
                        let replayPath = viewerNodes[i].getAttribute("replay");
                        Loader_1.Loader.getReplay(replayPath).then(replay => {
                            console.log('loaded replay ' + replay.replayName);
                            viewers.push(new Viewer_1.Viewer(replay, viewerNodes[i], document, window));
                        });
                    })();
                });
                replay.appendChild(replayButton);
            }
        }
    };
    exports.init();
});
//# sourceMappingURL=replay-viewer.js.map