# Replay-Viewer/GUI Neuentwicklung

## Precursors

Um das Projekt zu kompilieren wird [Typescript](http://www.typescriptlang.org)
(`npm install -g typescript`) benötigt.

Der Modulloader [require.js](http://www.requirejs.org/) ist bereits im Repo
vorhanden.

## Kompilieren

Wahlweise in VSCode `Strg+Umschalt+B` oder in einem Terminal im Codeverzeichnis
`tsc` ausführen.

## Ausführen

Mittels `python3 -m http.server` oder etwas vergleichbarem einen HTTP-Server im
Verzeichnis starten und die Seite öffnen.

## Aktuell implementiert

* Modularer Replay-Loader/Parser: Das Replay wird als Objekt auf der Konsole ausgegeben
* App-Loader mit require.js

## TODO

* Basis GUI mit [BabylonJS](http://www.babylonjs.com/)
