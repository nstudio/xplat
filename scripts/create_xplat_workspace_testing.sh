#!/usr/bin/env bash

mkdir -p tmp/$1
npm_config_registry=http://localhost:4873 npx create-xplat-workspace $1 --directory tmp/$1
printf '@nstudio:registry=http://localhost:4873' > tmp/$1/.npmrc
code tmp/$1

