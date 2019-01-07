<p align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://www.software-challenge.de"><img width="128" src="https://raw.githubusercontent.com/CAU-Kiel-Tech-Inf/socha-gui/master/assets/build-resources/icon.png" alt="Software-Challenge Germany logo"></a>
</p>

<p align="center">
  <a href="https://travis-ci.com/CAU-Kiel-Tech-Inf/socha-gui" rel="nofollow"><img src="https://travis-ci.com/CAU-Kiel-Tech-Inf/socha-gui.svg?branch=master" alt="Build Status"></a>
</p>

<h1 align="center">Server GUI for Software-Challenge Germany</h1>

## Getting Started

- repository klonen
- yarn und node installieren
- `yarn compileserver` ausführen, damit der server im Verzeichnis `server` verfügbar wird (dieser Schritt muss zum updaten des servers wiederholt werden)
- GUI per `yarn start` starten

## Allgemeine Struktur

Es gibt drei Teile, jeweils in einem eigenen Hauptverzeichnis unter [src](src) GUI, API und Viewer.

Die API, zu finden im Verzeichnis [api](src/api), ist das Backend der Anwendung. Sie teilt sich wiederrum in drei Komponenten auf: Den synchronen Teil (Unterverzeichnis [synchronous](src/api/synchronous)), welcher im Render(-Electron)-Prozess (Client) laeuft, den asynchronen Teil (Unterverzeichnis [asynchronous](src/api/asynchronous)), welcher in eigenen Prozessen (NodeJS, Server) laueft sowie der Regel-Teil (Unterverzeichnis [rules](src/api/rules)) welcher die eigentliche Spiellogik (und geteilte Interfaces) enthaelt und von den beiden anderen Teilen verwendet wird.

Die GUI, zu finden im Verzeichnis [gui](src/gui), ist das Benutzerinterface. Es verwendet das Javascript Framework React und laeuft in Electron, sollte aber auch weitestgehend in einem Browser laufen koennen.

Der Viewer, zu finden im Verzeichnis [viewer](src/viewer), ist der Teil des Benutzerinferfaces, welcher das eigentliche Spiel darstellt. Er ist in das uebrige Benutzerinterface eingebettet und stellt einen Spielzustand dar. Weiterhin werden Spiel-spezifische Kontrollelemente verwaltet (Eingabe von Zuegen bei menschlichen Spielern, Auswahl der angezeigten Runde, Abspielgeschwindigkeit). Dabei wird das 3D-Framework Babylon.js verwendet.

Wenn man ein neues Spiel erstellt, sieht man zuerst den [GameCreation](src/gui/GameCreation.tsx) screen. Bei einem Klick auf `Start!` ruft dieser dann in [App](src/gui/App.tsx) die Methode `startGameWithOptions` auf, welche über den [GameManager](src/api/synchronous/GameManager.ts) die Methode `createGameWithOptions` im [GameManagerWorkerInterface](src/api/synchronous/GameManagerWorkerInterface.ts) aufruft. Diese sendet dann die [GameCreationOptions](src/api/rules/GameCreationOptions.ts) als JSON an den Server.  
Der [AsyncGameManager](src/api/asynchronous) empfängt diese über die Route `/start-game` und startet je nach Konfiguration ein neues [LiveGame](src/api/asynchronous/LiveGame.ts) oder ein [Replay](src/api/asynchronous/Replay.ts) mit der übermittelten `gameId`. Wenn alles klappt, sendet er die `gameId` wieder als JSON zurück. Sobald diese Antwort gekommen ist, ruft die [App](src/gui/App.tsx) `showGame` mit der empfangenen `gameId` auf, wodurch das [Game](src/gui/Game.tsx) dann angezeigt wird.

Da die Anwendung in mehreren Prozessen laeuft (Render-Thread und mehrere Node.js Worker) werden nicht alle Fehler/Lognachrichten in der Dev Tools-Console ausgegeben, sondern auch einige im Terminal.

## Compile on Save in VSCode

> Siehe Issue https://github.com/Microsoft/vscode/issues/7015

Diese extension installieren, dann geht das: https://github.com/mrcrowl/vscode/releases

VSCode compiliert den Code dann, sobald man speichert. In der laufenden Anwendung muss man nur F5 druecken, um die Aenderungen zu laden (geht nur, wenn die Entwicklerwerkzeuge aktiv sind, Strg-Shift-I. Laedt die gesamte Anwendung neu).

## Distribution

`yarn dist` baut ein Paket für das aktuelle Betriebssystem im Verzeichnis `dist`, während `dist-all` Pakete für Windows, Linux und macOS baut. Der Dateiname enthält die Versionsnummer aus `package.json`, diese sollte also vorher dort richtig eingestellt werden. Für Releases sollte auch ein entsprechendes Git Tag angelegt werden, damit man es später zuordnen kann.

Es wird auch immer ein Game Server mit in den Release gepackt. Dieser sollte vorher ebenfalls mit der version getaggt werden. Er wird aus dem `server`-Verzeichnis genommen und kann dahin durch `yarn compileserver` initialisiert und aktualisiert werden.

### Moegliche Probleme

*Fehler:* `xorriso: error while loading shared libraries: libreadline.so.6: cannot open shared object file: No such file or directory`

*Loesung:* `export USE_SYSTEM_XORRISO=true`

*Fehler:* `Error: Exit code: ENOENT. spawn xorriso ENOENT`

*Loesung:* xorriso installieren
