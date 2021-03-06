#!/bin/bash
set -o errexit  # Exit the script with error if any of the commands fail
set -o xtrace   # Write all commands first to stderr

export PROJECT_DIRECTORY="$(pwd)"
NODE_ARTIFACTS_PATH="${PROJECT_DIRECTORY}/node-artifacts"
export NVM_DIR="${NODE_ARTIFACTS_PATH}/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

npm pack | tee npm-pack.log
export TARBALL_FILENAME="$(tail -n1 npm-pack.log)"
cd /tmp
git clone --depth=10 https://github.com/mongodb-js/mongosh.git
cd mongosh
export REPLACE_PACKAGE="mongodb:${PROJECT_DIRECTORY}/${TARBALL_FILENAME}"
npm run test-nodedriver
