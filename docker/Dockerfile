
# https://docs.docker.com/engine/reference/builder/
#
# base image is based on debian:stretch-slim
#
# See:
#
# http://docs.grafana.org/installation/docker/
# https://github.com/grafana/grafana/blob/master/packaging/docker/Dockerfile
#
# https://hub.docker.com/r/grafana/grafana/tags/

FROM grafana/grafana:5.4.3

ENV HAPPYGEARS_DIR="/happygears"

USER root
RUN apt-get update && apt-get install -qq -y jq

WORKDIR $HAPPYGEARS_DIR

ENV GRAFANA_VOLUME_DIR="/opt/grafana"
ENV GRAFANA_LOGS_DIR="$GRAFANA_VOLUME_DIR/logs"
ENV GRAFANA_PLUGINS_DIR="$GRAFANA_VOLUME_DIR/plugins/"

RUN  mkdir -p $GRAFANA_LOGS_DIR

# install all plugins in /happygears/plugins, to be copied to /opt/grafana/plugins by the startup script.
# This way, the container won't make a call to Grafana plugins repository every time it starts.

RUN mkdir -p $HAPPYGEARS_DIR/plugins

# copy netspyglass plugin code to a temporary location in the image
COPY dist dist/

# copy netspyglass plugin to its final location in the image. The difference is that directory name
# conforms to Grafana plugin naming convention

RUN PLUGIN_ID=$(jq -r '.["id"]' dist/plugin.json) && \
    mkdir -p $HAPPYGEARS_DIR/plugins/${PLUGIN_ID} && \
    cp -r dist/* $HAPPYGEARS_DIR/plugins/${PLUGIN_ID} && \
    rm -rf dist

RUN grafana-cli --pluginsDir $HAPPYGEARS_DIR/plugins/ plugins install grafana-worldmap-panel
RUN grafana-cli --pluginsDir $HAPPYGEARS_DIR/plugins/ plugins install grafana-piechart-panel
RUN grafana-cli --pluginsDir $HAPPYGEARS_DIR/plugins/ plugins install blackmirror1-singlestat-math-panel
RUN grafana-cli --pluginsDir $HAPPYGEARS_DIR/plugins/ plugins install vonage-status-panel
RUN grafana-cli --pluginsDir $HAPPYGEARS_DIR/plugins/ plugins install natel-plotly-panel

# provisioning files (both datasource and dashboards) must exist before Grafana starts
# but actual dashboards can be added later. Once Grafana sees dashboards provisioning file,
# it begins to monitor the directory and loads dashboards when they appear in it.

COPY docker/files/start.sh            /
COPY docker/files/post-start-setup.sh /

RUN  chmod +x /start.sh
RUN  chmod +x /post-start-setup.sh
RUN  chown -R grafana.grafana       $GRAFANA_VOLUME_DIR
RUN  mkdir -p                       $HAPPYGEARS_DIR/grafana/provisioning/
RUN  chown -R grafana.grafana       $HAPPYGEARS_DIR/grafana/provisioning/

VOLUME ["$GRAFANA_VOLUME_DIR"]

EXPOSE 3000

USER grafana

ENTRYPOINT ["/start.sh"]
