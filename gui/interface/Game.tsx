import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Viewer } from '../../viewer/Viewer';
import { GameCreationOptions } from './GameCreationOptions';

export class Game extends React.Component<{ options: GameCreationOptions }, any> {
  private viewer: Viewer;
  private elem: Element;
  private elemSet: boolean;
  constructor() {
    super();
    this.viewer = null;
  }

  startViewer(e) {
    if (!this.viewer) {
      this.viewer = new Viewer(e, document, window);
    }
  }

  componentWillUnmount() {
    if (this.viewer) {
      console.log("Stopping viewer!");
      this.viewer.stop();
    }
  }

  render() {
    return (
      <div className="replay-viewer" ref={elem => { this.startViewer(elem) }}></div>
    );
  }
}