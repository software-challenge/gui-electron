import * as React from 'react';
import { render } from 'react-dom';
import { App } from './App';
import { Api } from '../api/Api';

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
  window.addEventListener("beforeunload", () => {
    Api.getServer().stop();
  })
  render(
    <App />,
    document.getElementById('root')
  );
  loadCSS("main.css");
}