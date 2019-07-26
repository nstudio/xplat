#!/usr/bin/env bash

mkdir -p tmp/$1
npx create-nx-workspace@8.3.0 $1 --preset empty --style scss --directory tmp/$1
printf '@nstudio:registry=http://localhost:4873' > tmp/$1/.npmrc
code tmp/$1

