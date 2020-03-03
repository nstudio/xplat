#!/usr/bin/env bash

mkdir -p tmp/$1
npx --ignore-existing create-nx-workspace@latest $1 --cli nx --preset empty --style scss --directory tmp/$1
printf '@nstudio:registry=http://localhost:4873' > tmp/$1/.npmrc
cd tmp/$1
rm -rf yarn.lock
cd ../..
code tmp/$1

