#!/bin/bash

for file in bin/code/*
do
  if [[ $(basename ${file%.*}) == "replay-viewer" || $(basename ${file%.*}) == "replay-viewer.js" ]]
  then
    echo "skipping $file"
  else
    echo "copying $file"
    cp "$file" ../socha-final-2017/public/replay_viewer/code
  fi
done
cp viewer.css ../socha-final-2017/public/replay_viewer

