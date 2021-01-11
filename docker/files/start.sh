#!/usr/bin/env bash
#
# Grafana startup script

HAPPYGEARS_DIR="/happygears"

GRAFANA_HOME_DIR="/opt/grafana"
GRAFANA_PLUGINS_DIR="$GRAFANA_HOME_DIR/plugins/"
GRAFANA_PROVISIONING_DIR="$GRAFANA_HOME_DIR/provisioning"
GRAFANA_DATASOURCES_DIR="${GRAFANA_PROVISIONING_DIR}/datasources"
SRC_PLUGINS_DIR="${HAPPYGEARS_DIR}/plugins/"

cd ${HAPPYGEARS_DIR}

set -x

id -a

mkdir -p ${GRAFANA_PLUGINS_DIR}
mkdir -p ${GRAFANA_DATASOURCES_DIR}

# copy plugins that come with the image to Grafana plugins directory to install and upgrade them

echo "### Generate Grafana datasources.yaml from template ..."
perl -pe 's{@(\w+)@}{$ENV{$1} // $&}ge' < ${SRC_PLUGINS_DIR}/grafana-datasources.yaml > ${GRAFANA_DATASOURCES_DIR}/datasources.yaml

cp -r ${SRC_PLUGINS_DIR}/* ${GRAFANA_PLUGINS_DIR}
chown -R grafana ${GRAFANA_PLUGINS_DIR}      || true   # if it is read-only because it is mounted as docker config

#ls -lad ${GRAFANA_PLUGINS_DIR}
#
#mkdir -p ${GRAFANA_PROVISIONING_DIR}
#
#ls -laR ${GRAFANA_PROVISIONING_DIR}
#
#chown -R grafana.grafana ${GRAFANA_PROVISIONING_DIR} || true   # if it is read-only because it is mounted as docker config
#cp -r ${HAPPYGEARS_DIR}/grafana/provisioning/*  ${GRAFANA_PROVISIONING_DIR}/ || true

ls -laR ${GRAFANA_PROVISIONING_DIR}/

/post-start-setup.sh &

/run.sh

