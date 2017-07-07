import * as React from 'react';
import { render } from 'react-dom';
import { App } from './App';
import { Api } from '../api/Api';

export function main() {
  window.addEventListener("beforeunload", () => {
    Api.getServer().stop();
  })
  render(
    <App />,
    document.getElementById('root')
  );
}