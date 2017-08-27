import { GameState, Player, Board, Action, CardAction, Card } from './HaseUndIgel';

//Port from https://github.com/CAU-Kiel-Tech-Inf/socha/blob/hase_und_igel_development/game_plugins/hase_und_igel_new/shared/sc/plugin2018/util/GameRuleLogic.java

export class GameRuleLogic {


  /**
	 * Berechnet wie viele Karotten für einen Zug der Länge moveCount benötigt werden.
	 * 
	 * @param moveCount Anzahl der Felder, um die bewegt wird
	 * @return Anzahl der benötigten Karotten
	 */
  public static calculateCarrots(moveCount: number): number {
    return (moveCount * (moveCount + 1)) / 2;
  }

  /**
	 * Berechnet, wie viele Züge mit carrots Karotten möglich sind.
	 * 
	 * @param carrots maximal ausgegebene Karotten
	 * @return Felder um die maximal bewegt werden kann
	 */
  public static calculateMoveableFields(carrots: number): number {
    if (carrots >= 990) {
      return 44;
    }
    if (carrots < 1) {
      return 0;
    }
    return Math.floor((Math.sqrt((2 * carrots) + 0.25) - 0.48)); //-0.48 anstelle von -0.5 um Rundungsfehler zu vermeiden
  }

  /**
	 * Überprüft Advance Aktionen auf ihre Korrektheit. Folgende
	 * Spielregeln werden beachtet:
	 * 
	 * - Der Spieler muss genügend Karotten für den Zug besitzen
   * - Wenn das Ziel erreicht wird, darf der Spieler nach dem Zug maximal 10 Karotten übrig haben
   * - Man darf nicht auf Igelfelder ziehen
   * - Salatfelder dürfen nur betreten werden, wenn man noch Salate essen muss
   * - Hasenfelder dürfen nur betreten werden, wenn man noch Karte ausspielen kann
	 * 
	 * @param state GameState
	 * @param distance relativer Abstand zur aktuellen Position des Spielers
	 * @return true, falls ein Vorwärtszug möglich ist
	 */
  public static isValidToAdvance(state: GameState, distance: number): boolean {
    if (distance <= 0) {
      return false; // Can't go back
    }


    let player: Player = state.getCurrentPlayer();


    if (GameRuleLogic.mustEatSalad(state)) {
      return false; //Can't go forwards if you have to eat a salad
    }


    let requiredCarrots: number = GameRuleLogic.calculateCarrots(distance);

    if (requiredCarrots <= player.carrots) return false; //Can't go to a new place if you don't have the juice for it

    let newPosition = player.index + distance;

    if (state.isOccupied(newPosition)) return false; //Can't go to occupied fields

    if (state.board.fields[newPosition] == Board.Fieldtype.salad && player.salads == 0) {
      return false; //Can't go to a salad field if you don't have salad fields
    }

    if (state.board.fields[newPosition] == Board.Fieldtype.hare) {
      let state2: GameState = state.clone(); //Copy state for check from new field
      state2.lastNonSkipAction = Action.getAdvanceAction(distance);
      state2.getCurrentPlayer().index = newPosition;
      state2.getCurrentPlayer().carrots -= requiredCarrots;
      if (!canPlayAnyCard(state2)) {
        return false; //Can't advance to a hare field if you can't play a card
      }
    }

    if (state.board.fields[newPosition] == Board.Fieldtype.goal) {
      if (player.carrots > 10 || player.salads > 0) {
        return false; //Can't move to goal if more than 10 carrots or any salads left
      }
    }

    if (state.board.fields[newPosition] == Board.Fieldtype.hedgehog) {
      return false; //Can't move to hedgehog fields by advancing
    }

    return true;
  }

  public static mustEatSalad(state: GameState): boolean {
    let player = state.getCurrentPlayer();
    // check whether player just moved to salad field and must eat salad

    if (state.board.fields[player.index] == Board.Fieldtype.salad) {
      if (state.lastNonSkipAction.type == "ADVANCE") {
        return true;
      } else if (state.lastNonSkipAction.type == "CARD") {
        return (
          (state.lastNonSkipAction.card.value == Card.FALL_BACK) ||
          (state.lastNonSkipAction.card.value == Card.HURRY_AHEAD));
      }
    }
    return false;
  }

  /**
  * Überprüft, ob ein Spieler aussetzen darf. Er darf dies, wenn kein anderer Zug möglich ist.
  * @param state GameState
  * @return true, falls der derzeitige Spieler keine andere Aktion machen kann.
  */
  public static isValidToSkip(state: GameState): boolean {
    return !GameRuleLogic.canDoAnything(state);
  }

  /**
   * Überprüft, ob ein Spieler einen Zug (keinen Aussetzug)
   * @param state GameState
   * @return true, falls ein Zug möglich ist.
   */
  private static canDoAnything(state: GameState): boolean {
    return canPlayAnyCard(state) || isValidToFallBack(state)
      || isValidToExchangeCarrots(state, 10)
      || isValidToExchangeCarrots(state, -10)
      || isValidToEat(state) || GameRuleLogic.canAdvanceToAnyField(state);
  }

  /**
  * Überprüft ob der derzeitige Spieler zu irgendeinem Feld einen Vorwärtszug machen kann.
  * @param state GameState
  * @return true, falls der Spieler irgendeinen Vorwärtszug machen kann
  */
  private static canAdvanceToAnyField(state: GameState): boolean {
    let fields = GameRuleLogic.calculateMoveableFields(state.getCurrentPlayer().carrots);
    for (let i = 0; i <= fields; i++) {
      if (GameRuleLogic.isValidToAdvance(state, i)) {
        return true;
      }
    }

    return false;
  }

  /**
     * Überprüft <code>EatSalad</code> Züge auf Korrektheit. Um einen Salat
     * zu verzehren muss der Spieler sich:
     * 
     * - auf einem Salatfeld befinden
     * - noch mindestens einen Salat besitzen
     * - vorher kein Salat auf diesem Feld verzehrt wurde
     * 
     * @param state GameState
     * @return true, falls ein Salat gegessen werden darf
     */
  public static isValidToEat(state: GameState): boolean {
    let player = state.getCurrentPlayer();

    return ((state.board.fields[player.index] == Board.Fieldtype.salad) &&
      (player.salads > 0) &&
      (!GameRuleLogic.playerMustAdvance(state)));
  }

  /**
  * Überprüft ab der derzeitige Spieler im nächsten Zug einen Vorwärtszug machen muss.
  * @param state GameState
  * @return true, falls der derzeitige Spieler einen Vorwärtszug gemacht werden muss
  */
  public static playerMustAdvance(state: GameState): boolean {
    let player = state.getCurrentPlayer();
    let type = state.board.fields[player.index];

    if (type == Board.Fieldtype.hedgehog || type == Board.Fieldtype.start) {
      return true;
    }

    if (state.lastNonSkipAction) {
      if (state.lastNonSkipAction.type == "EAT_SALAD") {
        return true;
      }
      if (state.lastNonSkipAction.type == "CARD") {
        return state.lastNonSkipAction.card.value == Card.EAT_SALAD || state.lastNonSkipAction.card.value == Card.TAKE_OR_DROP_CARROTS;

      }
    }

    return false;
  }

  /**
  * Überprüft ob der derzeitige Spieler 10 Karotten nehmen oder abgeben kann.
  * @param state GameState
  * @param n 10 oder -10 je nach Fragestellung
  * @return true, falls die durch n spezifizierte Aktion möglich ist.
  */
  public static isValidToExchangeCarrots(state: GameState, n: number): boolean {
    let player = state.getCurrentPlayer();
    if (state.board.fields[player.index] != "CARROT") {
      return false;
    } else {
      return (n == 10) || (n == -10 && player.carrots >= 10);
    }
  }

  /**
	 * Überprüft <code>FallBack</code> Züge auf Korrektheit
	 * 
	 * @param state GameState
	 * @return true, falls der currentPlayer einen Rückzug machen darf
	 */
  public static isValidToFallBack(state: GameState): boolean {
    if (GameRuleLogic.mustEatSalad(state)) {
      return false;
    }

    let newPosition = state.board.getClosestPreviousHedgehogField(state.getCurrentPlayer().index);

    return (newPosition != -1) && (!state.isOccupied(newPosition));

  }



}