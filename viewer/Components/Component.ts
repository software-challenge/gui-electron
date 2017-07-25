///  <reference path="../../babylonjs/babylon.2.5.d.ts" />

import { Engine } from '../Engine/Engine.js';

export interface Component {
  init(engine: Engine);
}