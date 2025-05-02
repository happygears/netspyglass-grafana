#!/usr/bin/env bash
#

if ! test -d dist
then
    echo "Run this script at the top level of the directory tree"
    exit 1
fi

DATASOURCE_ID=$(cat dist/plugin.json | jq -r .id)

echo "plugin id: $DATASOURCE_ID"

STAGE_DIR="/var/tmp/netspyglass-grafana/${DATASOURCE_ID}"
rm -rf ${STAGE_DIR}
mkdir -p ${STAGE_DIR}

rsync -avr dist/* ${STAGE_DIR}/

COMMIT=$(git log -1   --pretty=%h)

sed -i.bak "s/\"version\": \"2.0.0\",/\"version\": \"2.0.0-$COMMIT\",/"  ${STAGE_DIR}/plugin.json || exit 1
rm -f ${STAGE_DIR}/plugin.json.bak

tar -cf netspyglass-datasource-v2.tar -C ${STAGE_DIR}/../ --exclude test  ${DATASOURCE_ID}
