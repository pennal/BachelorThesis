#!/bin/bash
# Before running, pull the dependency
cd $HOME/Code/play-rest-api/lib
curl "https://stormed.inf.usi.ch/releases/ch/usi/inf/reveal/parsing/stormed-devkit/1.9.6/stormed-devkit-1.9.6.jar" -o "stormed-devkit-1.9.6.jar"
cd $HOME/Code/play-rest-api/
