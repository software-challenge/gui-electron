# Replay-Viewer/GUI Neuentwicklung

## Precursors

### NPM

`npm install` installiert die nötigen Module und Typdefinitionen.

## Kompilieren

Wahlweise in VSCode `Strg+Umschalt+B` oder in einem Terminal im Codeverzeichnis
`tsc` ausführen.

## Ausführen

Mittels `python3 -m http.server` oder etwas vergleichbarem einen HTTP-Server im
Verzeichnis starten und die Seite öffnen.

## Testen

Mit `npm test` kann das Projekt getestet werden.
Dabei wird in tsconfig.json eine andere Moduldefinition eingesetzt und danach wieder zurückgesetzt.
Um die Anwendung als Webanwendung ausführen zu können ,muss man das `module`-Attribut in tsconfig.json auf `amd` oder für die Tests auf `commonjs` setzen.
Die Importfunktionen können mit dem node-Modul `jsdom` getestet werden.

## Aktuell implementiert

* Modularer Replay-Loader/Parser: Das Replay wird als Objekt auf der Konsole ausgegeben
* App-Loader mit require.js

## Viewer-Argumente
Ein Viewer wird mit dem Tag `<replay-viewer>` eingebunden. Dabei werden mehrere Argumente unterstützt.

- `replay="file.xml"` Lädt das Replay vom Pfad `file.xml`
- `rerender-control` Aktiviert die Einsparung von Renderzyklen bei Inaktivität
- `debug` Aktiviert das Debug-Display
- `fxaa="n"` Aktiviert n-faches FXAA-Postprocessing. n muss eine natürliche Zahl größer eins sein, z.B `fxaa="4"` für vierfaches Fast-Approximate-Anti-Aliasing

## TODO

* Basis GUI mit [BabylonJS](http://www.babylonjs.com/)
