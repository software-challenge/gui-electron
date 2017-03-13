///  <reference path="../node_modules/babylonjs/babylon.d.ts" />
import {Replay, FIELDTYPE, Tile, GameState, Field, Board, DIRECTION, MOVETYPE, Move, PLAYERCOLOR} from "./Replay";
import {Helpers} from "./Helpers";

export class Viewer{
    static ANIMATION_FRAMES: number = 30;
    static GRID_SIZE: number = 3/2;
    replay: Replay;
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene:  BABYLON.Scene;
    camera: BABYLON.ArcRotateCamera;
    controlsElement: HTMLDivElement;
    controls: {'next': HTMLButtonElement, 'previous': HTMLButtonElement, 'play': HTMLButtonElement, 'first': HTMLButtonElement, 'last': HTMLButtonElement, 'playing':boolean} = {'next': null, 'previous': null, 'play': null,'first':null,'last':null, 'playing':false};

    currentMove: number = 0;

    debug: HTMLDivElement;
    displayElement: HTMLDivElement;
    display: {'redPoints': HTMLDivElement, 'round': HTMLDivElement, 'bluePoints': HTMLDivElement} = {'redPoints': null,'round':null,'bluePoints':null};

    constructor(replay: Replay, element: Element, document: Document, window: Window){
        var now = performance.now();
        //Save replay for later
        this.replay = replay;
        //Initialize engine
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('viewerCanvas');
        this.debug = document.createElement('div');
        this.debug.classList.add('replay-debug');

        //Initialize controls
        this.controlsElement = document.createElement('div');
        this.controlsElement.classList.add("replay-controls");
        this.controls.next = document.createElement('button');
        this.controls.next.innerText = "⏩";
        this.controls.next.addEventListener('click',()=>{
            if(this.currentMove < (this.replay.states.length -1)){
                this.currentMove ++;
            }
            this.render(this.replay.states[this.currentMove], false);
        });
        this.controls.previous = document.createElement('button');
        this.controls.previous.innerText = "⏪";
        this.controls.previous.addEventListener('click',()=>{
            if(this.currentMove > 0 ){
                this.currentMove --;
            }
            this.render(this.replay.states[this.currentMove], false);
        });
        this.controls.play = document.createElement('button');
        this.controls.play.innerText = "►";
        this.controls.play.addEventListener('click',()=>{
            if(this.currentMove < (this.replay.states.length -1)){
                this.currentMove ++;
            }
            this.render(this.replay.states[this.currentMove], true);
        });
        this.controls.first = document.createElement('button');
        this.controls.first.innerText = "⏮";
        this.controls.first.addEventListener('click',()=>{
            this.currentMove = 0;
            this.render(this.replay.states[this.currentMove], false);
        });
        this.controls.last = document.createElement('button');
        this.controls.last.innerText = "⏭";
        this.controls.last.addEventListener('click',()=>{
            this.currentMove = this.replay.states.length - 1;
            this.render(this.replay.states[this.currentMove], false);
        });
        this.controlsElement.appendChild(this.controls.first);
        this.controlsElement.appendChild(this.controls.previous);
        this.controlsElement.appendChild(this.controls.play);
        this.controlsElement.appendChild(this.controls.next);
        this.controlsElement.appendChild(this.controls.last);

        this.displayElement = document.createElement('div');
        this.displayElement.classList.add('replay-display');
        this.display.redPoints = document.createElement('div');
        this.display.redPoints.classList.add('replay-redPoints');
        this.display.round = document.createElement('div');
        this.display.round.classList.add('replay-round');
        this.display.bluePoints = document.createElement('div');
        this.display.bluePoints.classList.add('replay-bluePoints');
        this.displayElement.appendChild(this.display.redPoints);
        this.displayElement.appendChild(this.display.round);
        this.displayElement.appendChild(this.display.bluePoints);

        element.appendChild(this.canvas);
        element.appendChild(this.debug);
        element.appendChild(this.controlsElement);
        var displayContainer = document.createElement('div');
        displayContainer.classList.add('replay-displayContainer');
        displayContainer.appendChild(this.displayElement);
        element.appendChild(displayContainer);

        this.engine = new BABYLON.Engine(this.canvas, true);
        //Initialize scene
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.ArcRotateCamera('camera1',Math.PI, Math.PI, 10,new BABYLON.Vector3(0,0,0),this.scene);
        this.camera.attachControl(this.canvas, false);
        this.camera.setPosition(new BABYLON.Vector3(3,3,15));
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,100,0),this.scene);
        //var light = new BABYLON.DirectionalLight('sun',new BABYLON.Vector3(0,-1,0),this.scene);
        light.specular = new BABYLON.Color3(0.2,0.2,0.2);
        var ground = BABYLON.Mesh.CreateGround('ground1', 1000,1000,0,this.scene);
        var groundmaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene);
        groundmaterial.diffuseColor = new BABYLON.Color3(116/255,184/255,254/255);
        ground.material = groundmaterial;
        /*
        var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, this.scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
        skybox.infiniteDistance = true;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/skybox", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skybox.position.y = 450;
        skybox.renderingGroupId = 0;
        */
        //Meshes: http://graphics.cs.williams.edu/data/meshes.xml#2

        var player1material = new BABYLON.StandardMaterial('player1material',this.scene);
        player1material.diffuseColor = new BABYLON.Color3(1,0,0);
        var player2material = new BABYLON.StandardMaterial('player2material',this.scene);
        player2material.diffuseColor = new BABYLON.Color3(0,0,1);

        var shape = [
            new BABYLON.Vector3(1,0.5,0),
            new BABYLON.Vector3(0,1,0),
            new BABYLON.Vector3(-1,0.5,0),
            new BABYLON.Vector3(-1,-1,0),
            new BABYLON.Vector3(1,-1,0),
            new BABYLON.Vector3(1,0.5,0)
        ];

        var path = [
            BABYLON.Vector3.Zero(),
            new BABYLON.Vector3(1,0,0)
        ];

        var player1 = BABYLON.Mesh.ExtrudeShape("player1",shape,path,1,0,BABYLON.Mesh.CAP_ALL,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
        player1.rotation.y = Math.PI / 2;
        player1.rotation.z = Math.PI / 2;

        //var player1 = BABYLON.Mesh.CreateSphere("player1",15,2,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
        player1.material = player1material;
        player1.position.y = 1;
        //var player2 = BABYLON.Mesh.CreateSphere("player2",15,2,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
        var player2 = BABYLON.Mesh.ExtrudeShape("player2",shape,path,1,0,BABYLON.Mesh.CAP_ALL,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
        player2.material = player2material;
        player2.position.y = 1;
        player2.rotation.y = Math.PI / 2;
        player2.rotation.z = Math.PI / 2;

        /*groundmaterial.diffuseColor = new BABYLON.Color3(0.1,0.1,0.2);
        groundmaterial.specularColor = new BABYLON.Color3(1,1,1);
        ground.material = groundmaterial;*/
        FieldTypeMaterialFactory.init(this.scene);
        this.camera.beta = 0.7;
        this.camera.alpha = 0;
        this.camera.radius = 75;
        //this.camera.zoomOnFactor = 0;
        this.engine.runRenderLoop(() =>{
            this.scene.render();
            //this.camera.alpha += 0.003;
            this.debug.innerText = "currentRound: " + this.currentMove + ", α: " + this.camera.alpha.toString() + ", β: " + this.camera.beta.toString() + ", (x,y,z): " + this.camera.position.x + "," + this.camera.position.y + "," + this.camera.position.z;
            if(this.scene.meshUnderPointer){
                this.debug.innerText = this.scene.meshUnderPointer.name;
            }
        });
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        window.addEventListener("click",  () => {
            var pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
            if(pickResult.hit){
                console.log(pickResult.pickedMesh.id);
            }
        });

        console.log("initializing viewer took " + (performance.now() - now) + "ms");
        this.render(replay.states[this.currentMove], false);
    }

    getCenterOfBoard(board: Board):[number,number]{
        let x: number, y: number;
        x = 0; y = 0;
        let tiles: number;
        let n: number = 0;
        for(let t of board.tiles){
            if(t.visible){
                x += t.center_x;
                y += t.center_y;
                n ++;
            }
        }
        x = x/n;
        y = y/n;
        return [x,y];
    }

    private lastBoard: Board;


    render(state: GameState, animated: boolean){
        this.display.round.innerText = state.turn < 10 ? '0' +  state.turn.toString() : state.turn.toString();
        this.display.redPoints.innerText = state.red.points.toString();
        this.display.bluePoints.innerText = state.blue.points.toString();

        var getTileName = (t:Field) => "Tile(" + t.x + "," + t.y + ")";

        //Iterate over new tiles
        for(let t of state.board.tiles){
            for(let f of t.fields){
                if(! this.scene.getMeshByName(getTileName(f))){ //Create new meshes 
                    //console.log("(" + f.x + "," + f.y + ") = " +  f.type);
                    var mesh = BABYLON.Mesh.CreateCylinder(getTileName(f),1,3,3,6,1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                    [mesh.position.x, mesh.position.z] = Grid.getCoordinates(f.x, f.y, 3/2);
                    mesh.position.z += (Math.random() * 0.1); //Vary height a bit
                    mesh.material = FieldTypeMaterialFactory.getMaterialForFieldType(f.type);
                }
                this.scene.getMeshByName(getTileName(f)).position.y = 0; //Raise all current meshes to the surface
            }
        }

        var i = 0;

        if(this.lastBoard != null){
            for(let lt of this.lastBoard.tileIndices){//Iterate over tiles of the last board
                if(state.board.tileIndices.indexOf(lt) == -1){//If they're not part of the current board
                    for(let f of this.lastBoard.getTileByIndex(lt).fields){
                        var tile  =this.scene.getMeshByName(getTileName(f));
                        //BABYLON.Animation.CreateAndStartAnimation("sinktile"+lt,tile,"position.y",30,60,tile.position.y,-3.5,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    }
                }
            }
        }

        this.lastBoard = state.board;

        //Render players
        /*
        console.log("Red: " + state.red.x + "," + state.red.y);
        var [px,py] = Grid.getCoordinates(state.red.x,state.red.y,3/2);
        var player1 = this.scene.getMeshByName('player1');

        BABYLON.Animation.CreateAndStartAnimation("player1movex",player1,"position.x",30,30,player1.position.x,px,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation("player1movez",player1,"position.z",30,30,player1.position.z,py,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation("player1rotatez",player1,"rotation.y",30,30,player1.rotation.y,Grid.getRotation(state.red.direction),BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        console.log("red: " + Grid.rotationToString(state.red.direction));
        //player1.position.x = px;
        //player1.position.z = py;

        console.log("Blue: " + state.blue.x + "," + state.blue.y);
        [px,py] = Grid.getCoordinates(state.blue.x,state.blue.y,3/2);
        var player2 = this.scene.getMeshByName('player2');
        //player2.position.x = px;
        //player2.position.z = py;
        BABYLON.Animation.CreateAndStartAnimation("player2movex",player2,"position.x",30,30,player2.position.x,px,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation("player2movez",player2,"position.z",30,30,player2.position.z,py,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation("player2rotatez",player2,"rotation.y",30,30,player2.rotation.y,Grid.getRotation(state.blue.direction),BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        console.log("blue: " + Grid.rotationToString(state.blue.direction));
        */

        //Do not animate if zero-turn
        if(!state.animated || (!animated)){
            console.log("Red: " + state.red.x + "," + state.red.y);
            var [px,py] = Grid.getCoordinates(state.red.x,state.red.y,3/2);
            var player1 = this.scene.getMeshByName('player1');
            player1.position.x = px;
            player1.position.z = py;
            player1.rotation.y = Grid.getRotation(state.red.direction);
            console.log("Red direction:" + Board.DirectionToString(state.red.direction));

            console.log("Blue: " + state.blue.x + "," + state.blue.y);
            [px,py] = Grid.getCoordinates(state.blue.x,state.blue.y,3/2);
            var player2 = this.scene.getMeshByName('player2');
            player2.position.x = px;
            player2.position.z = py;
            player2.rotation.y = Grid.getRotation(state.blue.direction);
            console.log("Blue direction:" + Board.DirectionToString(state.blue.direction));
        }else{
        //Create new animations
        
        var frame = 0;
        //Remember, the following is actually relative to the turn before this one, so the players are switched 🙈
        if(state.currentPlayer == PLAYERCOLOR.BLUE){
            console.log("Active player should be blue");
        }

        for(var i = 0; i < state.moves.length; i++){
            let move = state.moves[i];
            var activePlayer = move.activePlayer == PLAYERCOLOR.RED ? this.scene.getMeshByName('player1') : this.scene.getMeshByName('player2');
            var otherPlayer = move.activePlayer == PLAYERCOLOR.RED ? this.scene.getMeshByName('player2') : this.scene.getMeshByName('player1');
            if(i == 0){
                console.log("[animation] SELECT activePlayer = " + activePlayer.id + " @" + frame);
                console.log("[animation] SELECT otherPlayer = " + otherPlayer.id + " @" + frame);
                activePlayer.animations = [];
                otherPlayer.animations = [];
            }
            switch(move.type){
                case MOVETYPE.STEP:
                    var anim = new BABYLON.Animation("activePlayerX","position.x",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    var anim2 = new BABYLON.Animation("activePlayerZ","position.z",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    var keys = [];
                    var keys2 = [];
                    var coords = Grid.getCoordinates(move.animationHints['startX'],move.animationHints['startY'],Viewer.GRID_SIZE);
                    keys.push({
                        'frame': frame,
                        'value': coords[0]
                    });
                    keys2.push({
                        'frame': frame,
                        'value': coords[1]
                    });
                    frame += Viewer.ANIMATION_FRAMES;
                    coords = Grid.getCoordinates(move.animationHints['targetX'],move.animationHints['targetY'],Viewer.GRID_SIZE);
                    keys.push({
                        'frame': frame,
                        'value': coords[0]
                    });
                    keys2.push({
                        'frame': frame,
                        'value': coords[1]
                    });
                    anim.setKeys(keys);
                    anim2.setKeys(keys2);
                    activePlayer.animations.push(anim);
                    activePlayer.animations.push(anim2);
                    console.log("[animation] STEP activePlayer from " + move.animationHints['startX'] + "," + move.animationHints['startY'] + " to " + move.animationHints['targetX'] + "," + move.animationHints['targetY']+ " @" + frame);
                break;
                case MOVETYPE.TURN:
                    var anim = new BABYLON.Animation("activePlayerRotation","rotation.y",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    var keys = [];
                    keys.push({
                        'frame': frame,
                        'value': Grid.getRotation(move.animationHints['startDirection'])
                    });
                    frame += Viewer.ANIMATION_FRAMES;
                    keys.push({
                        'frame': frame,
                        'value': Grid.getRotation(move.animationHints['targetDirection'])
                    });
                    anim.setKeys(keys);
                    activePlayer.animations.push(anim);
                    console.log("[animation] TURN activePlayer from " + Board.DirectionToString(move.animationHints['startDirection']) + " to " + Board.DirectionToString(move.animationHints['targetDirection'])+ " @" + frame);
                break; 
                case MOVETYPE.PUSH:
                    var anim = new BABYLON.Animation("otherPlayerX","position.x",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    var anim2 = new BABYLON.Animation("otherPlayerZ","position.z",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    var keys = [];
                    var keys2 = [];
                    var coords = Grid.getCoordinates(move.animationHints['startOtherX'],move.animationHints['startOtherY'],Viewer.GRID_SIZE);
                    keys.push({
                        'frame': frame,
                        'value': coords[0]
                    });
                    keys2.push({
                        'frame': frame,
                        'value': coords[1]
                    });
                    frame += Viewer.ANIMATION_FRAMES;
                    coords = Grid.getCoordinates(move.animationHints['targetOtherX'],move.animationHints['targetOtherY'],Viewer.GRID_SIZE);
                    keys.push({
                        'frame': frame,
                        'value': coords[0]
                    });
                    keys2.push({
                        'frame': frame,
                        'value': coords[1]
                    });
                    anim.setKeys(keys);
                    anim2.setKeys(keys2);
                    otherPlayer.animations.push(anim);
                    otherPlayer.animations.push(anim2);
                    console.log("[animation] PUSH otherPlayer to " + move.animationHints['targetOtherX'] + "," + move.animationHints['targetOtherY']+ " @" + frame);
                break;
            }
        }
        this.scene.beginAnimation(activePlayer,0,frame,false);
        this.scene.beginAnimation(otherPlayer,0,frame,false);

        }

        //Adjust camera
        let [x,y] = this.getCenterOfBoard(state.board);
        [x,y] = Grid.getCoordinates(x,y,3/2);
        console.log([x,y]);

        this.camera.setTarget(new BABYLON.Vector3(x,0,y));
        //this.camera.beta = 0.7;
        //this.camera.alpha = 0;
        //this.camera.radius = 75;

        console.log("coal: " + state.red.coal);
    }
}

class Grid {
    public static getCoordinates(x: number, y:number, size:number){
        /*Next we want to put several hexagons together. 
        In the horizontal orientation, the height of a hexagon is height = size * 2. 
        The vertical distance between adjacent hexes is vert = height * 3/4.
        The width of a hexagon is width = sqrt(3)/2 * height. 
        The horizontal distance between adjacent hexes is horiz = width. */
        let spacer = 0.05;
        size += spacer;

        let height = size * 2;
        let vert = height * 3/4;
        let width = Math.sqrt(3)/2 * height;
        let horiz = width;
        let px = (x * horiz) + (width / 2 * (1 - Math.abs(y % 2)));
        let py = y * vert;
        /*
        let width = size * 2;


        let px = x * (width * 3/2) + (3/4 * width * (1- (y % 2)));
        let height = Math.sqrt(3) * width / 2;
        let py = y * height / 2;*/
        return [py, px];
    }

    public static getRotation(rot: DIRECTION){
        switch(rot){
            case DIRECTION.RIGHT:
                return Math.PI / 2;
            case DIRECTION.LEFT:
                return -Math.PI / 2;
            case DIRECTION.DOWN_RIGHT:
                return Math.PI * 5/6;
            case DIRECTION.DOWN_LEFT:
                return Math.PI * 7/6;
            case DIRECTION.UP_RIGHT:
                return Math.PI * 1/6;
            case DIRECTION.UP_LEFT:
                return -Math.PI * 1/6;
        }
    }

    public static rotationToString(rot: DIRECTION){
        switch(rot){
            case DIRECTION.RIGHT:
                return "DIRECTION.RIGHT";
            case DIRECTION.LEFT:
                return "DIRECTION.LEFT";
            case DIRECTION.UP_RIGHT:
                return "DIRECTION.UP_RIGHT" ;
            case DIRECTION.UP_LEFT:
                return "DIRECTION.UP_LEFT" ;
            case DIRECTION.DOWN_RIGHT:
                return "DIRECTION.DOWN_RIGHT";
            case DIRECTION.DOWN_LEFT:
                return "DIRECTION.DOWN_LEFT";
        }
    }
}

/*
    This is very preliminary, it's probably better to create Textured Materials while loading the replay
*/
class FieldTypeMaterialFactory{
    private static scene: BABYLON.Scene;
    private static fieldMap: {[type: string]: BABYLON.Material} = {};

    public static init(scene: BABYLON.Scene){
        this.scene = scene;
    }

    public static getMaterialForFieldType(f: FIELDTYPE):BABYLON.Material{
        if(FieldTypeMaterialFactory.fieldMap[f.toString()]){
            return FieldTypeMaterialFactory.fieldMap[f.toString()];
        }else{
            switch(f){
                case FIELDTYPE.WATER:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: water");
                     m.diffuseColor = new BABYLON.Color3(1,1,1);
                     //m.specularColor = new BABYLON.Color3(0.2,0.2,1);
                     m.diffuseTexture = new BABYLON.Texture("textures/water.png", this.scene);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.LOG:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: log");
                     //m.diffuseColor = new BABYLON.Color3(0.6,0.1,0.5);
                     //m.specularColor = new BABYLON.Color3(1,0.5,0.1);
                     m.diffuseTexture = new BABYLON.Texture("textures/logs.png", this.scene);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.BLOCKED:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: blocked");
                     m.diffuseTexture = new BABYLON.Texture("textures/island.png", this.scene);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                 case FIELDTYPE.SANDBANK:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: sandbank");
                     //m.diffuseColor = new BABYLON.Color3(0,0,1);
                     //m.specularColor = new BABYLON.Color3(1,1,1);
                      m.diffuseTexture = new BABYLON.Texture("textures/sandbank.png", this.scene);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.GOAL:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: goal");
                    m.diffuseTexture = new BABYLON.Texture("textures/goal.png", this.scene);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER0:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture("textures/passenger.png", this.scene);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER1:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture("textures/passenger1.png", this.scene);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER2:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture("textures/passenger2.png", this.scene);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER3:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture("textures/passenger3.png", this.scene);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER4:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture("textures/passenger4.png", this.scene);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER5:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture("textures/passenger5.png", this.scene);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER6:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture("textures/passenger6.png", this.scene);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                

            }
            return FieldTypeMaterialFactory.fieldMap[f.toString()];
        }
    }
}