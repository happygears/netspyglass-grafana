#!/usr/bin/env bash
#
# Grafana startup script

HAPPYGEARS_DIR="/happygears"

GRAFANA_HOME_DIR="/opt/grafana"
GRAFANA_PLUGINS_DIR="$GRAFANA_HOME_DIR/plugins/"
GRAFANA_PROVISIONING_DIR="$GRAFANA_HOME_DIR/provisioning"

SRC_PLUGINS_DIR="${HAPPYGEARS_DIR}/plugins/"

cd ${HAPPYGEARS_DIR}

set -x

id -a

mkdir -p ${GRAFANA_PLUGINS_DIR}

cp -r ${SRC_PLUGINS_DIR}/* ${GRAFANA_PLUGINS_DIR}

NSG_PLUGIN_ID=$(jq -r '.["id"]' dist/plugin.json)
mv ${GRAFANA_PLUGINS_DIR}/netspyglass ${GRAFANA_PLUGINS_DIR}/${NSG_PLUGIN_ID}

ls -lad ${GRAFANA_PLUGINS_DIR}

mkdir -p ${GRAFANA_PROVISIONING_DIR}

ls -laR ${GRAFANA_PROVISIONING_DIR}

chown -R grafana.grafana ${GRAFANA_PLUGINS_DIR}      || true   # if it is read-only because it is mounted as docker config
chown -R grafana.grafana ${GRAFANA_PROVISIONING_DIR} || true   # if it is read-only because it is mounted as docker config

cp -r ${HAPPYGEARS_DIR}/grafana/provisioning/*  ${GRAFANA_PROVISIONING_DIR}/ || true

ls -laR ${GRAFANA_PROVISIONING_DIR}/

/post-start-setup.sh &

/run.sh

