import 'jasmine'
import { GameState, Board, GameRuleLogic, Coordinates } from '../src/api/rules/CurrentGame'
import { TestHelper }                                   from './testHelper'

describe('Game-Logic', function() {
  it('swarm separated by obstructed field', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------------' +
      '  ------------------' +
      ' RGBG----------------' +
      '----OO--BQ------------' +
      ' ----RBRG------------' +
      '  ------------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.isSwarmConnected(gs.board)).toBe(false)
  })
  it('without being connected', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------------' +
      '  ------------------' +
      ' RGBG----------------' +
      '--------BQ------------' +
      ' ----RBRG------------' +
      '  ------------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.isSwarmConnected(gs.board)).toBe(false)
  })
  it('swarm connected', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------------' +
      '  ------------------' +
      ' RGBG----------------' +
      '----RG--BQ------------' +
      ' ----RBRG------------' +
      '  ------------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.isSwarmConnected(gs.board)).toBe(true)
  })

  // testing getLineBetweenCoords
  it('line between coords while not in line', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------OO----' +
      '  RA--------BA------' +
      ' OOBQ------RARG------' +
      '----BSBSRBRSRSRSRGRABG' +
      ' --BABS------RQRBOO--' +
      '  ----BB------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.getLineBetweenCoords(gs.board, new Coordinates(2, -1, -1), new Coordinates(1, -3, 2)).length).toBe(0)
  })
  it('line between coords in line with insects between', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------OO----' +
      '  RA--------BA------' +
      ' OOBQ------RARG------' +
      '----BSBSRBRSRSRSRGRABG' +
      ' --BABS------RQRBOO--' +
      '  ----BB------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    let coordsBetween = GameRuleLogic.getLineBetweenCoords(gs.board, new Coordinates(5, -5, 0), new Coordinates(-4, 4, 0))
    expect(coordsBetween.length).toBe(8)
    expect(coordsBetween[0].coordinates.equal(new Coordinates(-3, 3, 0))).toBe(true)
    expect(coordsBetween[7].coordinates.equal(new Coordinates(4, -4, 0))).toBe(true)
    expect(gs.board.getTopPiece(coordsBetween[0].coordinates).kind).toBe('SPIDER')
    expect(gs.board.getTopPiece(coordsBetween[0].coordinates).color).toBe('BLUE')
    expect(gs.board.getTopPiece(coordsBetween[1].coordinates).kind).toBe('SPIDER')
    expect(gs.board.getTopPiece(coordsBetween[1].coordinates).color).toBe('BLUE')
    expect(gs.board.getTopPiece(coordsBetween[2].coordinates).kind).toBe('BEETLE')
    expect(gs.board.getTopPiece(coordsBetween[2].coordinates).color).toBe('RED')
    expect(gs.board.getTopPiece(coordsBetween[3].coordinates).kind).toBe('SPIDER')
    expect(gs.board.getTopPiece(coordsBetween[3].coordinates).color).toBe('RED')
    expect(gs.board.getTopPiece(coordsBetween[4].coordinates).kind).toBe('SPIDER')
    expect(gs.board.getTopPiece(coordsBetween[4].coordinates).color).toBe('RED')
    expect(gs.board.getTopPiece(coordsBetween[5].coordinates).kind).toBe('SPIDER')
    expect(gs.board.getTopPiece(coordsBetween[5].coordinates).color).toBe('RED')
    expect(gs.board.getTopPiece(coordsBetween[6].coordinates).kind).toBe('GRASSHOPPER')
    expect(gs.board.getTopPiece(coordsBetween[6].coordinates).color).toBe('RED')
    expect(gs.board.getTopPiece(coordsBetween[7].coordinates).kind).toBe('ANT')
    expect(gs.board.getTopPiece(coordsBetween[7].coordinates).color).toBe('RED')
  })
  it('line between coords in line with hole between', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------OO----' +
      '  RA--------BA------' +
      ' OOBQ------RARG------' +
      '----BSBSRBRSRSRSRGRABG' +
      ' --BABS------RQRBOO--' +
      '  ----BB------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    let coordsBetween = GameRuleLogic.getLineBetweenCoords(gs.board, new Coordinates(-4, 1, 3), new Coordinates(0, 1, -1))
    expect(coordsBetween.length).toBe(3)
    expect(gs.board.getTopPiece(coordsBetween[0].coordinates).kind).toBe('BEETLE')
    expect(gs.board.getTopPiece(coordsBetween[0].coordinates).color).toBe('RED')
    expect(gs.board.getTopPiece(coordsBetween[1].coordinates)).toBe(null)
    expect(gs.board.getTopPiece(coordsBetween[2].coordinates).kind).toBe('BEETLE')
    expect(gs.board.getTopPiece(coordsBetween[2].coordinates).color).toBe('BLUE')
  })
})

describe('Possible moves', function() {
  // testing possible moves
  it('Ant', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------OO----' +
      '  RA--------BA------' +
      ' OOBQ------RARG------' +
      '----BSBSRBRSRSRSRGRABG' +
      ' --BABS------RQRBOO--' +
      '  ----BB------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-3, 5, -2)).length).toBe(6)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-4, 3, 1)).length).toBe(11)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(1, 0, -1)).length).toBe(7)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(2, 0, -2)).length).toBe(6)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(4, -4, 0)).length).toBe(0)
  })

  it('Bee', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------------' +
      '  ------------------' +
      ' RGBG----------------' +
      '----RG--BQ------------' +
      ' ----RBRG------------' +
      '  ------------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-1, 1, 0)).length).toBe(2)
  })
  it('Bee v2', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------OO----' +
      '  RA--------BA------' +
      ' OOBQ------RARG------' +
      '----BSBSRBRSRSRSRGRABG' +
      ' --BABS------RQRBOO--' +
      '  ----BB------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(1, -2, 1)).length).toBe(2)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-3, 4, -1)).length).toBe(0)
  })

  it('Beetle', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------OO----' +
      '  RA--------BA------' +
      ' OOBQ------RARG------' +
      '----BSBSRBRSRSRSRGRABG' +
      ' --BABS------RQRBOO--' +
      '  ----BB------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-1, 1, 0)).length).toBe(0)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-3, 1, 2)).length).toBe(3)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(2, -3, 1)).length).toBe(4)
  })

  it('Grasshopper', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------OO----' +
      '  RA--------BA------' +
      ' OOBQ------RARG------' +
      '----BSBSRBRSRSRSRGRABG' +
      ' --BABS------RQRBOO--' +
      '  ----BB------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(2, -1, -1)).length).toBe(4)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(3, -3, 0)).length).toBe(0)
  })

  it('Spider', function() {
    let gs = new GameState()
    // this is a bad example for spider....
    TestHelper.updateGamestateWithBoard(gs, '' +
      '     ------------' +
      '    --------------' +
      '   ----------OO----' +
      '  RA--------BA------' +
      ' OOBQ------RARG------' +
      '----BSBSRBRSRSRSRGRABG' +
      ' --BABS------RQRBOO--' +
      '  ----BB------------' +
      '   ----------------' +
      '    --------------' +
      '     ------------')
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-3, 3, 0)).length).toBe(0)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-3, 2, 1)).length).toBe(0)
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-2, 2, 0)).length).toBe(0)
  })
})

describe('data structures', function() {
  describe('board', function() {
    it('cloning', function() {
      let gs = new GameState()
      TestHelper.updateGamestateWithBoard(gs, '' +
        '     ------------' +
        '    --------------' +
        '   ----------------' +
        '  ------------------' +
        ' RGBG----------------' +
        '----RG--BQ------------' +
        ' ----RBRG------------' +
        '  ------------------' +
        '   ----------------' +
        '    --------------' +
        '     ------------')
      let clone = gs.board.clone()
      expect(clone.getField(new Coordinates(-4, 5, -1))).not.toBe(null)
      expect(clone.getField(new Coordinates(-4, 5, -1)).stack.length).toBe(1)
      expect(clone.getField(new Coordinates(-4, 5, -1)).stack[0].kind).toBe('GRASSHOPPER')
      expect(clone.getField(new Coordinates(0, 0, 0))).not.toBe(null)
      clone.getField(new Coordinates(-4, 5, -1)).stack.pop()
      expect(gs.board.getField(new Coordinates(-4, 5, -1)).stack.length).toBe(1)
    })

    it('string generation', function() {
      let gs = new GameState()
      TestHelper.updateGamestateWithBoard(gs, '' +
        '     ------------' +
        '    --------------' +
        '   ----------OO----' +
        '  OO--------BA------' +
        ' RABQ------RARG------' +
        '----BSBSRBRSRSRSRGRABG' +
        ' --BABS------RQRBOO--' +
        '  ----BB------------' +
        '   ----------------' +
        '    --------------' +
        '     ------------')
      expect(gs.board.countFields()).toBe(19)
      expect(gs.board.getField(new Coordinates(-4, 5, -1)).stack.length).toBe(1)
      expect(gs.board.getField(new Coordinates(-4, 5, -1)).stack[0].kind).toBe('ANT')
      expect(gs.board.getField(new Coordinates(-4, 5, -1)).stack[0].color).toBe('RED')
      expect(gs.board.getField(new Coordinates(0, 0, 0)).stack.length).toBe(1)
      expect(gs.board.getField(new Coordinates(0, 0, 0)).stack[0].kind).toBe('SPIDER')
      expect(gs.board.getField(new Coordinates(0, 0, 0)).stack[0].color).toBe('RED')
      expect(gs.board.getField(new Coordinates(-3, 2, 1)).stack.length).toBe(1)
      expect(gs.board.getField(new Coordinates(-3, 2, 1)).stack[0].kind).toBe('SPIDER')
      expect(gs.board.getField(new Coordinates(-3, 2, 1)).stack[0].color).toBe('BLUE')
      expect(gs.board.getField(new Coordinates(-3, 4, -1)).stack.length).toBe(1)
      expect(gs.board.getField(new Coordinates(-3, 4, -1)).stack[0].kind).toBe('BEE')
      expect(gs.board.getField(new Coordinates(-3, 4, -1)).stack[0].color).toBe('BLUE')
    })
  })
})
