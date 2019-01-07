import { MeshData, Scene, Shader, Str, Texture, ThreeDEntity, ThreeDObject } from './FileDefs'

type u32 = number;
type u8 = number;
type u64 = number;
type f32 = number;

export class Loader {
  data: DataView
  buffer: Uint8Array
  position: number

  constructor(data: Uint8Array) {
    this.buffer = data
    this.data = new DataView(this.buffer.buffer)
    this.position = 0
  }

  readU8(): u8 {
    let n: u8 = this.data.getUint8(this.position)
    this.position++
    return n
  }

  readU32(): u32 {
    let n: u32 = this.data.getUint32(this.position, true)
    this.position += 4
    return n
  }

  readU64(): u64 {
    let n: u64 = this.readU32() + (this.readU32() << 32)
    return n
  }

  readF32(): f32 {
    let n: f32 = this.data.getFloat32(this.position, true)
    this.position += 4
    return n
  }

  readStr(): Str {
    let str = new Str()
    str.len = this.readU32()
    str.data = []
    for(let i = 0; i < str.len; i++) {
      str.data.push(this.readU8())
    }
    return str
  }

  readUint8Array(numBytes): Uint8Array {
    let start = this.position
    this.position += numBytes
    return this.buffer.slice(start, this.position)
  }
}

export class SceneLoader {
  static Load(data: Uint8Array) {
    let loader = new Loader(data)
    let scene = new Scene()
    let i
    //Read header
    scene.version = loader.readU32()
    scene.date = loader.readU64()

    //Read textures
    scene.textures = {}
    let numTextures = loader.readU32()
    console.log(numTextures)
    for(i = 0; i < numTextures; i++) {
      let t = new Texture()
      t.name = loader.readStr().toString()
      t.width = loader.readU32()
      t.height = loader.readU32()
      t.dataLength = loader.readU32()
      t.data = loader.readUint8Array(t.dataLength)
      scene.textures[t.name] = t
    }

    //Read shaders
    scene.shaders = {}
    let numShaders = loader.readU32()
    for(i = 0; i < numShaders; i++) {
      let s = new Shader()
      s.name = loader.readStr().toString()
      s.data = loader.readStr().toString()
      scene.shaders[s.name] = s
    }

    //Read mesh data
    scene.meshData = new MeshData()
    scene.meshData.length = loader.readU32()
    scene.meshData.data = loader.readUint8Array(scene.meshData.length)

    //Read objects
    scene.objects = {}
    let numObjects = loader.readU32()
    for(i = 0; i < numObjects; i++) {
      let o = new ThreeDObject()
      o.vertexShader = loader.readStr().toString()
      o.fragmentShader = loader.readStr().toString()
      o.numberOfTextures = loader.readU8()
      o.textures = []
      for(let j = 0; j < o.numberOfTextures; j++) {
        o.textures.push({
          shaderName: loader.readStr().toString(),
          sourceName: loader.readStr().toString(),
        })
      }
      o.name = loader.readStr().toString()
      o.start = loader.readU32()
      o.length = loader.readU32()
      scene.objects[o.name] = o
    }

    //Read entities
    scene.entities = {}
    let numEntities = loader.readU32()
    for(i = 0; i < numEntities; i++) {
      let e = new ThreeDEntity()
      e.name = loader.readStr().toString()
      e.position = [loader.readF32(), loader.readF32(), loader.readF32()]
      e.rotation = [loader.readF32(), loader.readF32(), loader.readF32()]
      scene.entities[e.name] = e
    }

    return scene
  }


}

/*
let data: ArrayBuffer = require('fs').readFileSync('../../blender/hare.bin');
console.log('read ' + data.byteLength + ' bytes');
let scene = SceneLoader.Load(new Uint8Array(data));
console.log(JSON.stringify(scene, undefined, 2));*/