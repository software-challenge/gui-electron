export class Adder {
  x: number;
  constructor(x: number) {
    this.x = x;
  }
  public add = function (a: number): number {
    return a + this.x;
  }
}