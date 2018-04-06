
# https://docs.docker.com/engine/reference/builder/

# base image is based on Ubuntu 16.04 and has all dependency packages, latest dev NetSpyGlass and
# Grafana v4.5.2
#

FROM grafana/grafana

ENV HAPPYGEARS_DIR="/happygears"

RUN apt-get -y update && apt-get install -y jq

WORKDIR $HAPPYGEARS_DIR

ENV GRAFANA_VOLUME_DIR="/opt/grafana"
ENV GRAFANA_LOGS_DIR="$GRAFANA_VOLUME_DIR/logs"
ENV GRAFANA_PLUGINS_DIR="$GRAFANA_VOLUME_DIR/plugins/"

RUN  mkdir -p $GRAFANA_LOGS_DIR && chown -R grafana.grafana $GRAFANA_VOLUME_DIR

COPY dist dist/

RUN PLUGIN_ID=$(jq -r '.["id"]' dist/plugin.json) && \
    mkdir -p ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID} && \
    cp -r dist/* ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID}/

COPY docker/files/start.sh                       /
COPY docker/files/provisioning/dashboards        $HAPPYGEARS_DIR/grafana/provisioning/dashboards/
COPY docker/files/provisioning/datasources       $HAPPYGEARS_DIR/grafana/provisioning/datasources/

#COPY docker/files/grafana_dashboards/*           $HAPPYGEARS_DIR/grafana/dashboards/

RUN  chmod +x /start.sh
RUN  chown -R grafana.grafana       $GRAFANA_VOLUME_DIR

VOLUME ["$GRAFANA_VOLUME_DIR"]

EXPOSE 3000

ENTRYPOINT ["/start.sh"]
