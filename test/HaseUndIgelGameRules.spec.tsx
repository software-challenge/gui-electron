import { GameState, PLAYERCOLOR, Player, Board, Action, Card } from '../api/rules/HaseUndIgel';
import { expect } from 'chai';
import { GameRuleLogic } from '../api/rules/HaseUndIgelGameRules';

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
      expect(state.board.fields[0]).to.equal(Board.Fieldtype.start)
      expect(state.board.fields[64]).to.equal(Board.Fieldtype.goal)
    })

    it('is not possible to fall back', () => {
      expect(GameRuleLogic.isValidToFallBack(state)).to.be.false
    })
    it('is not possible to exchange carrots', () => {
      expect(GameRuleLogic.isValidToExchangeCarrots(state, 0)).to.be.false
    })
    it('is not possible to play a eat salad card', () => {
      expect(GameRuleLogic.isValidToPlayEatSalad(state)).to.be.false
    })
    it('is possible to advance', () => {
      expect(GameRuleLogic.isValidToAdvance(state, state.board.getNextFieldByType(Board.Fieldtype.carrot))).to.be.true
    })

    it('is not possible to advance onto a hedgehog field', () => {
      let hedgehogDistance = state.board.getNextFieldByType(Board.Fieldtype.hedgehog)
      expect(hedgehogDistance).to.be.at.most(
        GameRuleLogic.calculateMoveableFields(state.getCurrentPlayer().carrots)
      )
      expect(GameRuleLogic.isValidToAdvance(state, hedgehogDistance)).to.be.false
    })
  })

  describe('take or drop carrots', () => {
    it('is not possible on start field', () => {
      expect(GameRuleLogic.isValidToExchangeCarrots(state, 10)).to.be.false
    })
    it('is not possible on hare field', () => {
      state.red.index = state.board.getNextFieldByType(Board.Fieldtype.hare)
      expect(GameRuleLogic.isValidToExchangeCarrots(state, 10)).to.be.false
    })
    it('is not possible on salad field', () => {
      state.red.index = state.board.getNextFieldByType(Board.Fieldtype.salad)
      expect(GameRuleLogic.isValidToExchangeCarrots(state, 10)).to.be.false
    })
    it('is not possible on position 1 field', () => {
      state.red.index = state.board.getNextFieldByType(Board.Fieldtype.position_1)
      expect(GameRuleLogic.isValidToExchangeCarrots(state, 10)).to.be.false
    })
    it('is not possible on position 2 field', () => {
      state.red.index = state.board.getNextFieldByType(Board.Fieldtype.position_2)
      expect(GameRuleLogic.isValidToExchangeCarrots(state, 10)).to.be.false
    })
    it('is possible on carrot field', () => {
      state.red.index = state.board.getNextFieldByType(Board.Fieldtype.carrot)
      expect(GameRuleLogic.isValidToExchangeCarrots(state, 10)).to.be.true
    })
  })

  describe('must play card', () => {
    it('is updated when entering a hare field', () => {
      let advanceToHare = new Action("ADVANCE", state.board.getNextFieldByType(Board.Fieldtype.hare))
      let playCard = new Card(Card.TAKE_OR_DROP_CARROTS)
      advanceToHare.perform(state)
      playCard.perform(state)
      expect(state.red.mustPlayCard).to.be.false
    })
  })

  describe('cloning a gamestate', () => {
    it('performs a deep clone', () => {
      let gamestate = new GameState();
      let clone = gamestate.clone()
      clone.board.fields[2] = Board.Fieldtype.start
      expect(gamestate.board.fields[2]).to.not.equal(Board.Fieldtype.start)
      // TODO: add more expects
    })
  })
})
