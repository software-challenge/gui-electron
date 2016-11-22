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
        var stateQuery = xml.getElementsByTagName("STATE");
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

const enum FIELDTYPE{
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

const enum DIRECTION{
    RIGHT,
    UP_RIGHT,
    UP_LEFT,
    LEFT,
    DOWN_LEFT,
    DOWN_RIGHT
}

const enum PLAYERCOLOR{
    RED = 0,
    BLUE
}

class Field{
    public type: FIELDTYPE;
    public x: number;
    public y: number;
    public points: number;
    constructor(fieldNode: Element){
        switch(fieldNode.getAttribute("type")){
            case "WATER": this.type = FIELDTYPE.WATER; break;
            case "LOG": this.type = FIELDTYPE.LOG; break;
            case "BLOCKED": this.type = FIELDTYPE.BLOCKED; break;
            case "PASSENGER1": this.type = FIELDTYPE.PASSENGER1; break;
            case "PASSENGER2": this.type = FIELDTYPE.PASSENGER2; break;
            case "PASSENGER3": this.type = FIELDTYPE.PASSENGER3; break;
            case "PASSENGER4": this.type = FIELDTYPE.PASSENGER4; break;
            case "PASSENGER5": this.type = FIELDTYPE.PASSENGER5; break;
            case "PASSENGER6": this.type = FIELDTYPE.PASSENGER6; break;
            case "SANDBANK": this.type = FIELDTYPE.SANDBANK; break;
            case "GOAL": this.type = FIELDTYPE.GOAL; break;
            default: throw new RangeError("Fieldtype not parseable: " + fieldNode.getAttribute("type"));
        }
        this.x = parseInt(fieldNode.getAttribute("x"));
        this.y = parseInt(fieldNode.getAttribute("y"));
        this.points = parseInt(fieldNode.getAttribute("points"));
    }

}

class Tile{
    public fields: Field[][] = [];
    public visible: boolean;
    public index: number;
    public direction: number;
    constructor(tileNode: Element){
        this.visible = tileNode.getAttribute("visible") == "true";
        this.index = parseInt(tileNode.getAttribute("index"));
        this.direction = parseInt(tileNode.getAttribute("direction"));
        let fields = tileNode.getElementsByTagName("field");
        for(var i = 0; i < fields.length; i++){
            let f: Field = new Field(fields[i]);
            if(this.fields[f.x] === undefined){
                this.fields[f.x] = [];
            }
            this.fields[f.x][f.y] = f;
        }
    }
}

class Board{
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

class GameState{
    public red: Player;
    public blue: Player;
    public turn: number;
    public startPlayer: PLAYERCOLOR;
    public currentPlayer: PLAYERCOLOR;
    public freeTurn: boolean;
    public board: Board;
}