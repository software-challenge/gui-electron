import { parseString } from 'xml2js'
//import { Logger } from '../Logger'
import { GameResult, GameState } from '../rules/CurrentGame'


export module Parser {

  export function getJSONFromXML(xml: string): Promise<any> {

    //Workaround until I fix or replace the SAX parser
    xml = xml.trim()
    if(!xml.startsWith('<')) {
      xml = '<' + xml
    }

    return new Promise((res, rej) => {
      parseString(xml, function(err, result) {
        if(err) {
//          Logger.getLogger().log('Parser', 'getJSONFromXML', 'Error parsing xml:\n\n' + xml)
          rej(err)
        } else {
          res(result)
        }
      })
    })

  }

  export function convert(json: any): any {
    let gameStates: GameState[] = []
    let gameResult: GameResult = new GameResult()
    if(json.protocol) {
      if(json.protocol.room) {
        for(let room of json.protocol.room) {
          if(room.data[0].state) {
            const state = room.data[0].state[0]
            gameStates.push(GameState.fromJSON(state))
          } else if(room.data[0].score) {
            const result = room.data[0]
            gameResult = GameResult.fromJSON(result)
          }
        }
      }
    }
    return { gameStates: gameStates, gameResult: gameResult }
  }

}
