import {Helpers} from "./Helpers";
/**
 * Represents the parsed data from an xml replay
 */
export class Replay{
    public replayName: string;
    public states: GameState[];
    /**
     * Initializes the Replay from a URL and calls the callback once done
     */
    constructor(name: string, xml: XMLDocument){
        var now = performance.now();
        this.replayName = name;
        var stateQuery = xml.getElementsByTagName("state");
        this.states = [];
        for(var i = 0; i < stateQuery.length; i++){//Iterate through all state nodes
            var g: GameState = new GameState();
            g.turn = parseInt(stateQuery[i].getAttribute("turn"));
            g.startPlayer = stateQuery[i].getAttribute("startPlayer") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
            g.currentPlayer = stateQuery[i].getAttribute("currentPlayer") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
            g.freeTurn = stateQuery[i].getAttribute("freeTurn") == "true";
            g.red = new Player(stateQuery[i].getElementsByTagName("red")[0]);
            g.blue = new Player(stateQuery[i].getElementsByTagName("blue")[0]);
            g.board = new Board(stateQuery[i].getElementsByTagName("board")[0]);
            var moves = stateQuery[i].getElementsByTagName("lastMove")[0];
            if(moves){
                var tempmoves = [];
                //Parse moves
                console.log(moves.children.length);
                for(var j = 0; j < moves.children.length; j++){
                    let move = new Move(moves.children[j]);
                    tempmoves[move.order] = move;
                }
                //fill any gaps that might have occured
                tempmoves.forEach(o=>g.moves.push(o));
                /*forEach iterates only over items that exists.
                  So if, for example, we have an array that has elements at indices four and six, but nothing at five, it won't insert an undefined into our list.*/
            }
            if(this.states.length > 0){
                g.addAnimationHints(this.states[this.states.length -1]);
            }
            this.states.push(g);
        }
        this.states[0].animated = false;
        console.log(this);
        console.log("parsing took " + (performance.now()-now) + "ms");
    }
}

export const enum FIELDTYPE{
    WATER = 0,
    LOG,
    BLOCKED,
    PASSENGER0,
    PASSENGER1,
    PASSENGER2,
    PASSENGER3,
    PASSENGER4,
    PASSENGER5,
    PASSENGER6,
    SANDBANK,
    GOAL
}

export const enum DIRECTION{
    RIGHT = 0,
    UP_RIGHT,
    UP_LEFT,
    LEFT,
    DOWN_LEFT,
    DOWN_RIGHT
}

export const enum PLAYERCOLOR{
    RED = 0,
    BLUE
}

export class Field{
    public type: FIELDTYPE;
    public x: number;
    public y: number;
    public id: number;
    public points: number;
    constructor(type: FIELDTYPE, x: number, y: number, points: number){
        this.type = type;
        this.x = x;
        this.y = y;
        this.points = points;
        this.id = (x * 10000) +  y;//TODO: find a better way to generate GUIDs
    }

    public static fromFieldNode(fieldNode: Element):Field{
        let f = new Field(FIELDTYPE.WATER,0,0,0);
         switch(fieldNode.getAttribute("type")){
            case "WATER": f.type = FIELDTYPE.WATER; break;
            case "LOG": f.type = FIELDTYPE.LOG; break;
            case "BLOCKED": f.type = FIELDTYPE.BLOCKED; break;
            case "PASSENGER0": f.type = FIELDTYPE.PASSENGER0; break;
            case "PASSENGER1": f.type = FIELDTYPE.PASSENGER1; break;
            case "PASSENGER2": f.type = FIELDTYPE.PASSENGER2; break;
            case "PASSENGER3": f.type = FIELDTYPE.PASSENGER3; break;
            case "PASSENGER4": f.type = FIELDTYPE.PASSENGER4; break;
            case "PASSENGER5": f.type = FIELDTYPE.PASSENGER5; break;
            case "PASSENGER6": f.type = FIELDTYPE.PASSENGER6; break;
            case "SANDBANK": f.type = FIELDTYPE.SANDBANK; break;
            case "GOAL": f.type = FIELDTYPE.GOAL; break;
            default: throw new RangeError("Fieldtype not parseable: " + fieldNode.getAttribute("type"));
        }
        f.x = parseInt(fieldNode.getAttribute("x"));
        f.y = parseInt(fieldNode.getAttribute("y"));
        f.id = (f.x * 10000) + f.y;
        f.points = parseInt(fieldNode.getAttribute("points"));
        return f;
    }

    public toString():string{
        return this.x.toString() + ";" + this.y.toString + "(" + this.points.toString() + "," + this.type.toString() + ")";
    }

}

export class Tile{
    public fields: Field[] = [];
    public visible: boolean;
    public index: number;
    public direction: number;
    public center_x: number;
    public center_y: number;
    constructor(tileNode: Element){
        this.visible = tileNode.getAttribute("visible") == "true";
        this.index = parseInt(tileNode.getAttribute("index"));
        this.direction = parseInt(tileNode.getAttribute("direction"));
        let fields = tileNode.getElementsByTagName("field");
        this.center_x = 0; this.center_y = 0;
        for(var i = 0; i < fields.length; i++){
            let f: Field = Field.fromFieldNode(fields[i]);
            this.center_x += f.x;
            this.center_y += f.y;
            this.fields.push(f);
        }
        this.center_x /= fields.length;
        this.center_y /= fields.length;
    }

}

export class Board{
    public tiles: Tile[];
    public tileIndices: number[];
    constructor(boardNode: Element){
        //Descend into tiles-node, iterate for every tile
        let tiles = boardNode.getElementsByTagName("tile");
        this.tiles = [];
        this.tileIndices = [];
        for(var i = 0; i < tiles.length; i++){
            this.tiles.push(new Tile(tiles[i]));
            this.tileIndices.push(this.tiles[this.tiles.length - 1].index);
        }
    }

    public getTileByIndex(index: number){
        return this.tiles.find(t => t.index == index);
    }

    public static StringToDirection(d: string){
        switch(d){
            case "UP_LEFT": return DIRECTION.UP_LEFT; 
            case "UP_RIGHT": return DIRECTION.UP_RIGHT; 
            case "LEFT": return DIRECTION.LEFT; 
            case "DOWN_LEFT": return DIRECTION.DOWN_LEFT; 
            case "DOWN_RIGHT": return DIRECTION.UP_RIGHT; 
            case "RIGHT": return DIRECTION.RIGHT; 
            default: throw new RangeError("player direction was not parsable: " + d);
        }
    }

    public static NumberToDirection(d: number){
        switch(d){
            case 0: return DIRECTION.RIGHT;
            case 1: return DIRECTION.DOWN_RIGHT;
            case 2: return DIRECTION.DOWN_LEFT;
            case 3: return DIRECTION.LEFT;
            case 4: return DIRECTION.UP_LEFT;
            case 5: return DIRECTION.UP_RIGHT;
        }
    }

    public static DirectionToNumber(d: DIRECTION){
        switch(d){
            case DIRECTION.RIGHT: return 0;
            case DIRECTION.DOWN_RIGHT: return 1;
            case DIRECTION.DOWN_LEFT: return 2;
            case DIRECTION.LEFT: return 3;
            case DIRECTION.UP_LEFT: return 4;
            case DIRECTION.UP_RIGHT: return 5;
        }
    }

    public static RotateNumberDirectionBy(d: number, r: number){//Rotates a direction given as the number d by the amount r
        while(r != 0){
            if(r < 0){
                d --;
                if(d < 0){
                    d = 5;
                }
                r++;
            }else if(r > 0){
                d++;
                if(d > 5){
                    d = 0;
                }
                r--;
            }
        }
        return d;
    }

    public static calculateNewPosition(start: {x: number, y: number}, direction: DIRECTION, steps: number): {x: number, y:number}{
        var target = {x: start.x,y:start.y};
        while(steps > 0){
            switch(direction){
                case DIRECTION.RIGHT:
                    target.x++;
                break;
                case DIRECTION.DOWN_RIGHT:
                    target.y++;
                break;
                case DIRECTION.DOWN_LEFT:
                    target.x--;
                    target.y++;
                break;
                case DIRECTION.LEFT:
                    target.x--;
                break;
                case DIRECTION.UP_LEFT:
                    target.x--;
                    target.y--;
                break;
                case DIRECTION.UP_RIGHT:
                    target.y--;
                break;
            }
            steps --;
        }
        return target;
    }
}

class Player{
    public displayName: string;
    public color: PLAYERCOLOR;
    public points: number;
    public x: number;
    public y: number;
    public direction: DIRECTION;
    public speed: number;
    public coal: number;
    public tile: number;
    public passenger: number;
    constructor(playerNode: Element){
        this.displayName = playerNode.getAttribute("displayName");
        this.color = playerNode.getAttribute("color") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
        this.points = parseInt(playerNode.getAttribute("points"));
        this.x = parseInt(playerNode.getAttribute("x"));
        this.y = parseInt(playerNode.getAttribute("y"));
        this.direction = Board.StringToDirection(playerNode.getAttribute("direction"));
        this.speed = parseInt(playerNode.getAttribute("speed"));
        this.coal = parseInt(playerNode.getAttribute("coal"));
        this.tile = parseInt(playerNode.getAttribute("tile"));
        this.passenger = parseInt(playerNode.getAttribute("passenger"));
    }
}

export const enum MOVETYPE{
    ACCELERATION,
    TURN,
    STEP,
    PUSH
}

export class Move{
    public type: MOVETYPE;
    public order: number;
    public attribute: number;
    public rawType: string;
    public animationHints: {[name: string]: number} = {};

    constructor(moveNode: Element){
        this.order = parseInt(moveNode.getAttribute("order"));
        switch(moveNode.nodeName){
            case "acceleration":
                this.type = MOVETYPE.ACCELERATION;
                this.attribute = parseInt(moveNode.getAttribute("acc"));
            break;
            case "turn":
                this.type = MOVETYPE.TURN;
                this.attribute = parseInt(moveNode.getAttribute("direction"));
            break;
            case "advance":
            case "step":
                this.type = MOVETYPE.STEP;
                this.attribute = parseInt(moveNode.getAttribute("distance"));
            break;
            case "push":
                this.type = MOVETYPE.PUSH;
                this.attribute = Board.DirectionToNumber(Board.StringToDirection(moveNode.getAttribute("direction")));
            break;
        }
        this.rawType = moveNode.nodeName;
        this.animationHints['animated'] = 0;
    }
}

export class GameState{
    public red: Player;
    public blue: Player;
    public turn: number;
    public startPlayer: PLAYERCOLOR;
    public currentPlayer: PLAYERCOLOR;
    public freeTurn: boolean;
    public board: Board;
    public moves: Move[] = [];
    public animated: boolean = true;
    public addAnimationHints(previousState:GameState){//Calculates hints for the animation subsystem based on other information of this turn
        //1. Store old attributes, so we can add them as hints
        var player_attributes: {red: {x: number, y: number, direction: number, speed: number}, blue: {x: number, y: number, direction: number, speed: number}} = {
            red: {
                x: previousState.red.x,
                y: previousState.red.y,
                direction: previousState.red.direction,
                speed: previousState.red.speed
            },
            blue: {
                x: previousState.blue.x,
                y: previousState.blue.y,
                direction: previousState.blue.direction,
                speed: previousState.blue.speed
            }
        };
        //2. Iterate through moves and track values
        var activePlayer = (previousState.currentPlayer == PLAYERCOLOR.RED)? 'red' : 'blue';
        var otherPlayer = (previousState.currentPlayer == PLAYERCOLOR.RED)? 'blue' : 'red';
        for(var i = 0; i < this.moves.length; i++){
            let move = this.moves[i];
            switch(move.type){
                case MOVETYPE.ACCELERATION:
                    move.animationHints['startSpeed'] = player_attributes[activePlayer].speed;
                    player_attributes[activePlayer].speed += move.attribute;//Keep up with the speed
                    move.animationHints['targetSpeed'] = player_attributes[activePlayer].speed;
                break;
                case MOVETYPE.TURN:
                    move.animationHints['startDirection'] = player_attributes[activePlayer].direction;
                    player_attributes[activePlayer].direction = Board.RotateNumberDirectionBy(player_attributes[activePlayer].direction,move.attribute); //Keep up with the direction
                    move.animationHints['animated'] = 1;
                    move.animationHints['targetDirection'] = player_attributes[activePlayer].direction;
                    move.animationHints['rotationDirection'] = move.attribute > 0 ? 1 : 0;//If this is positive, we rotate clockwise, otherwise anticlockwise
                break;
                case MOVETYPE.PUSH: 
                    move.animationHints['animated'] = 1;
                    move.animationHints['startOtherX'] = player_attributes[otherPlayer].x;
                    move.animationHints['startOtherY'] = player_attributes[otherPlayer].y;
                    var otherPlayerTargetPosition = Board.calculateNewPosition({x: player_attributes[otherPlayer].x,y:player_attributes[otherPlayer].y}, Board.NumberToDirection(move.attribute),1);
                    player_attributes[otherPlayer].x = otherPlayerTargetPosition.x;
                    player_attributes[otherPlayer].y = otherPlayerTargetPosition.y;
                    move.animationHints['targetOtherX'] = otherPlayerTargetPosition.x;
                    move.animationHints['targetOtherY'] = otherPlayerTargetPosition.y;
                break;
                case MOVETYPE.STEP:
                    move.animationHints['rotation'] = player_attributes[activePlayer].direction;
                    move.animationHints['animated'] = 1;
                    move.animationHints['startX'] = player_attributes[activePlayer].x;
                    move.animationHints['startY'] = player_attributes[activePlayer].y;
                    var activePlayerTargetPosition = Board.calculateNewPosition({x: player_attributes[activePlayer].x,y:player_attributes[activePlayer].y},Board.NumberToDirection(player_attributes[activePlayer].direction),move.attribute);
                    move.animationHints['targetX'] = activePlayerTargetPosition.x;
                    move.animationHints['targetY'] = activePlayerTargetPosition.y;
                break;
            }
        }
    console.log(this.moves);
    }
}