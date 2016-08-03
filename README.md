#Socha Graphical Client

Rebuild of the graphical interface with electron/NodeJS.

## Status
- Electron works with `node-java`
- Minimal work on UI
- Packager works

## TODO
- UI Elements
- Communication with java-server
- Replay-Viewer with interactivity for human players
- Socha-Client-Functionality

## Scripts
- `npm install` Downloads dependencies
- `npm run-script run` Starts the application with the right electron shell version
- `npm run-script package` Packages the application for Linux, Windows and OSX
- `npm run-script clean` Removes packaged versions


- `tar cvf darwin.tar --hard-dereference socha_graphical_client_darwin_x64` Tars the OSX version
