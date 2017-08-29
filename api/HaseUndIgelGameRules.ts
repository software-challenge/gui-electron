import { Action, Board, Card, FIELDTYPE, GameState, Player } from './HaseUndIgel';

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

    if (requiredCarrots > player.carrots) return false; //Can't go to a new place if you don't have the juice for it

    let newPosition = player.index + distance;

    if (state.isOccupied(newPosition)) return false; //Can't go to occupied fields

    if (state.board.fields[newPosition] == Board.Fieldtype.salad && player.salads == 0) {
      return false; //Can't go to a salad field if you don't have salad fields
    }

    if (state.board.fields[newPosition] == Board.Fieldtype.hare) {
      let state2: GameState = state.clone(); //Copy state for check from new field
      state2.lastNonSkipAction = new Action("ADVANCE", distance);
      state2.getCurrentPlayer().index = newPosition;
      state2.getCurrentPlayer().carrots -= requiredCarrots;
      if (!this.canPlayAnyCard(state2)) {
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
    return this.canPlayAnyCard(state) || this.isValidToFallBack(state)
      || this.isValidToExchangeCarrots(state, 10)
      || this.isValidToExchangeCarrots(state, -10)
      || this.isValidToEat(state) || this.canAdvanceToAnyField(state);
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
        let card = (<Card>state.lastNonSkipAction)
        return card.cardType == Card.EAT_SALAD || card.cardType == Card.TAKE_OR_DROP_CARROTS;
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

    let newPosition = state.board.getPreviousFieldByType(Board.Fieldtype.hedgehog, state.getCurrentPlayer().index);

    return (newPosition != -1) && (!state.isOccupied(newPosition));

  }

  /**
   * Überprüft ob der derzeitige Spieler die <code>FALL_BACK</code> Karte spielen darf.
   * @param state GameState
   * @return true, falls die <code>FALL_BACK</code> Karte gespielt werden darf
   */
  public static isValidToPlayFallBack(state: GameState): boolean {
    let player = state.getCurrentPlayer();
    let valid = !GameRuleLogic.playerMustAdvance(state) && state.isOnHareField()
      && state.isFirst(player);


    valid = valid && player.ownsCardOfType(Card.FallBack());

    let o = state.getOtherPlayer()
    let nextPos = o.index - 1

    let type: FIELDTYPE = state.getTypeAt(nextPos);
    switch (type) {
      case Board.Fieldtype.hedgehog:
        valid = false;
        break;
      case Board.Fieldtype.start:
        break;
      case Board.Fieldtype.salad:
        valid = valid && player.salads > 0;
        break;
      case Board.Fieldtype.hare:
        let state2: GameState = null;
        state2 = state.clone();
        state2.setLastAction(Card.HurryAhead());
        state2.getCurrentPlayer().removeCard(Card.FallBack())
        valid = valid && this.canPlayAnyCard(state2);
        break;
      case Board.Fieldtype.carrot:
      case Board.Fieldtype.position_1:
      case Board.Fieldtype.position_2:
        break;
      default:
        throw "Unknown Type " + type;
    }

    return valid;
  }

  /**
   * Überprüft ob der derzeitige Spieler die <code>HURRY_AHEAD</code> Karte spielen darf.
   * @param state GameState
   * @return true, falls die <code>HURRY_AHEAD</code> Karte gespielt werden darf
   */
  public static isValidToPlayHurryAhead(state: GameState): boolean {
    let player = state.getCurrentPlayer();
    let valid = !this.playerMustAdvance(state) && state.isOnHareField()
      && !state.isFirst(player);
    valid = valid && player.ownsCardOfType(Card.HurryAhead());

    let o = state.getOtherPlayer();
    let nextPos = o.index + 1;

    let type = state.getTypeAt(nextPos);
    switch (type) {
      case Board.Fieldtype.hedgehog:
        valid = false;
        break;
      case Board.Fieldtype.salad:
        valid = valid && player.salads > 0;
        break;
      case Board.Fieldtype.hare:
        let state2 = null;
        state2 = state.clone();
        state2.setLastAction(Card.HurryAhead());
        state2.getCurrentPlayer().cards = player.removeCard(Card.HurryAhead());
        valid = valid && this.canPlayAnyCard(state2);
        break;
      case Board.Fieldtype.goal:
        valid = valid && this.canEnterGoal(state);
        break;
      case Board.Fieldtype.carrot:
      case Board.Fieldtype.position_1:
      case Board.Fieldtype.position_2:
      case Board.Fieldtype.start:
        break;
      default:
        throw "Unknown Type " + type;
    }

    return valid;
  }

  /**
   * Überprüft ob der derzeitige Spieler die <code>TAKE_OR_DROP_CARROTS</code> Karte spielen darf.
   * @param state GameState
   * @param n 20 für nehmen, -20 für abgeben, 0 für nichts tun
   * @return true, falls die <code>TAKE_OR_DROP_CARROTS</code> Karte gespielt werden darf
   */
  public static isValidToPlayTakeOrDropCarrots(state: GameState, n: number): boolean {
    let player = state.getCurrentPlayer();
    let valid = !this.playerMustAdvance(state) && state.isOnHareField()
      && player.ownsCardOfType(Card.TakeOrDropCarrots());

    valid = valid && (n == 20 || n == -20 || n == 0);
    if (n < 0) {
      valid = valid && ((player.carrots + n) >= 0);
    }
    return valid;
  }

  /**
   * Überprüft ob der derzeitige Spieler die <code>EAT_SALAD</code> Karte spielen darf.
   * @param state GameState
   * @return true, falls die <code>EAT_SALAD</code> Karte gespielt werden darf
   */
  public static isValidToPlayEatSalad(state: GameState): boolean {
    let player = state.getCurrentPlayer();
    return !this.playerMustAdvance(state) && state.isOnHareField()
      && player.ownsCardOfType(Card.EatSalat()) && player.salads > 0;
  }

  /**
   * Überprüft ob der derzeitige Spieler irgendeine Karte spielen kann.
   * TAKE_OR_DROP_CARROTS wird nur mit 20 überprüft
   * @param state GameState
   * @return true, falls das Spielen einer Karte möglich ist
   */
  private static canPlayAnyCard(state: GameState): boolean {
    let valid = false;
    let player = state.getCurrentPlayer();

    for (let card of player.cards) {
      switch (card.cardType) {
        case Card.EAT_SALAD:
          valid = valid || this.isValidToPlayEatSalad(state);
          break;
        case Card.FALL_BACK:
          valid = valid || this.isValidToPlayFallBack(state);
          break;
        case Card.HURRY_AHEAD:
          valid = valid || this.isValidToPlayHurryAhead(state);
          break;
        case Card.TAKE_OR_DROP_CARROTS:
          valid = valid || this.isValidToPlayTakeOrDropCarrots(state, 20);
          break;
        default:
          throw "Unknown CardType " + card.cardType;
      }
    }

    return valid;
  }

  /**
   * Überprüft ob der derzeitige Spieler die Karte spielen kann.
   * @param state derzeitiger GameState
   * @param c Karte die gespielt werden soll
   * @param n Parameter mit dem TAKE_OR_DROP_CARROTS überprüft wird
   * @return true, falls das Spielen der entsprechenden Karte möglich ist
   */
  public static isValidToPlayCard(state: GameState, c: Card, n: number): boolean {
    switch (c.cardType) {
      case Card.EAT_SALAD:
        return this.isValidToPlayEatSalad(state);
      case Card.FALL_BACK:
        return this.isValidToPlayFallBack(state);
      case Card.HURRY_AHEAD:
        return this.isValidToPlayHurryAhead(state);
      case Card.TAKE_OR_DROP_CARROTS:
        return this.isValidToPlayTakeOrDropCarrots(state, n);
      default:
        throw "Unknown CardType " + c.cardType;
    }
  }

  public static mustEatSalad(state: GameState): boolean {
    let player = state.getCurrentPlayer();
    // check whether player just moved to salad field and must eat salad
    let field = state.getTypeAt(player.index);
    if (field == Board.Fieldtype.salad) {
      if (player.lastNonSkipAction.type == "ADVANCE") {
        return true;
      } else if (player.lastNonSkipAction.type == "CARD") {
        if ((<Card>player.lastNonSkipAction).cardType == Card.FALL_BACK ||
          ((<Card>player.lastNonSkipAction).cardType == Card.HURRY_AHEAD)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Gibt zurück, ob der derzeitige Spieler eine Karte spielen kann.
   * @param state derzeitiger GameState
   * @return true, falls eine Karte gespielt werden kann
   */
  public static canPlayCard(state: GameState): boolean {
    let player = state.getCurrentPlayer();
    let canPlayCard = state.getTypeAt(player.index) == Board.Fieldtype.hare;
    for (let a of player.cards) {
      canPlayCard = canPlayCard || this.isValidToPlayCard(state, a, 0);
    }
    return canPlayCard;
  }

	/**
	 * Überprüft ob eine Karte gespielt werden muss. Sollte nach einem
	 * Zug eines Spielers immer false sein, ansonsten ist Zug ungültig.
	 * @param state derzeitiger GameState
	 */
  public static mustPlayCard(state: GameState): boolean {
    return state.getCurrentPlayer().mustPlayCard;
  }


	/**
	 * Überprüft ob ein der derzeitige Spieler das Ziel betreten darf
	 * @param state GameState
	 * @return Gibt zurück, ob ein Spieler das Ziel betreten darf
	 */
  public static canEnterGoal(state: GameState): boolean {
    let player = state.getCurrentPlayer();
    return player.carrots <= 10 && player.salads == 0;
  }


}
