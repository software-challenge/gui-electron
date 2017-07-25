import { Viewer } from "./Viewer.js";

let viewers: Viewer[] = [];

export let init = function (): void {
  //Find all viewer nodes in the document and create a viewer in them
  let viewerNodes = document.getElementsByTagName("replay-viewer");
  for (let i = 0; i < viewerNodes.length; i++) {
    if (viewerNodes[i] != undefined) {
      let replay: Element = viewerNodes[i];
      let replayButton: HTMLButtonElement = document.createElement('button');
      replayButton.innerText = "Anzeigen";
      replayButton.addEventListener('click', () => {
        (function () {
          replay.removeChild(replayButton);
          replay.removeAttribute('style'); // remove the display inline style
          let replayPath = viewerNodes[i].getAttribute("replay");
          viewers.push(new Viewer(viewerNodes[i], document, window));
        })();
      });
      replay.appendChild(replayButton);
    }
  }
}

export let init_replay = function (node: HTMLElement): void {
  let replayPath = node.getAttribute("replay");
  viewers.push(new Viewer(node, document, window));
}

window['init_replay'] = init_replay;

init();
