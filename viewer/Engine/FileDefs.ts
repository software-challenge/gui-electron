export type u32 = number;
export type u8 = number;
export type u64 = number;

export class Str {
  len: u32;
  data: u8[];

  toString() {
    return String.fromCharCode.apply(null, new Uint16Array(this.data));
  }

}

export class Scene {
  version: u32;
  date: u64;
  textures: { [name: string]: Texture } = {};
  shaders: { [name: string]: Shader } = {};
  meshData: MeshData;
  objects: { [name: string]: ThreeDObject } = {};
  entities: { [name: string]: ThreeDEntity } = {};

  getDate() {
    return new Date(this.date);
  }
}

export class ThreeDEntity {
  name: string;
  position: [number, number, number] = [null, null, null];
  rotation: [number, number, number] = [null, null, null];
}

export class Texture {
  name: string;
  width: u32;
  height: u32;
  dataLength: u32;
  data: Uint8Array;
}

export class Shader {
  name: string;
  data: string;
}

export class MeshData {
  length: u32;
  data: Uint8Array;
}

export class ThreeDObject {
  vertexShader: string;
  fragmentShader: string;
  numberOfTextures: u8;
  textures: { shaderName: string, sourceName: string }[];
  name: string;
  start: u32;
  length: u32;
}