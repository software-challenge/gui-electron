## Getting Started

- repository klonen
- yarn und node installieren
- `yarn getserver` ausführen, damit der server im Verzeichnis `server` verfügbar ist (dieser sollte nach einem update des servers wiederholt werden)
- GUI per `yarn start` starten

## Allgemeine Struktur

Es gibt drei Teile, jeweils in einem eigenen Hauptverzeichnis unter `src`: GUI, API und Viewer.

Die API, zu finden im Verzeichnis `api`, ist das Backend der Anwendung. Sie teilt sich wiederrum in drei Komponenten auf: Den synchronen Teil (Unterverzeichnis `synchronous`), welcher im Render(-Electron)-Prozess (Client) laeuft, den asynchronen Teil (Unterverzeichnis `asynchronous`), welcher in eigenen Prozessen (NodeJS, Server) laueft sowie der Regel-Teil (Unterverzeichnis `rules`) welcher die eigentliche Spiellogik (und geteilte Interfaces) enthaelt und von den beiden anderen Teilen verwendet wird.

Die GUI, zu finden im Verzeichnis gui, ist das Benutzerinterface. Es verwendet das GUI Framework React und laeuft in Electron, sollte aber auch weitestgehend in einem Browser laufen.

Der Viewer, zu finden im Verzeichnis viewer, ist der Teil des Benutzerinferfaces, welcher das eigentliche Spiel darstellt. Er ist in das uebrige Benutzerinterface eingebettet und stellt einen Spielzustand dar. Weiterhin werden Spiel-spezifische Kontrollelemente verwaltet (Eingabe von Zuegen bei menschlichen Spielern, Auswahl der angezeigten Runde, Abspielgeschwindigkeit). Es wird das 3D-Framework Babylon.js verwendet.

TODO: Wie ist der Ablauf, wenn man ein Spiel startet?

Da die Anwendung in mehreren Prozessen laeuft (Render-Thread und mehrere Node.js Worker) werden nicht alle Fehler/Lognachrichten in der Dev Tools-Console ausgegeben, sondern auch einige im Terminal.

## Compile on Save in VSCode

> Siehe Issue https://github.com/Microsoft/vscode/issues/7015

Diese extension installieren, dann geht das: https://github.com/mrcrowl/vscode/releases

VSCode compiliert den Code dann, sobald man speichert. In der laufenden Anwendung muss man nur F5 druecken, um die Aenderungen zu laden (geht nur, wenn die Entwicklerwerkzeuge aktiv sind, Strg-Shift-I. Laedt die gesamte Anwendung neu).

## Distribution

`yarn dist` baut ein Paket für das aktuelle Betriebssystem im Verzeichnis `dist`, während `dist-all` Pakete für Windows, Linux und macOS baut. Der Dateiname enthaelt die Versionsnummer aus `package.json`, diese sollte dort also vorher richtig eingestellt werden. Für Releases sollte auch ein entsprechendes Git Tag angelegt werden, damit man es später zuordnen kann.

Es wird auch immer ein Game Server mit in den Release gepackt. Dieser sollte vorher ebenfalls mit der version getaggt werden. Er wird aus dem `server`-Verzeichnis genommen und kann dahin durch `yarn getserver` initialisiert und aktualisiert werden.

### Moegliche Probleme

*Fehler:* `xorriso: error while loading shared libraries: libreadline.so.6: cannot open shared object file: No such file or directory`

*Loesung:* `export USE_SYSTEM_XORRISO=true`

*Fehler:* `Error: Exit code: ENOENT. spawn xorriso ENOENT`

*Loesung:* xorriso installieren
