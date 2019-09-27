import 'jasmine'
import { Parser } from '../src/api/asynchronous/Parser'
import * as fs    from 'fs'

describe('XML-Parsing', function() {
  it('xml parses to json', async function() {
    const xml = fs.readFileSync('tests/state.xml').toString()
    const state = (await Parser.getJSONFromXML(xml)).room.data[0].state[0]

    function pieceLength(pieces) {
      return pieces[0].piece ? pieces[0].piece.length : 0
    }

    expect(pieceLength(state.undeployedRedPieces)).toBe(0)
    expect(pieceLength(state.undeployedBluePieces)).toBe(3)
  })
})