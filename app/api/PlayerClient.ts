

export class PlayerClientOptions {
  constructor(displayName: string, canTimeout: boolean, shouldBePaused: boolean) {
    this.displayName = displayName;
    this.canTimeout = canTimeout;
    this.shouldBePaused = shouldBePaused;
  }
  displayName: string;
  canTimeout: boolean;
  shouldBePaused: boolean;
}