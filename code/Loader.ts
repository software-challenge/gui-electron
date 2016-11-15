import {Replay} from "./Replay";
import {Helpers} from "./Helpers";

export namespace Loader{
    export let getReplay = async function(url: string):Promise<Replay>{
        let xmldoc = await Helpers.getXmlDocument(url);
        return new Promise<Replay>(resolve => {
            let replayName = /\/?(\w+)\./.exec(url)[1]; //Extract replay name from url
            return new Replay(replayName, xmldoc);
        });
    }
}