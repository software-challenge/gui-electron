import {Replay} from "./Replay";
import {Helpers} from "./Helpers";

export class Viewer{
    replay: Replay;

    constructor(replay: Replay){
        this.replay = replay;
        console.log(this.replay);
    }
}