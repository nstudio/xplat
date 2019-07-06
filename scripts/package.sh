#!/usr/bin/env bash
##################################################
# This shell script is executed by xplat-release.js #
##################################################

XPLAT_VERSION=$1
ANGULAR_CLI_VERSION=$2
TYPESCRIPT_VERSION=$3

if [[ $XPLAT_VERSION == "--local" ]]; then
    XPLAT_VERSION="*"
fi

./scripts/build.sh

cd build/packages

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i "" "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$XPLAT_VERSION';|g" {angular,electron,ionic,nativescript,web,workspace}/src/utils/versions.js
    sed -i "" "s|\*|$XPLAT_VERSION|g" {angular,electron,ionic,nativescript,web,workspace}/package.json
    sed -i "" "s|XPLAT_VERSION|$XPLAT_VERSION|g" create-xplat-workspace/bin/create-xplat-workspace.js
    sed -i "" "s|ANGULAR_CLI_VERSION|$ANGULAR_CLI_VERSION|g" create-xplat-workspace/bin/create-xplat-workspace.js
    sed -i "" "s|TYPESCRIPT_VERSION|$TYPESCRIPT_VERSION|g" create-xplat-workspace/bin/create-xplat-workspace.js
    sed -i "" "s|XPLAT_VERSION|$XPLAT_VERSION|g" workspace/bin/create-xplat-workspace.js
    sed -i "" "s|ANGULAR_CLI_VERSION|$ANGULAR_CLI_VERSION|g" workspace/bin/create-xplat-workspace.js
    sed -i "" "s|TYPESCRIPT_VERSION|$TYPESCRIPT_VERSION|g" workspace/bin/create-xplat-workspace.js
else
    sed -i "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$XPLAT_VERSION';|g" {angular,electron,ionic,nativescript,web,workspace}/src/utils/versions.js
    sed -i "s|\*|$XPLAT_VERSION|g" {angular,electron,ionic,nativescript,web,workspace}/package.json
    sed -i "s|XPLAT_VERSION|$XPLAT_VERSION|g" create-xplat-workspace/bin/create-xplat-workspace.js
    sed -i "s|ANGULAR_CLI_VERSION|$ANGULAR_CLI_VERSION|g" create-xplat-workspace/bin/create-xplat-workspace.js
    sed -i "s|TYPESCRIPT_VERSION|$TYPESCRIPT_VERSION|g" create-xplat-workspace/bin/create-xplat-workspace.js
    sed -i "s|XPLAT_VERSION|$XPLAT_VERSION|g" workspace/bin/create-xplat-workspace.js
    sed -i "s|ANGULAR_CLI_VERSION|$ANGULAR_CLI_VERSION|g" workspace/bin/create-xplat-workspace.js
    sed -i "s|TYPESCRIPT_VERSION|$TYPESCRIPT_VERSION|g" workspace/bin/create-xplat-workspace.js
fi

if [[ $XPLAT_VERSION == "*" ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -E -i "" "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"file:..\/\1\"/" {angular,electron,ionic,nativescript,web,workspace}/package.json
    else
        sed -E -i "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"file:..\/\1\"/" {angular,electron,ionic,nativescript,web,workspace}/package.json
    fi
fi

tar -czf nx.tgz nx
tar -czf schematics.tgz schematics
tar -czf create-xplat-workspace.tgz create-xplat-workspace
