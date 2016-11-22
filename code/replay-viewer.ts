import {Viewer} from "./Viewer";
import {Loader} from "./Loader";

let viewers: Viewer[] = [];

export let init = function(): void{
    //Find all viewer nodes in the document and create a viewer in them
    let viewerNodes = document.getElementsByTagName("replay-viewer");
    for(let i = 0; i < viewerNodes.length; i++){
        if(viewerNodes[i] != undefined){
            (function(){
            let replayPath = viewerNodes[i].getAttribute("replay");
            Loader.getReplay(replayPath).then(replay => {
                console.log('loaded replay ' + replay.replayName);
                viewers.push(new Viewer(replay, viewerNodes[i], document, window));
            });
            })();
        }
    }
}

init();