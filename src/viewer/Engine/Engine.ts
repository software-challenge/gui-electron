import { SceneLoader } from './Loader'
import { Texture, ThreeDEntity, ThreeDObject } from './FileDefs'
import { Brush } from './Brush'
import { Logger } from '../../api/Logger'

export enum UniformType { Uniform1i, Uniform1f, Uniform2i, Uniform2f, Uniform3i, Uniform3f, Uniform4i, Uniform4f, UniformMat2f, UniformMat3f, UniformMat4f }

export class Engine {
  transposeMatrices: boolean = false
  private context: WebGLRenderingContext
  buffer: WebGLBuffer

  brushes: { [name: string]: Brush } = {}
  textures: { [name: string]: WebGLTexture } = {}
  entities: { [name: string]: ThreeDEntity } = {}

  constructor(canvas: HTMLCanvasElement, assetPath: string = 'scene.bin') {
    //1. Load scene into memory
    let data: ArrayBuffer = require('fs').readFileSync(assetPath)
    console.log('read ' + data.byteLength + ' bytes')
    let scene = SceneLoader.Load(new Uint8Array(data))
    Logger.getLogger().log('Engine', 'Constructor', `Loaded asset bundle dated ${scene.getDate().getDate()}.`)

    //2. create context
    this.context = canvas.getContext('webgl')
    if(!this.context) {
      throw 'Could not create webgl context.'
    }

    this.context.viewport(0, 0, canvas.width, canvas.height)
    this.context.clearColor(0, 0, 0, 1)
    this.context.clear(this.context.COLOR_BUFFER_BIT)
    this.context.cullFace(this.context.FRONT_AND_BACK)
    this.context.enable(this.context.DEPTH_TEST)

    //3. Create buffer
    this.buffer = this.context.createBuffer()
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.buffer)
    this.context.bufferData(this.context.ARRAY_BUFFER, scene.meshData.data, this.context.STATIC_DRAW)

    //3. Create shaders

    for(let o in scene.objects) {
      const brush: Brush = new Brush()
      const so: ThreeDObject = scene.objects[o]
      const vertexShader: WebGLShader = this.context.createShader(this.context.VERTEX_SHADER)
      const fragmentShader: WebGLShader = this.context.createShader(this.context.FRAGMENT_SHADER)
      this.context.shaderSource(vertexShader, scene.shaders[so.vertexShader].data)
      this.context.shaderSource(fragmentShader, scene.shaders[so.fragmentShader].data)
      brush.program = this.context.createProgram()
      this.context.compileShader(vertexShader)
      console.log(so.vertexShader, this.context.getShaderInfoLog(vertexShader))
      this.context.compileShader(fragmentShader)
      console.log(so.fragmentShader, this.context.getShaderInfoLog(fragmentShader))
      this.context.attachShader(brush.program, vertexShader)
      this.context.attachShader(brush.program, fragmentShader)
      this.context.linkProgram(brush.program)
      brush.name = so.name
      brush.start = so.start
      brush.length = so.length
      brush.textures = so.textures
      this.brushes[so.name] = brush
    }

    //4. Create Textures

    for(let t in scene.textures) {
      const texture: WebGLTexture = this.context.createTexture()
      const st: Texture = scene.textures[t]
      this.context.bindTexture(this.context.TEXTURE_2D, texture)
      console.log(st)
      this.context.texImage2D(
        this.context.TEXTURE_2D,
        0,
        this.context.RGBA,
        st.width,
        st.height,
        0,
        this.context.RGBA,
        this.context.UNSIGNED_BYTE,
        st.data)
      this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.NEAREST)
      this.textures[st.name] = texture
    }

    this.entities = scene.entities
  }

  drawBrush(name: string, uniforms: { [name: string]: { value: number[], type: UniformType } }) {
    let brush: Brush = this.brushes[name]
    this.context.useProgram(brush.program)
    for(let i = 0; i < brush.textures.length; i++) {
      let location = this.context.getUniformLocation(brush.program, brush.textures[i].shaderName)
      this.context.activeTexture(this.context.TEXTURE0 + i)
      this.context.bindTexture(this.context.TEXTURE_2D, this.textures[brush.textures[i].sourceName])
      this.context.uniform1i(location, i)
    }
    for(let u in uniforms) {
      let location = this.context.getUniformLocation(brush.program, u)
      switch(uniforms[u].type) {
        case UniformType.Uniform1i: {
          this.context.uniform1i(location, uniforms[u].value[0])
          break
        }
        case UniformType.Uniform1f: {
          this.context.uniform1f(location, uniforms[u].value[0])
          break
        }
        case UniformType.Uniform2i: {
          this.context.uniform2i(location, uniforms[u].value[0], uniforms[u].value[1])
          break
        }
        case UniformType.Uniform2f: {
          this.context.uniform2f(location, uniforms[u].value[0], uniforms[u].value[1])
          break
        }
        case UniformType.Uniform3i: {
          this.context.uniform3i(location, uniforms[u].value[0], uniforms[u].value[1], uniforms[u].value[2])
          break
        }
        case UniformType.Uniform3f: {
          this.context.uniform3f(location, uniforms[u].value[0], uniforms[u].value[1], uniforms[u].value[2])
          break
        }
        case UniformType.Uniform4i: {
          this.context.uniform4i(location, uniforms[u].value[0], uniforms[u].value[1], uniforms[u].value[2], uniforms[u].value[3])
          break
        }
        case UniformType.Uniform4f: {
          this.context.uniform4f(location, uniforms[u].value[0], uniforms[u].value[1], uniforms[u].value[2], uniforms[u].value[3])
          break
        }
        case UniformType.UniformMat2f: {
          this.context.uniformMatrix2fv(location, this.transposeMatrices, uniforms[u].value)
          break
        }
        case UniformType.UniformMat3f: {
          this.context.uniformMatrix3fv(location, this.transposeMatrices, uniforms[u].value)
          break
        }
        case UniformType.UniformMat4f: {
          this.context.uniformMatrix4fv(location, this.transposeMatrices, uniforms[u].value)
          break
        }
      }
    }
    let positionLocation: number = this.context.getAttribLocation(brush.program, 'pos')
    let uvLocation: number = this.context.getAttribLocation(brush.program, 'uv')
    let normalLocation: number = this.context.getAttribLocation(brush.program, 'nor')
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.buffer)
    this.context.enableVertexAttribArray(positionLocation)
    this.context.enableVertexAttribArray(uvLocation)
    this.context.enableVertexAttribArray(normalLocation)
    this.context.vertexAttribPointer(
      positionLocation,
      3,
      this.context.FLOAT,
      false,
      32,
      0,
    )
    this.context.vertexAttribPointer(
      uvLocation,
      2,
      this.context.FLOAT,
      false,
      32,
      12,
    )
    this.context.vertexAttribPointer(
      normalLocation,
      3,
      this.context.FLOAT,
      false,
      32,
      20,
    )
    this.context.drawArrays(this.context.TRIANGLES, brush.start, brush.length)
  }

  resize() {
    this.context.viewport(0, 0, this.context.canvas.width, this.context.canvas.height)
  }

}