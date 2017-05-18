import { Replay } from "./Replay";
import { Helpers } from "./Helpers";

export namespace Loader {
  export let getReplay = async function (url: string): Promise<Replay> {
    console.log("loading replay for url " + url);
    let xmldoc = await Helpers.getXmlDocument(url);
    return new Promise<Replay>(resolve => {
      let replayName = /\/?(\w+)\./.exec(url)[1]; //Extract replay name from url
      resolve(new Replay(replayName, xmldoc));
    });
  }
}