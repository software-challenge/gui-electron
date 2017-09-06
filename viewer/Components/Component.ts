///  <reference path="../../babylon.d.ts" />

import { MaterialBuilder } from '../Engine/MaterialBuilder';

export interface Component {
  init(scene: BABYLON.Scene, materialBuilder: MaterialBuilder);
}