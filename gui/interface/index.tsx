import * as React from 'react';
import { render } from 'react-dom';
import { App } from './App';
import { Api } from '../api/Api';

export function loadCSS(filename: string) {
  var ln = document.createElement('link');
  ln.setAttribute('rel', 'stylesheet');
  ln.setAttribute('href', filename);
  document.head.appendChild(ln);
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