import "jasmine"
import { GameState, Board, GameRuleLogic, Coordinates } from '../src/api/rules/CurrentGame'
import { TestHelper } from './testHelper'

describe('logic', function() {
  it('swarm connect on board with swarm separated by obstructed field', function() {
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
    expect(gs.board.getField(new Coordinates(-3, 4, -1)).stack.length).toBe(1)
    expect(GameRuleLogic.isSwarmConnected(gs.board)).toBe(false);
  });

  it('possible moves', function() {
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
    expect(GameRuleLogic.possibleMoves(gs, new Coordinates(-3, 4, -1)).length).toBe(2);
  });
});

describe('data structures', function() {
  describe('board', function() {
    it('clones correctly', function() {
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
