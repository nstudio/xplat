#!/usr/bin/env bash
##################################################
# This shell script is executed by xplat-release.js #
##################################################

VERSION=$1
TAG=$2
PACKAGE_BUILD=build/packages
ORIG_DIRECTORY=`pwd`

for package in $PACKAGE_BUILD/*/
do

  PACKAGE_DIR="$(basename ${package})"
  cd $PACKAGE_BUILD/$PACKAGE_DIR

  PACKAGE_NAME=`node -e "console.log(require('./package.json').name)"`

  echo "Publishing ${PACKAGE_NAME}@${VERSION} --tag ${TAG}"
  npm publish --tag $TAG --access public

  cd $ORIG_DIRECTORY
done

echo "Publishing ${VERSION} complete"
