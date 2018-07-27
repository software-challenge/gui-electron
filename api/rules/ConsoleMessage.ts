
export interface ConsoleMessage {
  sender: "server" | "observer" | "red" | "blue",
  type: "output" | "error",
  text: string
}