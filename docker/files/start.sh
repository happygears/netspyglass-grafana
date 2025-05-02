#!/usr/bin/env bash
#
# Grafana startup script

HAPPYGEARS_DIR="/happygears"

GRAFANA_HOME_DIR="/var/lib/grafana"
GRAFANA_PLUGINS_DIR="$GRAFANA_HOME_DIR/plugins/"
GRAFANA_PROVISIONING_DIR="/etc/grafana/provisioning"
GRAFANA_DATASOURCES_DIR="${GRAFANA_PROVISIONING_DIR}/datasources"
SRC_PLUGINS_DIR="${HAPPYGEARS_DIR}/plugins/"
FIRST_START_FILE="$GRAFANA_HOME_DIR/.first_start"

cd ${HAPPYGEARS_DIR}

# set -x

id -a

mkdir -p ${GRAFANA_PLUGINS_DIR}
mkdir -p ${GRAFANA_DATASOURCES_DIR}

echo "### generate Grafana datasources.yml from template ..."
perl -pe 's{@(\w+)@}{$ENV{$1} // $&}ge' < ${HAPPYGEARS_DIR}/datasources/grafana-datasources.yml > ${GRAFANA_DATASOURCES_DIR}/datasources.yml

echo "### copy dashboards.yml ..."
cp ${HAPPYGEARS_DIR}/dashboards/dashboards.yml  $GRAFANA_PROVISIONING_DIR/dashboards/dashboards.yml

echo "### stage plugins ..."
cp -r ${SRC_PLUGINS_DIR}* ${GRAFANA_PLUGINS_DIR}
chown -R grafana ${GRAFANA_PLUGINS_DIR}      || true   # if it is read-only because it is mounted as docker config

echo "### contents grafana provisioning directory before post-start:"
ls -laR ${GRAFANA_PROVISIONING_DIR}/
echo "###"


ls -laR ${GRAFANA_DATASOURCES_DIR}/
echo "###"

/post-start-setup.sh &

echo "### attempt to start grafana ..."

/run.sh || {
  echo "### grafana failed to start"
  # attempt to start has failed, perhaps org does not exist yet but files datasources.yml and dashboards.yml
  # need organizations and grafana does not like that.
  # remove files and set global flag to indicate the need for another restart.
  #
  # Note that post-start-setup is still waiting for grafana to start

  touch $FIRST_START_FILE
  rm -f $GRAFANA_PROVISIONING_DIR/datasources/datasources.yml
  rm -f $GRAFANA_PROVISIONING_DIR/dashboards/dashboards.yml
  /run.sh
}

