///  <reference path="../../babylon.d.ts" />

import { Engine } from '../Engine/Engine.js';

export interface Component {
  init(engine: Engine);
}