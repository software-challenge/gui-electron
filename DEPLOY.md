# Deployment

Um den Replay-Viewer zu deployen müssen folgende Dateien gehostet werden:
- babylonjs/babylon.2.5.js
- babylonjs/babylon.2.5.canvas2d.js
- babylonjs/materialsLibrary/babylon.skyMaterial.js
- babylonjs/materialsLibrary/babylon.waterMaterial.js
- node_modules/handjs/hand.js
- node_modules/requirejs/require.js
- der komplette Ordner 'textures'
- der Ordner assets mit allem in den Unterordnern 'ship', 'win' sowie 'smoke.png'
- alle JS-Dateien aus 'bin/code'

Die JS-Dateien können eingebunden werden wie in `viewer.html` gezeigt, im ein
Replay zu erzeugen ist kein Iframe mehr nötig, sondern es wird pro Replay ein
Tag `<replay-viewer>` mit dem 'replay'-Attribut auf den Pfad des Replays gesetzt
angelegt.

Die Anwendung scannt dann alle tags und legt für jeden Replay-Viewer-Tag ein
Canvas an. Auf diese Weise müssen Texturen nicht mehrfach geladen werden.

Mit r.js kann man auch ein einzelnes js file produzieren. Das ist noch in der Entstehung, aber grundsaeztlich:

./node_modules/requirejs/bin/r.js -o build.js

In build.js sind die Einstellungen. viewer2.html laedt dann das einzelne js file (geht aber noch nicht).
