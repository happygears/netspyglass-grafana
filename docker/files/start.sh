#!/usr/bin/env bash
#
# Grafana startup script
echo "### attempt to start grafana ..."

/run.sh || {
    echo "### grafana failed to start"
}