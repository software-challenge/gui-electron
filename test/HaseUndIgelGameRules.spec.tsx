import { GameState, PLAYERCOLOR, Player, Board } from '../api/HaseUndIgel';
import { expect } from 'chai';
import { GameRuleLogic } from '../api/HaseUndIgelGameRules';

describe('HaseUndIgelGameRules', () => {
  let state: GameState;
  beforeEach(() => {
    state = new GameState();
  })

  describe('calculation of required carrots', () => {
    it('is the inverse of calculation of movable fields', () => {
      for (let m = 1; m <= 44; m++) {
        expect(GameRuleLogic.calculateMoveableFields(GameRuleLogic.calculateCarrots(m))).to.equal(m)
      }
    })
  })

  describe('first round', () => {
    it('is in initial state', () => {
      expect(state.red.color).to.equal(Player.COLOR.RED)
      expect(state.blue.color).to.equal(Player.COLOR.BLUE)
      expect(state.red.index).to.equal(0)
      expect(state.blue.index).to.equal(0)
      expect(state.red).to.equal(state.getCurrentPlayer())
      expect(state.red).to.equal(state.getStartPlayer())
      expect(state.red.carrots).to.equal(68)
      expect(state.red.salads).to.equal(5)
      expect(state.blue.carrots).to.equal(68)
      expect(state.blue.salads).to.equal(5)
      expect(state.red.cards.length).to.equal(4)
      expect(state.blue.cards.length).to.equal(4)
    })

    it('is not possible to fall back', () => {
      expect(GameRuleLogic.isValidToFallBack(state)).to.equal(false)
    })
    it('is not possible to exchange carrots', () => {
      expect(GameRuleLogic.isValidToExchangeCarrots(state, 0)).to.equal(false)
    })
    it('is not possible to play a eat salad card', () => {
      expect(GameRuleLogic.isValidToPlayEatSalad(state)).to.equal(false)
    })
    it('is possible to advance', () => {
      expect(GameRuleLogic.isValidToAdvance(state, state.board.getNextFieldByType(Board.Fieldtype.carrot))).to.equal(true)
    })
  })
})
