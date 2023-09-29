#!/bin/sh

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

: "${SERVICE_NAME:?}"

cd /usr/src/service || exit 1

export NPM_CONFIG_AUDIT=0

if [ ! -d node_modules ]; then
    npm ci --ignore-scripts --userconfig .npmrc.local && npm rebuild && npm run prepare --if-present
else
    npm install --ignore-scripts --userconfig .npmrc.local && npm rebuild && npm run prepare --if-present
fi

if [ ! -d node_modules ]; then
    echo "FATAL: Failed to install dependencies"
    exit 1
fi

npm run start:dev 2>&1 | tee -a "/var/log/${SERVICE_NAME}/${SERVICE_NAME}.log"
