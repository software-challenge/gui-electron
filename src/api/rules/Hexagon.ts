// Utilities for dealing with hexagonal coordinates, see
// https://www.notion.so/softwarechallenge/Struktur-Hive-825c3c81552742ffbf737fac86048575

export class Hexagon {

  x: number
  y: number
  z: number

  constructor(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
  }

  hash(): string {
    return this.x + '-' + this.y
  }

}
