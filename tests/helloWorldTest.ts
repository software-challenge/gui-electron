import "jasmine"
import { GameState, Board, GameRuleLogic, Coordinates } from '../src/api/rules/CurrentGame'
import { TestHelper } from './testHelper'

describe('logic', function() {
  it('swarm connect on empty field', function() {
    let gs = new GameState()
    TestHelper.updateGamestateWithBoard(gs, "" +
                                        "    ----------" +
                                        "   ------------" +
                                        "  --------------" +
                                        " RGBG------------" +
                                        "--------BQ--------" +
                                        " ----------------" +
                                        "  --------------" +
                                        "   ------------" +
                                        "    ----------")
    expect(gs.board.getField(new Coordinates(-3, 4, -1)).stack.length).toBe(1)
    expect(GameRuleLogic.isSwarmConnected(gs.board)).toBe(false);
  });
});
