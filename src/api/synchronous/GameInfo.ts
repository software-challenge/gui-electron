export class GameInfo {
  name: string;
  currentTurn: number;
  isReplay: boolean;
  constructor(name: string) {
    this.name = name;
  }
}