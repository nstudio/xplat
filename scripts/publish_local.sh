#!/usr/bin/env bash
##################################################
# This shell script is executed by xplat-release.js #
##################################################

UNPUBLISH=$1
PACKAGE_BUILD=build/packages
ORIG_DIRECTORY=`pwd`

for package in $PACKAGE_BUILD/*/
do

  PACKAGE_DIR="$(basename ${package})"
  cd $PACKAGE_BUILD/$PACKAGE_DIR

  PACKAGE_NAME=`node -e "console.log(require('./package.json').name)"`

  if [[ $UNPUBLISH == "unpublish" ]]; then
    echo "Unpublishing locally ${PACKAGE_NAME} --registry http://localhost:4873"
    npm unpublish $PACKAGE_NAME --registry http://localhost:4873 --force
  else
    echo "Publishing locally ${PACKAGE_NAME} --registry http://localhost:4873"
    npm publish --force --registry http://localhost:4873
  fi

  cd $ORIG_DIRECTORY
done

echo "Publishing local complete"
