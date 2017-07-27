define(["require", "exports", "./Replay"], function (require, exports, Replay_1) {
    "use strict";
    class Viewer {
        //
        constructor(replay, element, document, window) {
            //DOM Elements
            this.controls = { 'next': null, 'previous': null, 'play': null, 'first': null, 'last': null, 'playing': false, playCallback: null };
            this.display = {
                'redPoints': null,
                'round': null,
                'bluePoints': null,
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
            this.animationsPlayed = 0;
            this.lastRoundRendered = false;
            this.currentMove = 0;
            this.tiles_to_sink = [];
            //Take time measurement for later performance analysis
            this.startup_timestamp = performance.now();
            //Initialize engine startup dependency management
            this.initialization_steps_remaining = 0;
            //Save replay for later
            this.replay = replay;
            //Initialize engine
            this.canvas = document.createElement('canvas');
            this.canvas.classList.add('viewerCanvas');
            element.appendChild(this.canvas);
            this.engine = new BABYLON.Engine(this.canvas, true);
            //
            //Debug-Display
            this.debugActive = element.hasAttribute('debug');
            this.debug = document.createElement('div');
            this.debug.classList.add('replay-debug');
            if (!this.debugActive) {
                this.debug.style.display = 'none';
            }
            //
            //Rerender-control
            this.rerenderControlActive = element.hasAttribute('rerender-control');
            this.needsRerender = 1;
            window.addEventListener('blur', () => {
                this.needsRerender = 0;
            });
            window.addEventListener('focus', () => {
                this.needsRerender = 1;
            });
            //
            //Initialize controls
            this.controlsElement = document.createElement('div');
            this.controlsElement.classList.add("replay-controls");
            this.controls.next = document.createElement('button');
            this.controls.next.innerText = "⏩";
            this.controls.next.addEventListener('click', (e) => {
                if (this.currentMove < (this.replay.states.length - 1)) {
                    this.currentMove++;
                }
                this.render(this.replay.states[this.currentMove], e.ctrlKey);
            });
            this.controls.previous = document.createElement('button');
            this.controls.previous.innerText = "⏪";
            this.controls.previous.addEventListener('click', (e) => {
                if (this.currentMove > 0) {
                    this.currentMove--;
                }
                if (this.lastRoundRendered) {
                    this.lastRoundRendered = false;
                    this.currentMove++;
                }
                this.render(this.replay.states[this.currentMove], e.ctrlKey);
            });
            this.controls.play = document.createElement('button');
            this.controls.play.innerText = "►";
            this.controls.playCallback = () => {
                this.animationsPlayed++;
                if (this.animationsPlayed == 2 && this.controls.playing) {
                    if (this.currentMove < (this.replay.states.length - 1)) {
                        this.currentMove++;
                    }
                    else {
                        this.controls.play.click();
                    }
                    this.render(this.replay.states[this.currentMove], true);
                }
            };
            this.controls.play.addEventListener('click', () => {
                if (!this.controls.playing) {
                    this.controls.play.innerText = "▮▮";
                    this.controls.playing = true;
                    this.animationsPlayed = 1;
                    this.controls.playCallback();
                }
                else {
                    this.controls.play.innerText = "►";
                    this.controls.playing = false;
                }
            });
            this.controls.first = document.createElement('button');
            this.controls.first.innerText = "⏮";
            this.controls.first.addEventListener('click', () => {
                this.currentMove = 0;
                this.render(this.replay.states[this.currentMove], false);
            });
            this.controls.last = document.createElement('button');
            this.controls.last.innerText = "⏭";
            this.controls.last.addEventListener('click', () => {
                this.lastRoundRendered = true;
                this.currentMove = this.replay.states.length - 1;
                this.render(this.replay.states[this.currentMove], false);
            });
            this.controlsElement.appendChild(this.controls.first);
            this.controlsElement.appendChild(this.controls.previous);
            this.controlsElement.appendChild(this.controls.play);
            this.controlsElement.appendChild(this.controls.next);
            this.controlsElement.appendChild(this.controls.last);
            //
            //Initialize display
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
            var winnerColorClass = replay.score.winner == 0 /* RED */ ? 'replay-winRed' : 'replay-winBlue';
            var loserColorClass = replay.score.winner == 0 /* RED */ ? 'replay-winBlue' : 'replay-winRed';
            var htmlScore = replay.score.processedReason.replace(replay.score.winnerName, '<span class="' + winnerColorClass + '">' + replay.score.winnerName + '</span>');
            htmlScore = htmlScore.replace(replay.score.loserName, '<span class="' + loserColorClass + '">' + replay.score.loserName + '</span>');
            htmlScore = htmlScore.replace('&#xa;', '<br>'); //Fix linefeeds
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
            element.appendChild(this.debug);
            element.appendChild(this.controlsElement);
            element.appendChild(progressbar);
            element.appendChild(this.display.endScreen);
            var displayContainer = document.createElement('div');
            displayContainer.classList.add('replay-displayContainer');
            displayContainer.appendChild(this.displayElement);
            element.appendChild(displayContainer);
            //
            //Initialize scene...
            this.scene = new BABYLON.Scene(this.engine);
            this.fieldtypematerialfactory = new FieldTypeMaterialFactory(this.scene);
            this.cameraFocus = BABYLON.Mesh.CreateSphere("dockMesh1", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            this.cameraFocus.material = this.fieldtypematerialfactory.getAlphaMaterial();
            this.camera = new BABYLON.ArcFollowCamera('camera', -2 * Math.PI, 1, 35, this.cameraFocus, this.scene);
            this.scene.activeCamera = this.camera;
            this.scene.activeCamera.attachControl(this.canvas);
            if (element.hasAttribute('fxaa')) {
                var fxaa_level = parseInt(element.getAttribute('fxaa'));
                var postProcess = new BABYLON.FxaaPostProcess("fxaa", fxaa_level, this.camera, null, this.engine, true);
                console.log("Activated " + fxaa_level + "x FXAA post-processing");
            }
            //
            //Set up sky
            var luminance = Math.abs(Math.sin((new Date().getHours() / 24 * Math.PI) + Math.PI));
            luminance = 0.2;
            var skyMaterial = new BABYLON.SkyMaterial("skyMaterial", this.scene);
            skyMaterial.backFaceCulling = false;
            skyMaterial.turbidity = 10;
            skyMaterial.luminance = (1.179 - (1.179 * luminance)) + 0.1;
            skyMaterial.rayleigh = luminance * 2;
            skyMaterial.useSunPosition = true;
            var sunPosition = new BABYLON.Vector3(0, 0, 0);
            sunPosition.y = 1000 * luminance;
            sunPosition.x = -1500 + (1000 * luminance);
            skyMaterial.sunPosition = sunPosition;
            var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000, this.scene);
            skybox.material = skyMaterial;
            //
            //Set up scene lighting
            var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 100, 0), this.scene);
            //var light = new BABYLON.DirectionalLight('sun',new BABYLON.Vector3(0,-1,0),this.scene);
            light.specular = new BABYLON.Color3(0.7, 0.7, 0.7);
            light.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
            var radius = 1, inclination = skyMaterial.luminance * Math.PI, azimuth = skyMaterial.azimuth * Math.PI * 2;
            var x = radius * Math.sin(inclination) * Math.cos(azimuth), y = radius * Math.sin(inclination) * Math.sin(azimuth), z = radius * Math.cos(inclination);
            var light0 = new BABYLON.DirectionalLight("Dir0", BABYLON.Vector3.Zero().subtract(sunPosition), this.scene);
            light0.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
            light0.specular = new BABYLON.Color3(0.9, 0.9, 0.9);
            this.shadow = new BABYLON.ShadowGenerator(1024, light0);
            this.shadow.filter = 0.2;
            //
            //Water
            var waterMaterial = new BABYLON.StandardMaterial('tesm', this.scene);
            waterMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 1);
            var waterMesh = BABYLON.Mesh.CreateGround("waterMesh", 1024, 1024, 16, this.scene, false);
            waterMesh.position = new BABYLON.Vector3(0, -6, 0);
            waterMesh.material = waterMaterial;
            waterMesh.receiveShadows = true;
            //
            //Set up players
            //load mesh from file
            this.initialization_steps_remaining++;
            BABYLON.SceneLoader.ImportMesh('ship', Viewer.ASSET_PATH + '/ship/', 'ship.babylon', this.scene, meshes => {
                if (meshes.length == 1) {
                    var rootmesh = meshes[0]; //it's the only mesh in the file
                    rootmesh.scaling = rootmesh.scaling.multiplyByFloats(0.9, 0.9, 0.7); //Scale, to make it fit the field better
                    var clonemesh = rootmesh.clone('clone', null); //Copy mesh for second player
                    /*
                    Players have the following structure
                    dockMesh
                        - actual ship mesh
                        - particleMesh
                            - particle emitter 1
                        - particleMesh 2
                            - particle emitter 2
                    */
                    this.player1 = BABYLON.Mesh.CreateSphere("dockMesh1", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
                    rootmesh.parent = this.player1;
                    //this.shadow.getShadowMap().renderList.push(rootmesh);
                    this.player1.name = "player1";
                    this.player1.id = "player1";
                    this.player1.rotation.y = Math.PI / 2;
                    var p1particleMesh = BABYLON.Mesh.CreateSphere("p1particleMesh", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
                    p1particleMesh.parent = this.scene.getMeshByID('player1');
                    p1particleMesh.material = this.fieldtypematerialfactory.getAlphaMaterial();
                    var p1particleMesh2 = BABYLON.Mesh.CreateSphere("p1particleMesh2", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
                    p1particleMesh2.parent = p1particleMesh;
                    p1particleMesh2.material = this.fieldtypematerialfactory.getAlphaMaterial();
                    p1particleMesh.position.y = 0.72;
                    p1particleMesh.position.z = 0.04;
                    p1particleMesh.position.x = -0.11;
                    p1particleMesh2.position.x = 0.25;
                    var p1light = new BABYLON.PointLight('p1light', BABYLON.Vector3.Zero(), this.scene);
                    p1light.specular = new BABYLON.Color3(0.4, 0, 0);
                    p1light.diffuse = new BABYLON.Color3(0.4, 0, 0);
                    p1light.parent = this.player1;
                    p1light.position.y = 0.2;
                    p1light.position.z = -0.1;
                    p1light.range = 2;
                    var p1shadow = new BABYLON.ShadowGenerator(1024, p1light);
                    p1shadow.getShadowMap().renderList.push(rootmesh);
                    rootmesh.receiveShadows = true;
                    this.player2 = BABYLON.Mesh.CreateSphere("dockMesh2", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
                    clonemesh.parent = this.player2; //BABYLON.Mesh.ExtrudeShape("player2",shape,path,1,0,BABYLON.Mesh.CAP_ALL,this.scene,false,BABYLON.Mesh.DEFAULTSIDE);
                    //this.shadow.getShadowMap().renderList.push(clonemesh);
                    this.player2.id = "player2";
                    this.player2.name = "player2";
                    this.player2.position.x = 5;
                    var p2particleMesh = BABYLON.Mesh.CreateSphere("p2particleMesh", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
                    p2particleMesh.parent = this.scene.getMeshByID('player2');
                    p2particleMesh.material = this.fieldtypematerialfactory.getAlphaMaterial();
                    var p2particleMesh2 = BABYLON.Mesh.CreateSphere("p2particleMesh2", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
                    p2particleMesh2.parent = p2particleMesh;
                    p2particleMesh2.material = this.fieldtypematerialfactory.getAlphaMaterial();
                    p2particleMesh.position.y = 0.72;
                    p2particleMesh.position.z = 0.04;
                    p2particleMesh.position.x = -0.11;
                    p2particleMesh2.position.x = 0.25;
                    var p2light = new BABYLON.PointLight('p2light', BABYLON.Vector3.Zero(), this.scene);
                    p2light.specular = new BABYLON.Color3(0, 0, 0.2);
                    p2light.diffuse = new BABYLON.Color3(0, 0, 0.4);
                    p2light.parent = this.player2;
                    p2light.position.y = 0.2;
                    p2light.position.z = -0.1;
                    p2light.range = 2;
                    var p2shadow = new BABYLON.ShadowGenerator(1024, p2light);
                    p2shadow.getShadowMap().renderList.push(clonemesh);
                    clonemesh.receiveShadows = true;
                    var particleTexture = new BABYLON.Texture(Viewer.ASSET_PATH + '/smoke.png', this.scene);
                    var particleSystem = new BABYLON.ParticleSystem(p1particleMesh.name + 'ps1', 8000, this.scene);
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
                    particleSystem.color1 = new BABYLON.Color4(1, 0, 0, 1);
                    particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0.5, 1);
                    particleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);
                    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
                    particleSystem.gravity = new BABYLON.Vector3(0, 4, 0.1);
                    particleSystem.emitRate = 1000;
                    particleSystem.direction1 = new BABYLON.Vector3(-0.12, 0, -0.12);
                    particleSystem.direction2 = new BABYLON.Vector3(0.12, 0, 0.12);
                    var particleSystem2 = particleSystem.clone(p1particleMesh2.name + 'ps2', p1particleMesh2);
                    var particleSystem3 = particleSystem.clone(p2particleMesh.name + 'ps1', p2particleMesh);
                    particleSystem3.color1 = new BABYLON.Color4(0, 0, 1, 1);
                    particleSystem3.color2 = new BABYLON.Color4(0.5, 0.5, 1, 1);
                    var particleSystem4 = particleSystem3.clone(p2particleMesh2.name + 'ps2', p2particleMesh2);
                    particleSystem.start();
                    particleSystem2.start();
                    particleSystem3.start();
                    particleSystem4.start();
                    var heightoffset = 0.65 + 0;
                    //0.58;
                    this.player1.position.y = heightoffset;
                    this.player2.position.y = heightoffset;
                    var canvas = new BABYLON.ScreenSpaceCanvas2D(this.scene);
                    this.display.player1Text = new BABYLON.Text2D('Player1', { marginAlignment: "h: center, v:center", fontName: "bold 28px Arial", marginTop: 5 });
                    var player1label = new BABYLON.Group2D({
                        parent: canvas, id: "Player1Label", trackNode: this.player1, origin: BABYLON.Vector2.Zero(),
                        children: [
                            new BABYLON.Rectangle2D({ id: "firstRect", width: 150, height: 34, roundRadius: 3, x: -170, y: 0, origin: BABYLON.Vector2.Zero(), border: "#FFFFFFFF", fill: "#FF4444B0", children: [
                                    this.display.player1Text
                                ]
                            })
                        ]
                    });
                    this.display.player2Text = new BABYLON.Text2D('Player2', { marginAlignment: "h: center, v:center", fontName: "bold 28px Arial", marginTop: 5 });
                    var player2label = new BABYLON.Group2D({
                        parent: canvas, id: "Player2Label", trackNode: this.player2, origin: BABYLON.Vector2.Zero(),
                        children: [
                            new BABYLON.Rectangle2D({ id: "firstRect", width: 150, height: 34, roundRadius: 3, x: -170, y: 0, origin: BABYLON.Vector2.Zero(), border: "#FFFFFFFF", fill: "#4444FFB0", children: [
                                    this.display.player2Text
                                ]
                            })
                        ]
                    });
                }
                else {
                    throw new Error("Loaded more than one mesh from file!");
                }
                //All done, try to start engine
                this.initialization_steps_remaining--;
                this.startEngine();
            });
            //
            //Set up passengers
            this.initialization_steps_remaining++;
            this.passengers = [];
            var passengerMaterial = new BABYLON.StandardMaterial('passengerMaterial', this.scene);
            passengerMaterial.diffuseColor = BABYLON.Color3.Yellow();
            passengerMaterial.specularColor = BABYLON.Color3.Yellow();
            this.replay.passengers.forEach(passenger => {
                //Create passenger geometry
                var p = BABYLON.Mesh.CreateSphere('passenger-' + passenger.id, 15, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
                p.material = passengerMaterial;
                var [x, y] = Grid.getCoordinates(passenger.x, passenger.y, Viewer.GRID_SIZE);
                p.position = new BABYLON.Vector3(x, 1, y);
                p.position.y = -50;
                this.passengers[passenger.id] = p;
            });
            this.initialization_steps_remaining--;
            //
            //Attempt startup
            this.startEngine();
            setTimeout(() => this.startEngine(), 500);
            setTimeout(() => this.startEngine(), 1000);
        }
        startEngine() {
            if (this.initialization_steps_remaining == 0) {
                this.initialization_steps_remaining = -1;
                this.engine.runRenderLoop(() => {
                    if (this.needsRerender > 0 || (!this.rerenderControlActive)) {
                        //this.needsRerender --;
                        //this.focus();
                        this.scene.render();
                        //this.camera.alpha += 0.003;
                        if (this.debugActive) {
                            this.debug.innerText = "currentRound: " + this.currentMove + ", α: " + this.camera.alpha.toString() + ", β: " + this.camera.beta.toString() + ", (x,y,z): " + this.camera.position.x + "," + this.camera.position.y + "," + this.camera.position.z + ", needsRerender: " + this.needsRerender.toString();
                        }
                        if (this.scene.meshUnderPointer) {
                        }
                    }
                });
                window.addEventListener('resize', () => {
                    this.engine.resize();
                });
                window.addEventListener("click", () => {
                    var pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
                    if (pickResult.hit) {
                        console.log(pickResult.pickedMesh.id);
                    }
                });
                console.log("initializing viewer took " + (performance.now() - this.startup_timestamp) + "ms");
                this.render(this.replay.states[this.currentMove], false);
            }
        }
        render(state, animated) {
            //Handle possible last state
            if (state.last) {
                if (!this.lastRoundRendered) {
                    this.lastRoundRendered = true;
                    this.display.endScreen.style.opacity = "0";
                    setTimeout(() => this.display.endScreen.style.display = 'none', 500);
                    this.needsRerender = 1;
                }
                else {
                    this.display.endScreen.style.display = 'block';
                    setTimeout(() => {
                        this.display.endScreen.style.opacity = "1";
                        this.needsRerender = 0;
                    }, 100);
                }
            }
            else {
                this.lastRoundRendered = false;
                this.display.endScreen.style.opacity = "0";
                setTimeout(() => this.display.endScreen.style.display = 'none', 500);
                this.needsRerender = 1;
            }
            //Update display
            this.display.progress.style.width = (((state.turn / 2) / 30) * 100).toString() + "%";
            var round = state.turn == 0 ? 0 : Math.floor((state.turn / 2) - 0.5);
            this.display.round.innerText = round < 10 ? '0' + round.toString() : round.toString();
            this.display.redPoints.innerText = state.red.points.toString();
            this.display.bluePoints.innerText = state.blue.points.toString();
            this.display.player1Text.text = state.red.coal.toString() + "⬢  " + state.red.speed.toString() + '➡  ' + state.red.passenger.toString() + "P";
            this.display.player2Text.text = state.blue.coal.toString() + "⬢  " + state.blue.speed.toString() + '➡  ' + state.blue.passenger.toString() + "P";
            var getTileName = (t) => "Tile(" + t.x + "," + t.y + ")";
            //Iterate over new tiles
            for (let t of state.board.tiles) {
                for (let f of t.fields) {
                    if (!this.scene.getMeshByName(getTileName(f))) {
                        //console.log("(" + f.x + "," + f.y + ") = " +  f.type);
                        var mesh = BABYLON.Mesh.CreateCylinder(getTileName(f), 1, 3, 3, 6, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
                        [mesh.position.x, mesh.position.z] = Grid.getCoordinates(f.x, f.y, 3 / 2);
                        mesh.position.z += (Math.random() * 0.1); //Vary height a bit
                        mesh.material = this.fieldtypematerialfactory.getMaterialForFieldType(f.type);
                        mesh.receiveShadows = true;
                    }
                    this.scene.getMeshByName(getTileName(f)).position.y = 0; //Raise all current meshes to the surface
                }
            }
            var i = 0;
            this.tiles_to_sink.forEach(tile => {
                tile.position.y = -50;
            });
            this.tiles_to_sink = [];
            if (this.lastBoard != null) {
                for (let lt of this.lastBoard.tileIndices) {
                    if (state.board.tileIndices.indexOf(lt) == -1) {
                        for (let f of this.lastBoard.getTileByIndex(lt).fields) {
                            var tile = this.scene.getMeshByName(getTileName(f));
                            this.tiles_to_sink.push(tile); //Disappear tiles that aren't in the game anymore
                        }
                    }
                }
            }
            this.lastBoard = state.board;
            //Precalculate camera position
            var [rpx, rpy] = Grid.getCoordinates(state.red.x, state.red.y, 3 / 2);
            var [bpx, bpy] = Grid.getCoordinates(state.blue.x, state.blue.y, 3 / 2);
            var newPos = new BABYLON.Vector3((rpx + bpx) * 0.5, 0, (rpy + bpy) * 0.5);
            //Set state on passengers
            this.replay.passengers.forEach((passenger) => {
                //Appear passengers that are on tiles that appeared in the current round
                if (passenger.appears_turn <= this.currentMove) {
                    this.passengers[passenger.id].position.y = 1;
                }
                //Disappear passengers that got picked up last turn
                if (passenger.picked_up_turn < this.currentMove) {
                    this.passengers[passenger.id].position.y = -50;
                }
            });
            //Do not animate if zero-turn
            if (!state.animated || (!animated)) {
                //this.needsRerender += 30;
                console.log("Red: " + state.red.x + "," + state.red.y);
                var [px, py] = Grid.getCoordinates(state.red.x, state.red.y, 3 / 2);
                var player1 = this.scene.getMeshByName('player1');
                player1.position.x = px;
                player1.position.z = py;
                player1.rotation.y = Grid.getRotation(state.red.direction);
                console.log("Red direction:" + Replay_1.Board.DirectionToString(state.red.direction));
                console.log("Blue: " + state.blue.x + "," + state.blue.y);
                [px, py] = Grid.getCoordinates(state.blue.x, state.blue.y, 3 / 2);
                var player2 = this.scene.getMeshByName('player2');
                player2.position.x = px;
                player2.position.z = py;
                player2.rotation.y = Grid.getRotation(state.blue.direction);
                console.log("Blue direction:" + Replay_1.Board.DirectionToString(state.blue.direction));
                this.cameraFocus.position = newPos;
            }
            else {
                //Create new animations
                let frame = 0;
                let counter = 0;
                let p1Position = [], p2Position = [], p1Rotation = [], p2Rotation = [];
                let p1PositionAnimation = new BABYLON.Animation("Player1Position" + state.turn, "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                let p2PositionAnimation = new BABYLON.Animation("Player2Position" + state.turn, "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                let p1RotationAnimation = new BABYLON.Animation("Player1Rotation" + state.turn, "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                let p2RotationAnimation = new BABYLON.Animation("Player2Rotation" + state.turn, "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                let yalign = this.player1.position.y;
                //Remember, the following is actually relative to the turn before this one, so the players are switched 🙈
                if (state.currentPlayer == 1 /* BLUE */) {
                    console.log("Active player should be blue");
                }
                this.player1.animations = [];
                this.player2.animations = [];
                for (var i = 0; i < state.moves.length; i++) {
                    let move = state.moves[i];
                    var activePlayer = move.activePlayer == 0 /* RED */ ? { 'position': p1Position, 'rotation': p1Rotation, 'id': 1 } : { 'position': p2Position, 'rotation': p2Rotation, 'id': 2 };
                    var otherPlayer = move.activePlayer == 0 /* RED */ ? { 'position': p2Position, 'rotation': p2Rotation, 'id': 2 } : { 'position': p1Position, 'rotation': p1Rotation, 'id': 1 };
                    if (i == 0) {
                        console.log("[animation] SELECT activePlayer = " + activePlayer.id + " @" + frame);
                        console.log("[animation] SELECT otherPlayer = " + otherPlayer.id + " @" + frame);
                    }
                    switch (move.type) {
                        case 2 /* STEP */:
                            var coords = Grid.getCoordinates(move.animationHints['startX'], move.animationHints['startY'], Viewer.GRID_SIZE);
                            activePlayer.position.push({
                                'frame': frame,
                                'value': new BABYLON.Vector3(coords[0], yalign, coords[1])
                            });
                            frame += Viewer.ANIMATION_FRAMES;
                            coords = Grid.getCoordinates(move.animationHints['targetX'], move.animationHints['targetY'], Viewer.GRID_SIZE);
                            activePlayer.position.push({
                                'frame': frame,
                                'value': new BABYLON.Vector3(coords[0], yalign, coords[1])
                            });
                            console.log("[animation] STEP activePlayer from " + move.animationHints['startX'] + "," + move.animationHints['startY'] + " to " + move.animationHints['targetX'] + "," + move.animationHints['targetY'] + " @" + frame);
                            break;
                        case 1 /* TURN */:
                            activePlayer.rotation.push({
                                'frame': frame,
                                'value': Grid.getRotation(move.animationHints['startDirection'])
                            });
                            frame += Viewer.ANIMATION_FRAMES;
                            activePlayer.rotation.push({
                                'frame': frame,
                                'value': Grid.getRotation(move.animationHints['targetDirection'])
                            });
                            console.log("[animation] TURN activePlayer from " + Replay_1.Board.DirectionToString(move.animationHints['startDirection']) + " to " + Replay_1.Board.DirectionToString(move.animationHints['targetDirection']) + " @" + frame);
                            break;
                        case 3 /* PUSH */:
                            var coords = Grid.getCoordinates(move.animationHints['startOtherX'], move.animationHints['startOtherY'], Viewer.GRID_SIZE);
                            otherPlayer.position.push({
                                'frame': frame,
                                'value': new BABYLON.Vector3(coords[0], yalign, coords[1])
                            });
                            frame += Viewer.ANIMATION_FRAMES;
                            coords = Grid.getCoordinates(move.animationHints['targetOtherX'], move.animationHints['targetOtherY'], Viewer.GRID_SIZE);
                            otherPlayer.position.push({
                                'frame': frame,
                                'value': new BABYLON.Vector3(coords[0], yalign, coords[1])
                            });
                            console.log("[animation] PUSH otherPlayer to " + move.animationHints['targetOtherX'] + "," + move.animationHints['targetOtherY'] + " @" + frame);
                            break;
                    }
                }
                //Camera adjustments:
                var camanim = new BABYLON.Animation("camera" + counter++, "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                camanim.setKeys([{ 'frame': 0, 'value': this.cameraFocus.position }, { 'frame': frame, 'value': newPos }]);
                this.cameraFocus.animations.push(camanim);
                p1PositionAnimation.setKeys(p1Position);
                if (p1Position.length > 0) {
                    this.player1.animations.push(p1PositionAnimation);
                }
                p1RotationAnimation.setKeys(p1Rotation);
                if (p1Rotation.length > 0) {
                    this.player1.animations.push(p1RotationAnimation);
                }
                p2PositionAnimation.setKeys(p2Position);
                if (p2Position.length > 0) {
                    this.player2.animations.push(p2PositionAnimation);
                }
                p2RotationAnimation.setKeys(p2Rotation);
                if (p2Rotation.length > 0) {
                    this.player2.animations.push(p2RotationAnimation);
                }
                this.animationsPlayed = 0;
                console.log(this.player1.animations);
                console.log(this.player2.animations);
                this.scene.beginAnimation(this.cameraFocus, 0, frame, false);
                this.scene.beginAnimation(this.player1, 0, frame, false, 1, () => (setTimeout(this.controls.playCallback, 100)));
                this.scene.beginAnimation(this.player2, 0, frame, false, 1, () => (setTimeout(this.controls.playCallback, 100)));
            }
        }
    }
    //Path constants
    //static PATH_PREFIX: string = "/replay_viewers/mississippi_queen/";
    Viewer.PATH_PREFIX = "";
    Viewer.ASSET_PATH = Viewer.PATH_PREFIX + "assets";
    Viewer.TEXTURE_PATH = Viewer.PATH_PREFIX + "textures";
    //Display settings
    Viewer.ANIMATION_FRAMES = 30;
    Viewer.GRID_SIZE = 3 / 2;
    exports.Viewer = Viewer;
    class Grid {
        static getCoordinates(x, y, size) {
            /*Next we want to put several hexagons together.
            In the horizontal orientation, the height of a hexagon is height = size * 2.
            The vertical distance between adjacent hexes is vert = height * 3/4.
            The width of a hexagon is width = sqrt(3)/2 * height.
            The horizontal distance between adjacent hexes is horiz = width. */
            let spacer = 0.05;
            size += spacer;
            let height = size * 2;
            let vert = height * 3 / 4;
            let width = Math.sqrt(3) / 2 * height;
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
        static getRotation(rot) {
            const offset = Math.PI / 2;
            switch (rot) {
                case 0 /* RIGHT */:
                    return 0; //Math.PI / 2;
                case 3 /* LEFT */:
                    return -Math.PI / 2 - offset;
                case 5 /* DOWN_RIGHT */:
                    return Math.PI * 5 / 6 - offset;
                case 4 /* DOWN_LEFT */:
                    return Math.PI * 7 / 6 - offset;
                case 1 /* UP_RIGHT */:
                    return Math.PI * 1 / 6 - offset;
                case 2 /* UP_LEFT */:
                    return -Math.PI * 1 / 6 - offset;
            }
        }
        static rotationToString(rot) {
            switch (rot) {
                case 0 /* RIGHT */:
                    return "DIRECTION.RIGHT";
                case 3 /* LEFT */:
                    return "DIRECTION.LEFT";
                case 1 /* UP_RIGHT */:
                    return "DIRECTION.UP_RIGHT";
                case 2 /* UP_LEFT */:
                    return "DIRECTION.UP_LEFT";
                case 5 /* DOWN_RIGHT */:
                    return "DIRECTION.DOWN_RIGHT";
                case 4 /* DOWN_LEFT */:
                    return "DIRECTION.DOWN_LEFT";
            }
        }
    }
    /*
        This is very preliminary, it's probably better to create Textured Materials while loading the replay
    */
    class FieldTypeMaterialFactory {
        constructor(scene) {
            this.fieldMap = {};
            this.scene = scene;
            this.alphaMaterial = new BABYLON.StandardMaterial('alphamaterial', this.scene);
            this.alphaMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
            this.alphaMaterial.alpha = 0;
            this.getMaterialForFieldType(2 /* BLOCKED */);
            this.getMaterialForFieldType(11 /* GOAL */);
            this.getMaterialForFieldType(1 /* LOG */);
            this.getMaterialForFieldType(3 /* PASSENGER0 */);
            this.getMaterialForFieldType(4 /* PASSENGER1 */);
            this.getMaterialForFieldType(5 /* PASSENGER2 */);
            this.getMaterialForFieldType(6 /* PASSENGER3 */);
            this.getMaterialForFieldType(7 /* PASSENGER4 */);
            this.getMaterialForFieldType(8 /* PASSENGER5 */);
            this.getMaterialForFieldType(9 /* PASSENGER6 */);
            this.getMaterialForFieldType(10 /* SANDBANK */);
            this.getMaterialForFieldType(0 /* WATER */);
        }
        getAlphaMaterial() {
            return this.alphaMaterial;
        }
        getMaterialForFieldType(f) {
            if (this.fieldMap[f.toString()]) {
                return this.fieldMap[f.toString()];
            }
            else {
                switch (f) {
                    case 0 /* WATER */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: water");
                        m.diffuseColor = new BABYLON.Color3(1, 1, 1);
                        //m.specularColor = new BABYLON.Color3(0.2,0.2,1);
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/water.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 1 /* LOG */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: log");
                        //m.diffuseColor = new BABYLON.Color3(0.6,0.1,0.5);
                        //m.specularColor = new BABYLON.Color3(1,0.5,0.1);
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/logs.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 2 /* BLOCKED */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: blocked");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/island.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 10 /* SANDBANK */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: sandbank");
                        //m.diffuseColor = new BABYLON.Color3(0,0,1);
                        //m.specularColor = new BABYLON.Color3(1,1,1);
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/sandbank.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 11 /* GOAL */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: goal");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/goal.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 3 /* PASSENGER0 */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: passenger");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 4 /* PASSENGER1 */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: passenger");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger1.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 5 /* PASSENGER2 */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: passenger");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger2.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 6 /* PASSENGER3 */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: passenger");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger3.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 7 /* PASSENGER4 */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: passenger");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger4.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 8 /* PASSENGER5 */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: passenger");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger5.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                    case 9 /* PASSENGER6 */:
                        var m = new BABYLON.StandardMaterial(f.toString(), this.scene);
                        console.log("New fieldtype: passenger");
                        m.diffuseTexture = new BABYLON.Texture(Viewer.TEXTURE_PATH + "/passenger6.png", this.scene);
                        this.fieldMap[f.toString()] = m;
                        break;
                }
                return this.fieldMap[f.toString()];
            }
        }
    }
});
//# sourceMappingURL=Viewer.js.map