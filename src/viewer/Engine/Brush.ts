import { u32 } from './FileDefs'

export class Brush {
  program: WebGLProgram
  textures: { sourceName: string, shaderName: string }[]
  name: string
  start: u32
  length: u32
}