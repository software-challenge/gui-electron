= Compile on Save in VSCode

siehe Issue https://github.com/Microsoft/vscode/issues/7015

Diese extension installieren, dann geht das: https://github.com/mrcrowl/vscode/releases

VSCode compiliert den Code dann, sobald man speichert. In der laufenden Anwendung muss man nur F5 druecken, um die Aenderungen zu laden (laedt die gesamte Anwendung neu).

= Distribution

Fehler: xorriso: error while loading shared libraries: libreadline.so.6: cannot open shared object file: No such file or directory

export USE_SYSTEM_XORRISO=true

Fehler: Error: Exit code: ENOENT. spawn xorriso ENOENT

xorriso installieren