///  <reference path="../babylonjs/babylon.2.5.d.ts" />
///  <reference path="../babylonjs/babylon.2.5.canvas2d.d.ts" />
///  <reference path="../babylonjs/materialsLibrary/babylon.skyMaterial.d.ts" />
///  <reference path="../babylonjs/materialsLibrary/babylon.waterMaterial.d.ts" />
import {Replay, FIELDTYPE, Tile, GameState, Field, Board, DIRECTION, MOVETYPE, Move, PLAYERCOLOR} from "./Replay";
import {Helpers} from "./Helpers";

export class Viewer{
//    static PATH_PREFIX: string = "/replay_viewers/mississippi_queen/";
    static PATH_PREFIX: string = "";
    static ASSET_PATH: string = Viewer.PATH_PREFIX + "assets";
    static TEXTURE_PATH: string = Viewer.PATH_PREFIX + "textures";
    static ANIMATION_FRAMES: number = 30;
    static GRID_SIZE: number = 3/2;
    replay: Replay;
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene:  BABYLON.Scene;
    shadow: BABYLON.ShadowGenerator;
    camera: BABYLON.ArcRotateCamera;
    fieldtypematerialfactory: FieldTypeMaterialFactory;
    controlsElement: HTMLDivElement;
    needsRerender: number;
    player1: BABYLON.Mesh;
    player2: BABYLON.Mesh;
    controls: {'next': HTMLButtonElement, 'previous': HTMLButtonElement, 'play': HTMLButtonElement, 'first': HTMLButtonElement, 'last': HTMLButtonElement, 'playing':boolean, 'playCallback': ()=>void} = {'next': null, 'previous': null, 'play': null,'first':null,'last':null, 'playing':false, playCallback: null};

    currentMove: number = 0;

    debug: HTMLDivElement;
    displayElement: HTMLDivElement;
    display: {
        'redPoints': HTMLDivElement,
        'round': HTMLDivElement,
        'bluePoints': HTMLDivElement,
        'progress': HTMLDivElement,
        'redName': HTMLDivElement,
        'blueName': HTMLDivElement,
        player1Text: BABYLON.Text2D,
        player2Text: BABYLON.Text2D,
        endScreen: HTMLDivElement,
        winPicture: HTMLImageElement,
        winnerName: HTMLSpanElement,
        winReason: HTMLSpanElement
    } = {
        'redPoints': null,
        'round':null,
        'bluePoints':null,
        'redName': null,
        'blueName': null,
        player1Text: null,
        player2Text: null,
        'progress': null,
        endScreen: null,
        winPicture: null,
        winnerName: null,
        winReason: null
    };


    constructor(replay: Replay, element: Element, document: Document, window: Window){
        this.needsRerender = 0;
        var now = performance.now();
        //Save replay for later
        this.replay = replay;
        //Initialize engine
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('viewerCanvas');
        this.debug = document.createElement('div');
        this.debug.classList.add('replay-debug');

        //Initialize rendercontrol
        element.addEventListener('mousemove',() => {
            if(this.needsRerender <= 30){
                this.needsRerender += 30;
            }
        });

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
        this.controls.playCallback = () =>{
            if(this.controls.playing){
                if(this.currentMove < (this.replay.states.length -1)){
                    this.currentMove ++;
                }else{
                    this.controls.play.click();
                }
                this.render(this.replay.states[this.currentMove], true);
                //setTimeout(this.controls.playCallback,((Viewer.ANIMATION_FRAMES / 60) * 1000) * 2);
            }
        }
        this.controls.play.addEventListener('click',()=>{
            if(!this.controls.playing){//Not playing, start playing
                this.controls.play.innerText = "▮▮";
                this.controls.playing = true;
                this.controls.playCallback();
            }
            else{//Playing, stop playing
                this.controls.play.innerText = "►";
                this.controls.playing = false;
            }

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
        var progressbar = document.createElement('div');
        progressbar.classList.add('replay-progressbar');
        this.display.progress = document.createElement('div');
        this.display.progress.classList.add('replay-progress');
        progressbar.appendChild(this.display.progress);

        this.display.redName = document.createElement('div');
        this.display.redName.innerText = replay.states[0].red.displayName;
        this.display.redName.classList.add('replay-redName');
        this.display.blueName = document.createElement('div');
        this.display.blueName.innerText = replay.states[0].blue.displayName;
        this.display.blueName.classList.add('replay-blueName');
        this.display.endScreen = document.createElement('div');
        this.display.endScreen.classList.add('replay-endScreen');
        this.display.winnerName = document.createElement('span');
        this.display.winnerName.innerText = replay.score.winnerName;
        this.display.winPicture = document.createElement('img');
        this.display.winPicture.src = Viewer.ASSET_PATH + "/win/pokal.svg";
        this.display.winPicture.classList.add('replay-winPicture');
        this.display.winReason = document.createElement('span');
        var winnerColorClass = replay.score.winner == PLAYERCOLOR.RED ? 'replay-winRed' : 'replay-winBlue';
        var htmlScore = replay.score.processedReason.replace(replay.score.winnerName, '<span class="' + winnerColorClass + '">' + replay.score.winnerName + '</span>');
        htmlScore = htmlScore.replace('&#xa;','<br>'); //Fix linefeeds
        this.display.winReason.innerHTML = htmlScore;
        this.display.winReason.classList.add('replay-winReason');
        this.display.endScreen.appendChild(this.display.winPicture);
        //this.display.endScreen.appendChild(this.display.winnerName);
        this.display.endScreen.appendChild(document.createElement('br'));
        this.display.endScreen.appendChild(this.display.winReason);


        this.displayElement.appendChild(this.display.redPoints);
        this.displayElement.appendChild(this.display.round);
        this.displayElement.appendChild(this.display.bluePoints);
        this.displayElement.appendChild(this.display.redName);
        this.displayElement.appendChild(this.display.blueName);
        element.appendChild(this.canvas);
        element.appendChild(this.debug);
        element.appendChild(this.controlsElement);
        element.appendChild(progressbar);
        element.appendChild(this.display.endScreen);
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
        //var postProcess = new BABYLON.FxaaPostProcess("fxaa", 2.0,this.camera, null, this.engine, true);

        var luminance = Math.abs(Math.sin( (new Date().getHours() / 24 * Math.PI) + Math.PI ));
        luminance = 0.2;
        console.log("luminance: " + luminance);

        var skyMaterial = new BABYLON.SkyMaterial("skyMaterial", this.scene);
        skyMaterial.backFaceCulling = false;
        skyMaterial.turbidity = 10;
        skyMaterial.luminance = (1.179 - (1.179 * luminance)) + 0.1;
        skyMaterial.rayleigh = luminance * 2;
        skyMaterial.useSunPosition = true;
        var sunPosition = new BABYLON.Vector3(0,0,0);
        sunPosition.y = 1000 * luminance;
        sunPosition.x = -1500 + (1000 * luminance);
        skyMaterial.sunPosition = sunPosition;
        //skyMaterial.inclination = 0.15
        //skyMaterial.inclination = 1; // The solar inclination, related to the solar azimuth in interval [0, 1]
        //skyMaterial.azimuth = 1; // The solar azimuth in interval [0, 1]


        //skyMaterial.azimuth = 0.5;
        //skyMaterial.inclination = 0.5;
        console.log([skyMaterial.azimuth,skyMaterial.inclination]);
        var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000, this.scene);
        skybox.material = skyMaterial;

        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,100,0),this.scene);
        //var light = new BABYLON.DirectionalLight('sun',new BABYLON.Vector3(0,-1,0),this.scene);
        light.specular = new BABYLON.Color3(0.7,0.7,0.7);
        light.diffuse = new BABYLON.Color3(0.7,0.7,0.7);
        var radius = 1, inclination = skyMaterial.luminance * Math.PI, azimuth = skyMaterial.azimuth * Math.PI * 2;
        var x = radius * Math.sin(inclination) * Math.cos(azimuth), y = radius * Math.sin(inclination) * Math.sin(azimuth),z = radius * Math.cos(inclination);
        console.log([x,y,z]);

        var light0 = new BABYLON.DirectionalLight("Dir0", BABYLON.Vector3.Zero().subtract(sunPosition), this.scene);
        light0.diffuse = new BABYLON.Color3(0.7,0.7,0.7);
        light0.specular = new BABYLON.Color3(0.9,0.9,0.9);
        this.shadow = new BABYLON.ShadowGenerator(1024,light0);
        this.shadow.filter = 0.2;

        // Water
        var testm = new BABYLON.StandardMaterial('tesm',this.scene);
        testm.diffuseColor = new BABYLON.Color3(0.4,0.4,1);

        var waterMesh = BABYLON.Mesh.CreateGround("waterMesh", 1024, 1024, 16, this.scene, false);
        waterMesh.position = new BABYLON.Vector3(0,-6,0);
        var water = new BABYLON.WaterMaterial("water", this.scene, new BABYLON.Vector2(1024, 1024));
        water.backFaceCulling = true;
        water.bumpTexture = new BABYLON.Texture(Viewer.ASSET_PATH + "/water/waterbump.png", this.scene);
        water.windForce = -3;
        water.waveHeight = 0.7;
        water.bumpHeight = 0.5;
        water.windDirection = new BABYLON.Vector2(1, 1);
        water.waterColor = new BABYLON.Color3(0, 0, 221 / 255);
        water.colorBlendFactor = 0.1;
        water.addToRenderList(skybox);
        waterMesh.material = testm;
        waterMesh.receiveShadows = true;


        var player1material = new BABYLON.StandardMaterial('player1material',this.scene);
        player1material.diffuseColor = new BABYLON.Color3(1,0,0);
        player1material.alpha = 0;
        var player2material = new BABYLON.StandardMaterial('player2material',this.scene);
        player2material.diffuseColor = new BABYLON.Color3(0,0,1);

        //load mesh from file
        BABYLON.SceneLoader.ImportMesh('ship',Viewer.ASSET_PATH + '/ship/','ship.babylon',this.scene,meshes =>{
            if(meshes.length == 1){//check if mesh loaded correctly
                var rootmesh = meshes[0]; //it's the only mesh in the file
                rootmesh.scaling = rootmesh.scaling.multiplyByFloats(0.9,0.9,0.7); //Scale, to make it fit the field better

                var clonemesh = rootmesh.clone('clone',null); //Copy mesh for second player

                /*
                Players have the following structure
                dockMesh
                    - actual ship mesh
                    - particleMesh
                        - particle emitter 1
                    - particleMesh 2
                        - particle emitter 2
                */


                var player1 = BABYLON.Mesh.CreateSphere("dockMesh1",15,0.1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                rootmesh.parent = player1;
                //this.shadow.getShadowMap().renderList.push(rootmesh);
                player1.name = "player1";
                player1.id = "player1";
                player1.rotation.y = Math.PI / 2;
                var p1particleMesh = BABYLON.Mesh.CreateSphere("p1particleMesh",15,0.1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                p1particleMesh.parent = this.scene.getMeshByID('player1');
                p1particleMesh.material = player1material;
                var p1particleMesh2 = BABYLON.Mesh.CreateSphere("p1particleMesh2",15,0.1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                p1particleMesh2.parent = p1particleMesh;
                p1particleMesh2.material = player1material;
                p1particleMesh.position.y = 0.72;
                p1particleMesh.position.z = 0.04;
                p1particleMesh.position.x = -0.11;
                p1particleMesh2.position.x = 0.25;


                var p1light = new BABYLON.PointLight('p1light',BABYLON.Vector3.Zero(),this.scene);
                p1light.specular = new BABYLON.Color3(0.4,0,0);
                p1light.diffuse = new BABYLON.Color3(0.4,0,0);
                p1light.parent = player1;
                p1light.position.y = 0.2;
                p1light.position.z = -0.1;
                p1light.range = 2;

                var p1shadow = new BABYLON.ShadowGenerator(1024,p1light);
                p1shadow.getShadowMap().renderList.push(rootmesh);
                rootmesh.receiveShadows = true;

                var player2 = BABYLON.Mesh.CreateSphere("dockMesh2",15,0.1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                clonemesh.parent = player2;//BABYLON.Mesh.ExtrudeShape("player2",shape,path,1,0,BABYLON.Mesh.CAP_ALL,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                //this.shadow.getShadowMap().renderList.push(clonemesh);
                player2.id = "player2";
                player2.name = "player2";
                player2.position.x = 5;

                var p2particleMesh = BABYLON.Mesh.CreateSphere("p2particleMesh",15,0.1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                p2particleMesh.parent = this.scene.getMeshByID('player2');
                p2particleMesh.material = player1material;
                var p2particleMesh2 = BABYLON.Mesh.CreateSphere("p2particleMesh2",15,0.1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                p2particleMesh2.parent = p2particleMesh;
                p2particleMesh2.material = player1material;
                p2particleMesh.position.y = 0.72;
                p2particleMesh.position.z = 0.04;
                p2particleMesh.position.x = -0.11;
                p2particleMesh2.position.x = 0.25;

                var p2light = new BABYLON.PointLight('p2light',BABYLON.Vector3.Zero(),this.scene);
                p2light.specular = new BABYLON.Color3(0,0,0.2);
                p2light.diffuse = new BABYLON.Color3(0,0,0.4);
                p2light.parent = player2;
                p2light.position.y = 0.2;
                p2light.position.z = -0.1;
                p2light.range = 2;

                var p2shadow = new BABYLON.ShadowGenerator(1024,p2light);
                p2shadow.getShadowMap().renderList.push(clonemesh);
                clonemesh.receiveShadows = true;





                var particleTexture = new BABYLON.Texture(Viewer.ASSET_PATH + '/smoke.png',this.scene);

                var particleSystem = new BABYLON.ParticleSystem(p1particleMesh.name + 'ps1',8000,this.scene);
                particleSystem.particleTexture = particleTexture;
                particleSystem.emitter = p1particleMesh;
                particleSystem.minEmitBox = new BABYLON.Vector3(-0.01, -0.01, -0.01); // Starting all From
                particleSystem.maxEmitBox = new BABYLON.Vector3(0.01, 0.01, 0.01); // To...
                particleSystem.minSize = 0.03;
                particleSystem.maxSize = 0.05;
                particleSystem.minLifeTime = 0.5;
                particleSystem.maxLifeTime = 1;
                particleSystem.minAngularSpeed = 0;
                particleSystem.maxAngularSpeed = Math.PI;
                particleSystem.color1 = new BABYLON.Color4(1,0,0,1);
                particleSystem.color2 = new BABYLON.Color4(1,0.5,0.5,1);
                particleSystem.colorDead = new BABYLON.Color4(1,1,1,0);
                particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
                particleSystem.gravity = new BABYLON.Vector3(0, 4, 0.1);
                particleSystem.emitRate = 1000;
                particleSystem.direction1 = new BABYLON.Vector3(-0.12,0,-0.12);
                particleSystem.direction2 = new BABYLON.Vector3(0.12,0,0.12);

                var particleSystem2 = particleSystem.clone(p1particleMesh2.name + 'ps2',p1particleMesh2);

                var particleSystem3 = particleSystem.clone(p2particleMesh.name +'ps1',p2particleMesh);
                particleSystem3.color1 = new BABYLON.Color4(0,0,1,1);
                particleSystem3.color2 = new BABYLON.Color4(0.5,0.5,1,1);
                var particleSystem4 = particleSystem3.clone(p2particleMesh2.name + 'ps2',p2particleMesh2);

                particleSystem.start();
                particleSystem2.start();
                particleSystem3.start();
                particleSystem4.start();


                var heightoffset = 0.65 + 0;
                //0.58;

                player1.position.y = heightoffset;
                player2.position.y = heightoffset;


            var canvas = new BABYLON.ScreenSpaceCanvas2D(this.scene);

            this.display.player1Text = new BABYLON.Text2D('Player1', { marginAlignment: "h: center, v:center", fontName: "bold 16px Arial", marginTop: 3})

                var player1label = new BABYLON.Group2D({
                    parent: canvas, id: "Player1Label", trackNode: player1, origin: BABYLON.Vector2.Zero(),
                    children: [
                        new BABYLON.Rectangle2D({ id: "firstRect", width: 70, height: 23, roundRadius: 3, x: -100, y: 0, origin: BABYLON.Vector2.Zero(), border: "#FFFFFFFF", fill: "#FF4444FF", children: [
                                this.display.player1Text
                            ]
                        })
                    ]
                });

                this.display.player2Text = new BABYLON.Text2D('Player2', { marginAlignment: "h: center, v:center", fontName: "bold 16px Arial", marginTop: 3 });

                var player2label = new BABYLON.Group2D({
                    parent: canvas, id: "Player2Label", trackNode: player2, origin: BABYLON.Vector2.Zero(),
                    children: [
                        new BABYLON.Rectangle2D({ id: "firstRect", width: 70, height: 23,roundRadius: 3, x: -100, y: 0, origin: BABYLON.Vector2.Zero(), border: "#FFFFFFFF", fill: "#4444FFFF", children: [
                                this.display.player2Text
                            ]
                        })
                    ]
                });

                /*groundmaterial.diffuseColor = new BABYLON.Color3(0.1,0.1,0.2);
                groundmaterial.specularColor = new BABYLON.Color3(1,1,1);
                ground.material = groundmaterial;*/
                this.fieldtypematerialfactory = new FieldTypeMaterialFactory(this.scene);
                setTimeout(() => {
                    this.camera.beta = 0.41;
                    this.camera.alpha = 0;
                    this.camera.radius = 30;
                },1000);
                //this.camera.zoomOnFactor = 0;
                this.needsRerender += 60;
                this.debug.innerText = "TEST";
                this.engine.runRenderLoop( () =>{
                    if(this.needsRerender > 0){
                        this.needsRerender --;
                        this.scene.render();
                        //this.camera.alpha += 0.003;
                        this.debug.innerText = "currentRound: " + this.currentMove + ", α: " + this.camera.alpha.toString() + ", β: " + this.camera.beta.toString() + ", (x,y,z): " + this.camera.position.x + "," + this.camera.position.y + "," + this.camera.position.z + ", needsRerender: " + this.needsRerender.toString();
                        if(this.scene.meshUnderPointer){
                            //this.debug.innerText = this.scene.meshUnderPointer.name;
                        }
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


            }else{
                throw new Error("Loaded more than one mesh from file!");
            }
        });


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
        if(state.last){
            this.display.endScreen.style.display = 'block';
            this.display.endScreen.style.opacity = "1";
        }else{
            this.display.endScreen.style.opacity = "0";
            setTimeout(() => this.display.endScreen.style.display = 'none',500);
        }
        this.display.progress.style.width = (((state.turn / 2) / 30) * 100).toString() + "%";
        var round = state.turn == 0 ? 0 : Math.floor((state.turn / 2) - 0.5)
        this.display.round.innerText = round < 10 ? '0' +  round.toString() : round.toString();
        this.display.redPoints.innerText = state.red.points.toString();
        this.display.bluePoints.innerText = state.blue.points.toString();
        this.display.player1Text.text = state.red.coal.toString() + "⬢   "  + state.red.speed.toString() + '➡' ;
        this.display.player2Text.text = state.blue.coal.toString() + "⬢  "  + state.blue.speed.toString() + '➡' ;

        var getTileName = (t:Field) => "Tile(" + t.x + "," + t.y + ")";

        //Iterate over new tiles
        for(let t of state.board.tiles){
            for(let f of t.fields){
                if(! this.scene.getMeshByName(getTileName(f))){ //Create new meshes
                    //console.log("(" + f.x + "," + f.y + ") = " +  f.type);
                    var mesh = BABYLON.Mesh.CreateCylinder(getTileName(f),1,3,3,6,1,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                    [mesh.position.x, mesh.position.z] = Grid.getCoordinates(f.x, f.y, 3/2);
                    mesh.position.z += (Math.random() * 0.1); //Vary height a bit
                    mesh.material = this.fieldtypematerialfactory.getMaterialForFieldType(f.type);
                    mesh.receiveShadows = true;
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

        //Do not animate if zero-turn
        if(!state.animated || (!animated)){
            this.needsRerender += 30;
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
        this.scene.beginAnimation(activePlayer,0,frame,false,1,()=>(setTimeout(this.controls.playCallback,100)));
        this.scene.beginAnimation(otherPlayer,0,frame,false);
        this.needsRerender += frame + 10;

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
        const offset = Math.PI / 2;
        switch(rot){
            case DIRECTION.RIGHT:
                return 0;//Math.PI / 2;
            case DIRECTION.LEFT:
                return -Math.PI / 2 - offset;
            case DIRECTION.DOWN_RIGHT:
                return Math.PI * 5/6 - offset;
            case DIRECTION.DOWN_LEFT:
                return Math.PI * 7/6 - offset;
            case DIRECTION.UP_RIGHT:
                return Math.PI * 1/6 - offset;
            case DIRECTION.UP_LEFT:
                return -Math.PI * 1/6 - offset;
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
    private scene: BABYLON.Scene;
    private fieldMap: {[type: string]: BABYLON.Material} = {};

    constructor(scene: BABYLON.Scene){
        this.scene = scene;
    }

    public  getMaterialForFieldType(f: FIELDTYPE):BABYLON.Material{
        if(this.fieldMap[f.toString()]){
            return this.fieldMap[f.toString()];
        }else{
            switch(f){
                case FIELDTYPE.WATER:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: water");
                     m.diffuseColor = new BABYLON.Color3(1,1,1);
                     //m.specularColor = new BABYLON.Color3(0.2,0.2,1);
                     m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/water.png", this.scene);
                     this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.LOG:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: log");
                     //m.diffuseColor = new BABYLON.Color3(0.6,0.1,0.5);
                     //m.specularColor = new BABYLON.Color3(1,0.5,0.1);
                     m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/logs.png", this.scene);
                     this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.BLOCKED:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: blocked");
                     m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/island.png", this.scene);
                     this.fieldMap[f.toString()] = m;
                break;
                 case FIELDTYPE.SANDBANK:
                     var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                     console.log("New fieldtype: sandbank");
                     //m.diffuseColor = new BABYLON.Color3(0,0,1);
                     //m.specularColor = new BABYLON.Color3(1,1,1);
                      m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/sandbank.png", this.scene);
                     this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.GOAL:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: goal");
                    m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/goal.png", this.scene);
                    this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER0:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger.png", this.scene);
                    this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER1:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger1.png", this.scene);
                    this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER2:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger2.png", this.scene);
                    this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER3:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger3.png", this.scene);
                    this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER4:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger4.png", this.scene);
                    this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER5:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger5.png", this.scene);
                    this.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.PASSENGER6:
                    var m = new BABYLON.StandardMaterial(f.toString(),this.scene);
                    console.log("New fieldtype: passenger");
                    m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger6.png", this.scene);
                    this.fieldMap[f.toString()] = m;
                break;


            }
            return this.fieldMap[f.toString()];
        }
    }
}
