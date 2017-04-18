#!/bin/bash
# Before running, pull the dependency
API_DIR=$TRAVIS_BUILD_DIR/Code/play-rest-api
LIB_DIR=$API_DIR/lib

mkdir -p $LIB_DIR
cd $LIB_DIR
curl "https://stormed.inf.usi.ch/releases/ch/usi/inf/reveal/parsing/stormed-devkit/1.9.6/stormed-devkit-1.9.6.jar" -o "stormed-devkit-1.9.6.jar"
cd $API_DIR
