import * as React from 'react';
import { render } from 'react-dom';
import { App } from './App';
import { Api } from '../api/Api';
import { Logger } from '../api/Logger';
import * as path from 'path';
var loadedCSS: string[] = [];

export function loadCSS(filename: string) {
  if (loadedCSS.indexOf(filename) == -1) {
    var ln = document.createElement('link');
    ln.setAttribute('rel', 'stylesheet');
    ln.setAttribute('href', filename);
    document.head.appendChild(ln);
    loadedCSS.push(filename);
  }
}


export function main() {
  const d = new Date();
  console.log("window.location.search=", window.location.search);
  let sdirname = decodeURIComponent(window.location.search.substring('?dirname='.length));
  console.log("setting log path to", sdirname);
  process.env.SGC_LOG_PATH = path.join(sdirname, `software-challenge-gui-${d.getFullYear()}.${d.getUTCMonth() + 1}.${d.getUTCDate()}.log`); //TODO fixme

  //Preload viewer:
  Api.getViewer();

  window.addEventListener("beforeunload", () => {
    Api.stop();
  });
  render(
    <App />,
    document.getElementById('root')
  );
  loadCSS("css/main.css");
}