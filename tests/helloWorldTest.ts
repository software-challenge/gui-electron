import "jasmine"
import { GameState, Board, GameRuleLogic, Coordinates } from '../src/api/rules/CurrentGame'
import { TestHelper } from './testHelper'

describe('Game-Logic', function () {
  // testing isSwarmConnected
  it('swarm separated by obstructed field', function () {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, "" +
      "    ----------" +
      "   ------------" +
      "  --------------" +
      " RGBG------------" +
      "----OO--BQ--------" +
      " ----RBRG--------" +
      "  --------------" +
      "   ------------" +
      "    ----------")
    expect(GameRuleLogic.isSwarmConnected(gs.board)).toBe(false);
  });
  it('without being connected', function () {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, "" +
      "    ----------" +
      "   ------------" +
      "  --------------" +
      " RGBG------------" +
      "--------BQ--------" +
      " ----RBRG--------" +
      "  --------------" +
      "   ------------" +
      "    ----------")
    expect(GameRuleLogic.isSwarmConnected(gs.board)).toBe(false);
  });
  it('swarm connected', function () {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, "" +
      "    ----------" +
      "   ------------" +
      "  --------------" +
      " RGBG------------" +
      "----RG--BQ--------" +
      " ----RBRG--------" +
      "  --------------" +
      "   ------------" +
      "    ----------")
    expect(GameRuleLogic.isSwarmConnected(gs.board)).toBe(true);
  });

  // testing ...
});

describe('Possible moves', function () {
  // testing possible moves
  it('Bee possible moves', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, "" +
                                        "    ----------" +
                                        "   ------------" +
                                        "  --------------" +
                                        " RBBQ------------" +
                                        "----RG--BB--------" +
                                        " ----RBRQ--------" +
                                        "  --------------" +
                                        "   ------------" +
                                        "    ----------")
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-3, 4, -1)).length).toBe(3);
  });
});

describe('data structures', function() {
  describe('board', function() {
    it('clones board correctly', function() {
      let gs = new GameState()
      TestHelper.updateGamestateWithBoard(gs, "" +
                                          "    ----------" +
                                          "   ------------" +
                                          "  --------------" +
                                          " RBBQ------------" +
                                          "----RG--BB--------" +
                                          " ----RBRQ--------" +
                                          "  --------------" +
                                          "   ------------" +
                                          "    ----------")
      let clone = gs.board.clone()
      expect(clone.getField(new Coordinates(-3, 4, -1))).not.toBe(null)
      expect(clone.getField(new Coordinates(-3, 4, -1)).stack.length).toBe(1)
      expect(clone.getField(new Coordinates(0, 0, 0))).not.toBe(null)
      clone.getField(new Coordinates(-3, 4, -1)).stack.pop()
      expect(gs.board.getField(new Coordinates(-3, 4, -1)).stack.length).toBe(1)
    })
  })
})
