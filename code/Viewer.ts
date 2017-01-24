///  <reference path="../node_modules/babylonjs/babylon.d.ts" />
import {Replay, FIELDTYPE, Tile, GameState, Field, Board} from "./Replay";
import {Helpers} from "./Helpers";

export class Viewer{
    replay: Replay;
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene:  BABYLON.Scene;
    camera: BABYLON.ArcRotateCamera;
    controlsElement: HTMLDivElement;
    controls: {'next': HTMLButtonElement, 'previous': HTMLButtonElement} = {'next': null, 'previous': null};

    currentMove: number = 0;

    debug: HTMLDivElement;

    constructor(replay: Replay, element: Element, document: Document, window: Window){
        //Save replay for later
        this.replay = replay;
        //Initialize engine
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('viewerCanvas');
        this.debug = document.createElement('div');
        this.debug.classList.add('debug');

        //Initialize controls
        this.controlsElement = document.createElement('div');
        this.controlsElement.classList.add("controls");
        this.controls.next = document.createElement('button');
        this.controls.next.innerText = "next";
        this.controls.next.addEventListener('click',()=>{
            if(this.currentMove < (this.replay.states.length -1)){
                this.currentMove ++;
            }
            this.render(this.replay.states[this.currentMove]);
        });
        this.controls.previous = document.createElement('button');
        this.controls.previous.innerText = "previous";
        this.controls.previous.addEventListener('click',()=>{
            if(this.currentMove > 0 ){
                this.currentMove --;
            }
            this.render(this.replay.states[this.currentMove]);
        });
        this.controlsElement.appendChild(this.controls.previous);
        this.controlsElement.appendChild(this.controls.next);

        element.appendChild(this.canvas);
        element.appendChild(this.debug);
        element.appendChild(this.controlsElement);
        this.engine = new BABYLON.Engine(this.canvas, true);
        //Initialize scene
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.ArcRotateCamera('camera1',Math.PI, Math.PI, 10,new BABYLON.Vector3(0,0,0),this.scene);
        this.camera.attachControl(this.canvas, false);
        this.camera.setPosition(new BABYLON.Vector3(3,3,15));
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0),this.scene);
        var ground = BABYLON.Mesh.CreateGround('ground1', 400,400,1,this.scene);
        var groundmaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene);

        var player1material = new BABYLON.StandardMaterial('player1material',this.scene);
        player1material.diffuseColor = new BABYLON.Color3(1,0,0);
        var player2material = new BABYLON.StandardMaterial('player2material',this.scene);
        player2material.diffuseColor = new BABYLON.Color3(0,0,1);
        var player1 = BABYLON.Mesh.CreateSphere("player1",15,2,this.scene,true,BABYLON.Mesh.DEFAULTSIDE);
        player1.material = player1material;
        player1.position.y = 3;
        var player2 = BABYLON.Mesh.CreateSphere("player2",15,2,this.scene,true,BABYLON.Mesh.DEFAULTSIDE);
        player2.material = player2material;
        player2.position.y = 3;

        groundmaterial.diffuseColor = new BABYLON.Color3(0.1,0.1,0.2);
        groundmaterial.specularColor = new BABYLON.Color3(1,1,1);
        ground.material = groundmaterial;
        FieldTypeMaterialFactory.init(this.scene);
        this.camera.beta  =  0;//0.72;
        this.camera.zoomOnFactor = 0;
        this.engine.runRenderLoop(() =>{
            this.scene.render();
            //this.camera.alpha += 0.003;
            //this.debug.innerText = "currentRound: " + this.currentMove + ", α: " + this.camera.alpha.toString() + ", β: " + this.camera.beta.toString() + ", (x,y,z): " + this.camera.position.x + "," + this.camera.position.y + "," + this.camera.position.z;
            if(this.scene.meshUnderPointer){
                this.debug.innerText = this.scene.meshUnderPointer.name;
            }
        });
        window.addEventListener('resize', () => {
            this.engine.resize();
        })
        this.render(replay.states[this.currentMove]);
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

    render(state: GameState){
        //Iterate over new tiles
        for(let t of state.board.tiles){
            for(let f of t.fields){
                if(! this.scene.getMeshByName(f.id.toString())){ //Create new meshes 
                    //console.log("(" + f.x + "," + f.y + ") = " +  f.type);
                    var mesh = BABYLON.Mesh.CreateCylinder(f.id.toString(),4,3,3,6,1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                    [mesh.position.x, mesh.position.z] = Grid.getCoordinates(f.x, f.y, 3/2);
                    mesh.position.z += (Math.random() * 0.1); //Vary height a bit
                    mesh.material = FieldTypeMaterialFactory.getMaterialForFieldType(f.type);
                }
                this.scene.getMeshByName(f.id.toString()).position.y = 0; //Raise all current meshes to the surface
            }
        }

        if(this.lastBoard != null){
            for(let lt of this.lastBoard.tileIndices){//Iterate over tiles of the last board
                if(state.board.tileIndices.indexOf(lt) == -1){//If they're not part of the current board
                    for(let f of this.lastBoard.getTileByIndex(lt).fields){
                        var tile  =this.scene.getMeshByName(f.id.toString());
                        BABYLON.Animation.CreateAndStartAnimation("sinktile"+lt,tile,"position.y",30,90,tile.position.y,-2.5,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    }
                }
            }
        }

        this.lastBoard = state.board;

        //Render players
        console.log("Red: " + state.red.x + "," + state.red.y);
        var [px,py] = Grid.getCoordinates(state.red.x,state.red.y,3/2);
        var player1 = this.scene.getMeshByName('player1');

        BABYLON.Animation.CreateAndStartAnimation("player1movex",player1,"position.x",30,30,player1.position.x,px,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation("player1movez",player1,"position.z",30,30,player1.position.z,py,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        

        //player1.position.x = px;
        //player1.position.z = py;

        console.log("Blue: " + state.blue.x + "," + state.blue.y);
        [px,py] = Grid.getCoordinates(state.blue.x,state.blue.y,3/2);
        var player2 = this.scene.getMeshByName('player2');
        //player2.position.x = px;
        //player2.position.z = py;
        BABYLON.Animation.CreateAndStartAnimation("player2movex",player2,"position.x",30,30,player2.position.x,px,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation("player2movez",player2,"position.z",30,30,player2.position.z,py,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

        //Adjust camera
        let [x,y] = this.getCenterOfBoard(state.board);
        //[x,y] = Grid.getCoordinates(x,y,3/2);
        console.log([x,y]);
        this.camera.setTarget(new BABYLON.Vector3(x,0,y));
        this.camera.beta = 0;
        this.camera.alpha = 4.5;
        this.camera.radius = 75;
    }
}

class Grid {
    public static getCoordinates(x: number, y:number, size:number){
        /*Next we want to put several hexagons together. 
        In the horizontal orientation, the height of a hexagon is height = size * 2. 
        The vertical distance between adjacent hexes is vert = height * 3/4.
        The width of a hexagon is width = sqrt(3)/2 * height. 
        The horizontal distance between adjacent hexes is horiz = width. */
        let spacer = 0.2;
        size += spacer;

        let height = size * 2;
        let vert = height * 3/4;
        let width = Math.sqrt(3)/2 * height;
        let horiz = width;
        let px = (x * horiz) + (width / 2 * (1 - Math.abs(y % 2)));
        console.log("x,y,y%2: " + x + "," + y + "," + Math.abs(y%2));
        let py = y * vert;
        /*
        let width = size * 2;


        let px = x * (width * 3/2) + (3/4 * width * (1- (y % 2)));
        let height = Math.sqrt(3) * width / 2;
        let py = y * height / 2;*/
        return [py, px];
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
                     //m.diffuseColor = new BABYLON.Color3(0.1,0.1,0.5);
                     //m.specularColor = new BABYLON.Color3(0.2,0.2,1);
                     m.diffuseTexture = new BABYLON.Texture("textures/water.jpg", this.scene);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.LOG:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: log");
                     //m.diffuseColor = new BABYLON.Color3(0.6,0.1,0.5);
                     //m.specularColor = new BABYLON.Color3(1,0.5,0.1);
                     m.diffuseTexture = new BABYLON.Texture("textures/wood.jpg", this.scene);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.BLOCKED:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: blocked");
                     m.diffuseColor = new BABYLON.Color3(1,0,0);
                     //m.specularColor = new BABYLON.Color3(1,0.5,0.4);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                 case FIELDTYPE.SANDBANK:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: sandbank");
                     //m.diffuseColor = new BABYLON.Color3(229/255,224/255,197/255);
                     //m.specularColor = new BABYLON.Color3(1,1,1);
                      m.diffuseTexture = new BABYLON.Texture("textures/sand.jpg", this.scene);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.GOAL:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: goal");
                    m.diffuseColor = new BABYLON.Color3(0,1,0);
                    m.specularColor = new BABYLON.Color3(0.5,1,0.5);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER0:
                case FIELDTYPE.PASSENGER1:
                case FIELDTYPE.PASSENGER2:
                case FIELDTYPE.PASSENGER3:
                case FIELDTYPE.PASSENGER4:
                case FIELDTYPE.PASSENGER5:
                case FIELDTYPE.PASSENGER6:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseColor = new BABYLON.Color3(0,1,0);
                    //m.specularColor = new BABYLON.Color3(0.2,1,0.2);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                

            }
            return FieldTypeMaterialFactory.fieldMap[f.toString()];
        }
    }
}