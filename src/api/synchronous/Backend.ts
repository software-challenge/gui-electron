// TODO replace with fetch
import request from 'request'

// provides access to the nodeJS backend over HTTP
// as defined in AsyncGameManager.ts
export class Backend {

  private port: number

  constructor(port: number) {
    this.port = port
  }

  public getPort(): number {
    return this.port
  }

  public urlFor(path: string): string {
    return 'http://localhost:' + this.port + path
  }

  public gameServerStatus(): Promise<string> {
    console.log('requesting game server status')
    return new Promise<string>((res, rej) => {
      request(this.urlFor('/server-info'), (error, response, body) => {
        console.log('got response', error, response)
        if (error) {
          rej(error)
        } else {
          res(body)
        }
      })
    })
  }

  public ready(): Promise<void> {
    return new Promise<void>((res, rej) => {
      const tries = 3
      let tryConnect = (triesLeft) => {
        request(this.urlFor('/'), (error, response, body) => {
          if (error) {
            if (triesLeft > 0) {
              setTimeout(() => tryConnect(triesLeft - 1), 1000)
            } else {
              rej(`could not reach server after #{tries} tries!r`)
            }
          } else {
            res()
          }
        })
      }
      tryConnect(tries)
    })
  }
}
