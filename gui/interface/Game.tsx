import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Viewer } from '../../viewer/Viewer';
import { GameCreationOptions } from './GameCreationOptions';

export class Game extends React.Component<{ options: GameCreationOptions }, any> {
  private viewer: Viewer;
  private elem: Element;
  constructor() {
    super();
  }

  startViewer() {
    this.viewer = new Viewer(this.elem, document, window);
  }

  componentWillUnmount() {

  }

  render() {
    return (
      <div className="viewer" ref={elem => { this.elem = elem; this.startViewer() }}></div>
    );
  }
}