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

/usr/share/grafana/bin/grafana-cli --pluginsDir ${GRAFANA_PLUGINS_DIR} plugins install grafana-piechart-panel
/usr/share/grafana/bin/grafana-cli --pluginsDir ${GRAFANA_PLUGINS_DIR} plugins install blackmirror1-singlestat-math-panel
/usr/share/grafana/bin/grafana-cli --pluginsDir ${GRAFANA_PLUGINS_DIR} plugins install blackmirror1-statusbygroup-panel
/usr/share/grafana/bin/grafana-cli --pluginsDir ${GRAFANA_PLUGINS_DIR} plugins install natel-plotly-panel

mkdir -p ${GRAFANA_PROVISIONING_DIR}
ls -laR ${GRAFANA_PROVISIONING_DIR}

chown -R grafana.grafana ${GRAFANA_PROVISIONING_DIR} || true   # if it is read-only because it is mounted as docker config

cp -r ${HAPPYGEARS_DIR}/grafana/provisioning/*  ${GRAFANA_PROVISIONING_DIR}/ || true

ls -laR ${GRAFANA_PROVISIONING_DIR}/

/post-start-setup.sh &

/run.sh

