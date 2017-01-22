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
        this.replayName = name;
        var stateQuery = xml.getElementsByTagName("state");
        console.log(stateQuery);
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
            this.states.push(g);
        }
    }
}

export const enum FIELDTYPE{
    WATER = 0,
    LOG,
    BLOCKED,
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
    RIGHT,
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
    constructor(boardNode: Element){
        //Descend into tiles-node, iterate for every tile
        let tiles = boardNode.getElementsByTagName("tile");
        this.tiles = [];
        for(var i = 0; i < tiles.length; i++){
            this.tiles.push(new Tile(tiles[i]));
        }
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
        switch(playerNode.getAttribute("direction")){
            case "UP_LEFT": this.direction = DIRECTION.UP_LEFT; break;
            case "UP_RIGHT": this.direction = DIRECTION.UP_RIGHT; break;
            case "LEFT": this.direction = DIRECTION.LEFT; break;
            case "DOWN_LEFT": this.direction = DIRECTION.DOWN_LEFT; break;
            case "DOWN_RIGHT": this.direction = DIRECTION.UP_RIGHT; break;
            case "RIGHT": this.direction = DIRECTION.RIGHT; break;
            default: throw new RangeError("player direction was not parsable: " + playerNode.getAttribute("direction"));
        }
        this.speed = parseInt(playerNode.getAttribute("speed"));
        this.coal = parseInt(playerNode.getAttribute("coal"));
        this.tile = parseInt(playerNode.getAttribute("tile"));
        this.passenger = parseInt(playerNode.getAttribute("passenger"));
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
}