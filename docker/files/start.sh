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

# echo "### Generate Grafana datasources.yaml from template ..."
# perl -pe 's{@(\w+)@}{$ENV{$1} // $&}ge' < ${SRC_PLUGINS_DIR}/grafana-datasources.yaml > ${GRAFANA_DATASOURCES_DIR}/datasources.yaml

cp -r ${SRC_PLUGINS_DIR}/* ${GRAFANA_PLUGINS_DIR}
chown -R grafana ${GRAFANA_PLUGINS_DIR}      || true   # if it is read-only because it is mounted as docker config

echo "============ grafana provisioning directory before post-start:"
ls -laR ${GRAFANA_PROVISIONING_DIR}/
echo "============"

/post-start-setup.sh &

/run.sh

