#!/usr/bin/env bash
#
# Grafana startup script

HAPPYGEARS_DIR="/happygears"

GRAFANA_HOME_DIR="/opt/grafana"
GRAFANA_PLUGINS_DIR="$GRAFANA_HOME_DIR/plugins/"
GRAFANA_PROVISIONING_DIR="$GRAFANA_HOME_DIR/provisioning"

cd ${HAPPYGEARS_DIR}

set -x
set -e

id -a

PLUGIN_ID=$(jq -r '.["id"]' dist/plugin.json) && \
    mkdir -p ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID} && \
    cp -r dist/* ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID}/

mkdir -p ${GRAFANA_PROVISIONING_DIR}
ls -laR ${GRAFANA_PROVISIONING_DIR}

#chown -R grafana.grafana ${GRAFANA_PROVISIONING_DIR}
#cp -r ${HAPPYGEARS_DIR}/grafana/provisioning/*  ${GRAFANA_PROVISIONING_DIR}/
#
#ls -laR ${GRAFANA_PROVISIONING_DIR}/

/run.sh
