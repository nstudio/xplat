#!/usr/bin/env bash
##################################################
# This shell script is executed by xplat-release.js #
##################################################

XPLAT_VERSION=$1
PACKAGE_VERSION=$2

if [[ $XPLAT_VERSION == "--local" ]]; then
    XPLAT_VERSION="*"
fi

./scripts/build.sh

cd build/packages

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i "" "s|XPLAT_VERSION|$XPLAT_VERSION|g" create-xplat-workspace/bin/create-xplat-workspace.js
    sed -i "" "s|XPLAT_VERSION|$XPLAT_VERSION|g" xplat/bin/create-xplat-workspace.js

    if [[ $PACKAGE_VERSION =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
      # override package version
      sed -i "" "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$PACKAGE_VERSION';|g" {angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/src/utils/versions.js
      sed -i "" "s|\0.0.1|$PACKAGE_VERSION|g" {schematics,angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/package.json
    else 
      sed -i "" "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$XPLAT_VERSION';|g" {angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/src/utils/versions.js
      sed -i "" "s|\*|$XPLAT_VERSION|g" {schematics,angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/package.json
    fi
else
    sed -i "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$XPLAT_VERSION';|g" {angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/src/utils/versions.js
    sed -i "s|\*|$XPLAT_VERSION|g" {schematics,angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/package.json
    sed -i "s|XPLAT_VERSION|$XPLAT_VERSION|g" create-xplat-workspace/bin/create-xplat-workspace.js
    sed -i "s|XPLAT_VERSION|$XPLAT_VERSION|g" xplat/bin/create-xplat-workspace.js
fi

if [[ $XPLAT_VERSION == "*" ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [[ $PACKAGE_VERSION =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
          # override package version
          sed -E -i "" "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"$PACKAGE_VERSION\"/" {angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/package.json
        else 
          sed -E -i "" "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"file:..\/\1\"/" {angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/package.json
        fi
    else
        sed -E -i "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"file:..\/\1\"/" {angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat}/package.json
    fi
fi

# tar -czf schematics.tgz schematics
# tar -czf create-xplat-workspace.tgz create-xplat-workspace
