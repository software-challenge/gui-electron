= Allgemeine Struktur

Es gibt drei Teile, jeweils in einem eigenen Hauptverzeichnis: GUI, API und Viewer.

Die API, zu finden im Verzeichnis api, ist das Backend der Anwendung. Die API teilt sich wiederrum in drei Komponenten auf: Den synchronen Teil (Unterverzeichnis `synchronous`), welcher im Render-Prozess laeuft, den asynchronen Teil (Unterverzeichnis `asynchronous`), welcher in eigenen Prozessen laueft sowie der Regel-Teil (Unterverzeichnis `rules`) welcher die eigentliche Spiellogik enthaelt und von den beiden anderen Teilen verwendet wird.

Die GUI, zu finden im Verzeichnis gui, ist das Benutzerinterface. Es verwendet das GUI Framework React.

Der Viewer, zu finden im Verzeichnis viewer, ist der Teil des Benutzerinferfaces, welcher das eigentliche Spiel darstellt. Er ist in das uebrige Benutzerinterface eingebettet und stellt einen Spielzustand dar. Weiterhin werden Spiel-spezifische Kontrollelemente verwaltet (Eingabe von Zuegen bei menschlichen Spielern, Auswahl der angezeigten Runde, Abspielgeschwindigkeit). Es wird das 3D-Framework Babylon.js verwendet.

TODO: Wie ist der Ablauf, wenn man ein Spiel startet?

= Compile on Save in VSCode

siehe Issue https://github.com/Microsoft/vscode/issues/7015

Diese extension installieren, dann geht das: https://github.com/mrcrowl/vscode/releases

VSCode compiliert den Code dann, sobald man speichert. In der laufenden Anwendung muss man nur F5 druecken, um die Aenderungen zu laden (geht nur, wenn die Entwicklerwerkzeuge aktiv sind, Strg-Shift-I. Laedt die gesamte Anwendung neu).

= Distribution

`yarn dist` aufrufen.

== Moegliche Probleme

*Fehler:* `xorriso: error while loading shared libraries: libreadline.so.6: cannot open shared object file: No such file or directory`

*Loesung:* `export USE_SYSTEM_XORRISO=true`

*Fehler:* `Error: Exit code: ENOENT. spawn xorriso ENOENT`

*Loesung:* xorriso installieren