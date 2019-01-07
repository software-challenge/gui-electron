import { mat4, vec3 } from 'gl-matrix'

export module Matrix {
  export function unit(): number[] {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
  }

  export function multiply(a: number[], b: number[]): number[] {
    return [
      a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12],
      a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13],
      a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14],
      a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15],

      a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12],
      a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13],
      a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14],
      a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15],

      a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12],
      a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13],
      a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14],
      a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15],

      a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12],
      a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13],
      a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14],
      a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15],
    ]
  }

  export function rotate(d: [number, number, number], alpha: number): number[] {
    let cos_a: number = Math.cos(alpha)
    let sin_a: number = Math.sin(alpha)
    let _1_cos_a: number = 1 - cos_a
    return [
      d[0] * d[0] * _1_cos_a + cos_a, d[0] * d[1] * _1_cos_a - d[2] * sin_a, d[0] * d[2] * _1_cos_a + d[1] * sin_a, 0,
      d[1] * d[0] * _1_cos_a + d[2] * sin_a, d[1] * d[1] * _1_cos_a + cos_a, d[1] * d[2] * _1_cos_a - d[0] * sin_a, 0,
      d[2] * d[0] * _1_cos_a - d[1] * sin_a, d[2] * d[1] * _1_cos_a + d[0] * sin_a, d[2] * d[2] * _1_cos_a + cos_a, 0,
      0, 0, 0, 1,
    ]
  }

  export function perspective(aspect: number, angle: number, near: number, far: number): number[] {
    let nf = near / far
    let f = 1.0 / Math.tan(angle / 2)
    return [ //plainly wrong
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near), near,
      0, 0, -1, 0,
    ]
  }

  export function transpose(m: number[]): number[] {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ]
  }

  export function cameraMatrix(aspect: number, angle: number, near: number, far: number, position: number[], target: number[]): number[] {
    let r = mat4.create()
    mat4.multiply(
      r,
      mat4.perspective(
        mat4.create(), angle, aspect, near, far,
      ),
      mat4.lookAt(
        mat4.create(),
        vec3.fromValues(position[0], position[1], position[2]),
        vec3.fromValues(target[0], target[1], target[2]),
        vec3.fromValues(0, 0, 1),
      ),
    )
    return r
  }
}