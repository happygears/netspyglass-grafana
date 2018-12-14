
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

FROM grafana/grafana:5.2.3

ENV HAPPYGEARS_DIR="/happygears"

USER root
RUN apt-get update && apt-get install -qq -y jq

WORKDIR $HAPPYGEARS_DIR

ENV GRAFANA_VOLUME_DIR="/opt/grafana"
ENV GRAFANA_LOGS_DIR="$GRAFANA_VOLUME_DIR/logs"
ENV GRAFANA_PLUGINS_DIR="$GRAFANA_VOLUME_DIR/plugins/"

RUN  mkdir -p $GRAFANA_LOGS_DIR && chown -R grafana.grafana $GRAFANA_VOLUME_DIR

COPY dist dist/

RUN PLUGIN_ID=$(jq -r '.["id"]' dist/plugin.json) && \
    mkdir -p ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID} && \
    cp -r dist/* ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID}/

# provisioning files (both datasource and dashboards) must exist before Grafana starts
# but actual dashboards can be added later. Once Grafana sees dashboards provisioning file,
# it begins to monitor the directory and loads dashboards when they appear in it.

COPY docker/files/start.sh                       /
COPY docker/files/post-start-setup.sh            /
#COPY docker/files/provisioning/dashboards        $HAPPYGEARS_DIR/grafana/provisioning/dashboards/
#COPY docker/files/provisioning/datasources       $HAPPYGEARS_DIR/grafana/provisioning/datasources/

RUN  chmod +x /start.sh
RUN  chmod +x /post-start-setup.sh
RUN  chown -R grafana.grafana       $GRAFANA_VOLUME_DIR
RUN  mkdir -p                       $HAPPYGEARS_DIR/grafana/provisioning/
RUN  chown -R grafana.grafana       $HAPPYGEARS_DIR/grafana/provisioning/

VOLUME ["$GRAFANA_VOLUME_DIR"]

EXPOSE 3000

USER grafana

ENTRYPOINT ["/start.sh"]
