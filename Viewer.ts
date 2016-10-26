import {Replay} from "./Replay";

export class Viewer{
    replay: Replay;

    constructor(node: Element){
        let replayPath: string = node.getAttribute("replay");
        this.replay = new Replay(replayPath);
        console.log(this.replay);
    }
}