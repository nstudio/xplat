#!/bin/sh

apt-get update && apt-get install -y curl gnupg rsync git

curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get install -y nodejs

# install yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

apt-get update && apt-get install -y yarn

yarn install --network-timeout 1000000 # Timeout needed for Windows (really slow)
