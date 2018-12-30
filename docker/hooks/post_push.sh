#!/usr/bin/env bash
#
# This is docker post_push hook script
# see https://docs.docker.com/docker-hub/builds/advanced/
#
# Docker sets several env. variables when it calls this script. DOCKERFILE_PATH and IMAGE_NAME
# are just two out of this set

echo "------ post_push hook script -------------------------------------------"

DOCKERFILE_PATH=${DOCKERFILE_PATH:?"Variable DOCKERFILE_PATH must be defined"}
DOCKER_REPO=${DOCKER_REPO:?"Variable DOCKER_REPO must be defined"}
IMAGE_NAME=${IMAGE_NAME:?"Variable IMAGE_NAME must be defined"}

# docker tag for this image consists of two parts: (grafana_version)-nsg-ds-(data_source_version)
#
# grafana version is the same as the version of the base image our image is derived from.
# It comes from Dockerfile.
# NSG data source plugin version can be found in dist/plugin.json , key info.version
#
# IMAGE_NAME already has the tag but we need to override it
#

grafana_version=$(cat ${DOCKERFILE_PATH} | awk -F: '/FROM grafana\/grafana/ { print $2; }')
plugin_version=$(cat dist/plugin.json | python -c 'import sys, json; print json.load(sys.stdin)["info"]["version"]')

TAG=${grafana_version}-nsg-ds-${plugin_version}

echo "Grafana version: $grafana_version , NSG data source plugin version: $plugin_version"
echo

docker tag ${IMAGE_NAME} ${DOCKER_REPO}:${TAG}
docker push ${DOCKER_REPO}:${TAG}

