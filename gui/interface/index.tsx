import * as React from 'react';
import { render } from 'react-dom';
import { App } from './App';

export function main() {
  render(
    <App />,
    document.getElementById('root')
  );
}