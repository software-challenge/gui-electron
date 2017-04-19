define(["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * Represents the parsed data from an xml replay
     */
    class Replay {
        /**
         * Initializes the Replay from a URL and calls the callback once done
         */
        constructor(name, xml) {
            var now = performance.now();
            this.replayName = name;
            var stateQuery = xml.getElementsByTagName("state");
            this.states = [];
            for (var i = 0; i < stateQuery.length; i++) {
                var g = new GameState();
                g.turn = parseInt(stateQuery[i].getAttribute("turn"));
                g.startPlayer = stateQuery[i].getAttribute("startPlayer") == "RED" ? 0 /* RED */ : 1 /* BLUE */;
                g.currentPlayer = stateQuery[i].getAttribute("currentPlayer") == "RED" ? 0 /* RED */ : 1 /* BLUE */;
                g.freeTurn = stateQuery[i].getAttribute("freeTurn") == "true";
                g.red = new Player(stateQuery[i].getElementsByTagName("red")[0]);
                g.blue = new Player(stateQuery[i].getElementsByTagName("blue")[0]);
                g.board = new Board(stateQuery[i].getElementsByTagName("board")[0]);
                var moves = stateQuery[i].getElementsByTagName("lastMove")[0];
                if (moves) {
                    var tempmoves = [];
                    //Parse moves
                    for (var j = 0; j < moves.children.length; j++) {
                        let move = new Move(moves.children[j]);
                        tempmoves[move.order] = move;
                    }
                    //fill any gaps that might have occured
                    tempmoves.forEach(o => g.moves.push(o));
                }
                if (this.states.length > 0) {
                    g.addAnimationHints(this.states[this.states.length - 1]);
                }
                this.states.push(g);
            }
            this.states[0].animated = false;
            this.states[this.states.length - 1].last = true;
            this.score = new Score(xml.getElementsByTagName('result')[0]);
            console.log(this);
            console.log("parsing took " + (performance.now() - now) + "ms");
        }
    }
    exports.Replay = Replay;
    /**
     * Represents the result of a game
     */
    class Score {
        constructor(resultNode) {
            //Loop through score nodes, there might be multiple ones that don't all contain a reason attribute
            var scoreNodes = resultNode.getElementsByTagName('score');
            for (var i = 0; i < scoreNodes.length; i++) {
                if (scoreNodes[i].hasAttribute('cause')) {
                    this.cause = scoreNodes[i].getAttribute('cause');
                }
                if (scoreNodes[i].hasAttribute('reason')) {
                    this.winReason = scoreNodes[i].getAttribute('reason');
                    break;
                }
            }
            if (!this.winReason) {
                this.winReason = "";
            }
            this.winner = resultNode.getElementsByTagName('winner')[0].getAttribute('color') == 'RED' ? 0 /* RED */ : 1 /* BLUE */;
            this.winnerName = resultNode.getElementsByTagName('winner')[0].getAttribute('displayName');
            this.processedReason = this.winReason.replace('Ein Spieler', this.winnerName);
            if (this.processedReason == "") {
                this.processedReason = "Das Spiel wurde vorzeitig beendet. " + this.winnerName + " gewinnt nach Punktestand.";
            }
            if (this.cause == 'RULE_VIOLATION') {
                this.processedReason = 'Ungültiger Zug: ' + this.processedReason + "&#xa;" + this.winnerName + " gewinnt";
            }
        }
    }
    exports.Score = Score;
    class Field {
        constructor(type, x, y, points) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.points = points;
            this.id = (x * 10000) + y; //TODO: find a better way to generate GUIDs
        }
        static fromFieldNode(fieldNode) {
            let f = new Field(0 /* WATER */, 0, 0, 0);
            switch (fieldNode.getAttribute("type")) {
                case "WATER":
                    f.type = 0 /* WATER */;
                    break;
                case "LOG":
                    f.type = 1 /* LOG */;
                    break;
                case "BLOCKED":
                    f.type = 2 /* BLOCKED */;
                    break;
                case "PASSENGER0":
                    f.type = 3 /* PASSENGER0 */;
                    break;
                case "PASSENGER1":
                    f.type = 4 /* PASSENGER1 */;
                    break;
                case "PASSENGER2":
                    f.type = 5 /* PASSENGER2 */;
                    break;
                case "PASSENGER3":
                    f.type = 6 /* PASSENGER3 */;
                    break;
                case "PASSENGER4":
                    f.type = 7 /* PASSENGER4 */;
                    break;
                case "PASSENGER5":
                    f.type = 8 /* PASSENGER5 */;
                    break;
                case "PASSENGER6":
                    f.type = 9 /* PASSENGER6 */;
                    break;
                case "SANDBANK":
                    f.type = 10 /* SANDBANK */;
                    break;
                case "GOAL":
                    f.type = 11 /* GOAL */;
                    break;
                default: throw new RangeError("Fieldtype not parseable: " + fieldNode.getAttribute("type"));
            }
            f.x = parseInt(fieldNode.getAttribute("x"));
            f.y = parseInt(fieldNode.getAttribute("y"));
            f.id = (f.x * 10000) + f.y;
            f.points = parseInt(fieldNode.getAttribute("points"));
            return f;
        }
        toString() {
            return this.x.toString() + ";" + this.y.toString + "(" + this.points.toString() + "," + this.type.toString() + ")";
        }
    }
    exports.Field = Field;
    class Tile {
        constructor(tileNode) {
            this.fields = [];
            this.visible = tileNode.getAttribute("visible") == "true";
            this.index = parseInt(tileNode.getAttribute("index"));
            this.direction = parseInt(tileNode.getAttribute("direction"));
            let fields = tileNode.getElementsByTagName("field");
            this.center_x = 0;
            this.center_y = 0;
            for (var i = 0; i < fields.length; i++) {
                let f = Field.fromFieldNode(fields[i]);
                this.center_x += f.x;
                this.center_y += f.y;
                this.fields.push(f);
            }
            this.center_x /= fields.length;
            this.center_y /= fields.length;
        }
    }
    exports.Tile = Tile;
    class Board {
        constructor(boardNode) {
            //Descend into tiles-node, iterate for every tile
            let tiles = boardNode.getElementsByTagName("tile");
            this.tiles = [];
            this.tileIndices = [];
            for (var i = 0; i < tiles.length; i++) {
                this.tiles.push(new Tile(tiles[i]));
                this.tileIndices.push(this.tiles[this.tiles.length - 1].index);
            }
        }
        getTileByIndex(index) {
            return this.tiles.find(t => t.index == index);
        }
        static StringToDirection(d) {
            switch (d) {
                case "UP_LEFT": return 2 /* UP_LEFT */;
                case "UP_RIGHT": return 1 /* UP_RIGHT */;
                case "LEFT": return 3 /* LEFT */;
                case "DOWN_LEFT": return 4 /* DOWN_LEFT */;
                case "DOWN_RIGHT": return 5 /* DOWN_RIGHT */;
                case "RIGHT": return 0 /* RIGHT */;
                default: throw new RangeError("player direction was not parsable: " + d);
            }
        }
        static NumberToDirection(d) {
            switch (d) {
                case 0: return 0 /* RIGHT */;
                case 1: return 1 /* UP_RIGHT */;
                case 2: return 2 /* UP_LEFT */;
                case 3: return 3 /* LEFT */;
                case 4: return 4 /* DOWN_LEFT */;
                case 5: return 5 /* DOWN_RIGHT */;
            }
        }
        static DirectionToNumber(d) {
            switch (d) {
                case 0 /* RIGHT */: return 0;
                case 1 /* UP_RIGHT */: return 1;
                case 2 /* UP_LEFT */: return 2;
                case 3 /* LEFT */: return 3;
                case 4 /* DOWN_LEFT */: return 4;
                case 5 /* DOWN_RIGHT */: return 5;
            }
        }
        static DirectionToString(d) {
            switch (d) {
                case 0 /* RIGHT */: return "RIGHT";
                case 1 /* UP_RIGHT */: return "UP_RIGHT";
                case 2 /* UP_LEFT */: return "UP_LEFT";
                case 3 /* LEFT */: return "LEFT";
                case 4 /* DOWN_LEFT */: return "DOWN_LEFT";
                case 5 /* DOWN_RIGHT */: return "DOWN_RIGHT";
            }
        }
        static InvertDirection(d) {
            switch (d) {
                case 3 /* LEFT */: return 0 /* RIGHT */;
                case 4 /* DOWN_LEFT */: return 1 /* UP_RIGHT */;
                case 5 /* DOWN_RIGHT */: return 2 /* UP_LEFT */;
                case 0 /* RIGHT */: return 3 /* LEFT */;
                case 1 /* UP_RIGHT */: return 4 /* DOWN_LEFT */;
                case 2 /* UP_LEFT */: return 5 /* DOWN_RIGHT */;
            }
        }
        static RotateNumberDirectionBy(d, r) {
            return ((d + r + 6) % 6);
        }
        static calculateNewPosition(start, direction, steps) {
            var target = { x: start.x, y: start.y };
            var even = x => (x % 2) == 0;
            var odd = x => (x % 2) != 0;
            if (steps < 0) {
                steps = Math.abs(steps);
                direction = this.InvertDirection(direction);
            }
            while (steps > 0) {
                switch (direction) {
                    case 0 /* RIGHT */:
                        target.x++;
                        break;
                    case 2 /* UP_LEFT */:
                        if (odd(target.y)) {
                            target.x--;
                        }
                        target.y--;
                        break;
                    case 1 /* UP_RIGHT */:
                        if (even(target.y)) {
                            target.x++;
                        }
                        target.y--;
                        break;
                    case 3 /* LEFT */:
                        target.x--;
                        break;
                    case 5 /* DOWN_RIGHT */:
                        if (even(target.y)) {
                            target.x++;
                        }
                        target.y++;
                        break;
                    case 4 /* DOWN_LEFT */:
                        if (odd(target.y)) {
                            target.x--;
                        }
                        target.y++;
                        break;
                }
                steps--;
            }
            return target;
        }
    }
    exports.Board = Board;
    class Player {
        constructor(playerNode) {
            this.displayName = playerNode.getAttribute("displayName");
            this.color = playerNode.getAttribute("color") == "RED" ? 0 /* RED */ : 1 /* BLUE */;
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
    class Move {
        constructor(moveNode) {
            this.animationHints = {};
            this.order = parseInt(moveNode.getAttribute("order"));
            switch (moveNode.nodeName) {
                case "acceleration":
                    this.type = 0 /* ACCELERATION */;
                    this.attribute = parseInt(moveNode.getAttribute("acc"));
                    break;
                case "turn":
                    this.type = 1 /* TURN */;
                    this.attribute = parseInt(moveNode.getAttribute("direction"));
                    break;
                case "advance":
                case "step":
                    this.type = 2 /* STEP */;
                    this.attribute = parseInt(moveNode.getAttribute("distance"));
                    break;
                case "push":
                    this.type = 3 /* PUSH */;
                    this.attribute = Board.DirectionToNumber(Board.StringToDirection(moveNode.getAttribute("direction")));
                    break;
            }
            this.rawType = moveNode.nodeName;
            this.animationHints['animated'] = 0;
        }
    }
    exports.Move = Move;
    class GameState {
        constructor() {
            this.last = false;
            this.moves = [];
            this.animated = true;
        }
        addAnimationHints(previousState) {
            //1. Store old attributes, so we can add them as hints
            var player_attributes = {
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
            var activePlayer = (previousState.currentPlayer == 0 /* RED */) ? 'red' : 'blue';
            var otherPlayer = (previousState.currentPlayer == 0 /* RED */) ? 'blue' : 'red';
            for (var i = 0; i < this.moves.length; i++) {
                let move = this.moves[i];
                move.activePlayer = previousState.currentPlayer;
                switch (move.type) {
                    case 0 /* ACCELERATION */:
                        move.animationHints['startSpeed'] = player_attributes[activePlayer].speed;
                        player_attributes[activePlayer].speed += move.attribute; //Keep up with the speed
                        move.animationHints['targetSpeed'] = player_attributes[activePlayer].speed;
                        break;
                    case 1 /* TURN */:
                        move.animationHints['startDirection'] = player_attributes[activePlayer].direction;
                        player_attributes[activePlayer].direction = Board.RotateNumberDirectionBy(player_attributes[activePlayer].direction, move.attribute); //Keep up with the direction
                        move.animationHints['animated'] = 1;
                        move.animationHints['targetDirection'] = player_attributes[activePlayer].direction;
                        move.animationHints['rotationDirection'] = move.attribute > 0 ? 1 : 0; //If this is positive, we rotate clockwise, otherwise anticlockwise
                        break;
                    case 3 /* PUSH */:
                        move.animationHints['animated'] = 1;
                        move.animationHints['startOtherX'] = player_attributes[otherPlayer].x;
                        move.animationHints['startOtherY'] = player_attributes[otherPlayer].y;
                        var otherPlayerTargetPosition = Board.calculateNewPosition({ x: player_attributes[otherPlayer].x, y: player_attributes[otherPlayer].y }, Board.NumberToDirection(move.attribute), 1);
                        player_attributes[otherPlayer].x = otherPlayerTargetPosition.x;
                        player_attributes[otherPlayer].y = otherPlayerTargetPosition.y;
                        move.animationHints['targetOtherX'] = otherPlayerTargetPosition.x;
                        move.animationHints['targetOtherY'] = otherPlayerTargetPosition.y;
                        break;
                    case 2 /* STEP */:
                        move.animationHints['rotation'] = player_attributes[activePlayer].direction;
                        move.animationHints['animated'] = 1;
                        move.animationHints['startX'] = player_attributes[activePlayer].x;
                        move.animationHints['startY'] = player_attributes[activePlayer].y;
                        var activePlayerTargetPosition = Board.calculateNewPosition({ x: player_attributes[activePlayer].x, y: player_attributes[activePlayer].y }, Board.NumberToDirection(player_attributes[activePlayer].direction), move.attribute);
                        move.animationHints['targetX'] = activePlayerTargetPosition.x;
                        move.animationHints['targetY'] = activePlayerTargetPosition.y;
                        break;
                }
            }
        }
    }
    exports.GameState = GameState;
});
//# sourceMappingURL=Replay.js.map