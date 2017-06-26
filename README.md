# Replay-Viewer/GUI Neuentwicklung

## Precursors

### NPM

`npm install` installiert die nötigen Module und Typdefinitionen.

## Kompilieren

Wahlweise in VSCode `Strg+Umschalt+B` oder in einem Terminal im Codeverzeichnis
`tsc` ausführen.

## Ausführen

Mittels `npm start` einen HTTP-Server im Verzeichnis starten und die Seite
http://localhost:8000/viewer.html öffnen.

## Aktuell implementiert

## Viewer-Argumente
Ein Viewer wird mit dem Tag `<replay-viewer>` eingebunden. Dabei werden mehrere
Argumente unterstützt.

- `replay="file.xml"` Lädt das Replay vom Pfad `file.xml`
- `rerender-control` Aktiviert die Einsparung von Renderzyklen bei Inaktivität
- `debug` Aktiviert das Debug-Display
- `fxaa="n"` Aktiviert n-faches FXAA-Postprocessing. n muss eine natürliche Zahl größer eins sein, z.B `fxaa="4"` für vierfaches Fast-Approximate-Anti-Aliasing

## TODO

- Feldtypen für `1`, `2`, `Hase`, `Igel`, `Salat`, `Karotte`, `Start`, `Ziel`
- Anzeige für `Karotten`, `Wegpunkte`, `Salat`
- Anzeige für Karten: `Hase`, `Vorwärts`, `Rückwärts`, `Salat`, `Karotten`
- Anzeige für Spielerpositionen (Coloured Orbs)

* Basis GUI mit [BabylonJS](http://www.babylonjs.com/)
