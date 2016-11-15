import {Viewer} from "./Viewer";
import {Loader} from "./Loader";

let viewers: Viewer[] = [];

export let init = function(): void{
    //Find all viewer nodes in the document and create a viewer in them
    var viewerNodes = document.getElementsByTagName("replay-viewer");
    for(var i = 0; i < viewerNodes.length; i++){
        let replayPath = viewerNodes[i].getAttribute("replay")
        Loader.getReplay(replayPath).then(replay => {
            viewers.push(new Viewer(replay));
        });

    }
}

init();