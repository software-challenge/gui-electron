import {Replay} from "./Replay";

let viewers: Viewer[] = [];

let init = function(): void{
    //Find all viewer nodes in the document and create a viewer in them
    var viewerNodes = document.getElementsByTagName("replay-viewer");
    for(var i = 0; i < viewerNodes.length; i++){
        viewers.push(new Viewer(viewerNodes[i]));
    }
}



class Viewer{
    replay: Replay;

    constructor(node: Element){
        let replayPath: string = node.getAttribute("replay");
        this.replay = new Replay(replayPath);
    }
}