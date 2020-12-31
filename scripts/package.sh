#!/usr/bin/env bash
##################################################
# This shell script is executed by xplat-release.js #
##################################################

XPLAT_VERSION=$2

# if [[ $XPLAT_VERSION == "--local" ]]; then
#     XPLAT_VERSION="*"
# fi

./scripts/build.sh

cd build/packages

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i "" "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$XPLAT_VERSION';|g" {angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/src/utils/versions.js
    sed -i "" "s|\0.0.1|$XPLAT_VERSION|g" {schematics,angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json

    sed -E -i "" "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"$XPLAT_VERSION\"/" {schematics,angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json
else
    sed -i "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$XPLAT_VERSION';|g" {angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/src/utils/versions.js
    sed -i "s|\0.0.1|$XPLAT_VERSION|g" {schematics,angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json

    sed -E -i "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"$XPLAT_VERSION\"/" {schematics,angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json
fi
