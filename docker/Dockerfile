
# https://docs.docker.com/engine/reference/builder/

# base image is based on Ubuntu 16.04 and has all dependency packages, latest dev NetSpyGlass and
# Grafana v4.5.2
#

FROM ubuntu:16.04

ENV DEBIAN_FRONTEND noninteractive

ENV HAPPYGEARS_DIR="/happygears"
RUN apt-get -y update && apt-get install -y apt-utils apt-transport-https curl

# Add Grafana repository and gpg key
RUN grep -q grafana /etc/apt/sources.list || \
    echo "deb https://packagecloud.io/grafana/stable/debian/ jessie main" >> /etc/apt/sources.list && \
    curl -s https://packagecloud.io/gpg.key | apt-key add - && \
    apt-get -y update

RUN apt-get install -y apt-utils apt-transport-https curl sqlite3 jq

RUN apt-get install -y grafana

# I want grafana data to be located on the external volume to make it
# persist when the user uprades the container. This includes things that
# I want to be able to upgrade, such as: NSG data source plugin code,
# dashboards, possibly data source configuration.
# Since they are stored on a volume and docker populates the volume with
# data only when the volume is mounted for the first time (and is still empty),
# I can't install data source and dashboards when I build the container. If I did,
# they would get copied to the volume on the first run, but my upgrades would never
# get to the volume on subsequent runs because the volume would not be empty then.
# I have to copy them at the run time.
#
# I could keep in their standard directories (/etc/grafana, /var/lib/grafana) but
# that means I'd need several volumes. It seems easier to put everything in
# one place in /opt/grafana

WORKDIR $HAPPYGEARS_DIR

ENV GRAFANA_VOLUME_DIR="/opt/grafana"
ENV GRAFANA_LOGS_DIR="$GRAFANA_VOLUME_DIR/logs"
ENV GRAFANA_PLUGINS_DIR="$GRAFANA_VOLUME_DIR/plugins/"


COPY docker/files/etc/default/grafana-server     /etc/default/
COPY docker/files/etc/grafana/grafana.ini        $GRAFANA_VOLUME_DIR/

RUN  mkdir -p $GRAFANA_LOGS_DIR && chown -R grafana.grafana $GRAFANA_VOLUME_DIR

COPY dist dist/

RUN PLUGIN_ID=$(jq -r '.["id"]' dist/plugin.json) && \
    mkdir -p ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID} && \
    cp -r dist/* ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID}/


#
#ARG GRAFANA_PLUGIN_TAR=unknown
#RUN echo " ==== Using Grafana plugin: $GRAFANA_PLUGIN_TAR"

#COPY $GRAFANA_PLUGIN_TAR            $HAPPYGEARS_DIR/grafana/plugins/

COPY docker/files/run.sh                         $HAPPYGEARS_DIR/grafana/
COPY docker/files/grafana_dashboards/*           $HAPPYGEARS_DIR/grafana/dashboards/
COPY docker/files/grafana_data_sources/*         $HAPPYGEARS_DIR/grafana/data_sources/

RUN  chmod +x $HAPPYGEARS_DIR/grafana/run.sh
RUN  chown -R grafana.grafana       $GRAFANA_VOLUME_DIR

VOLUME ["$GRAFANA_VOLUME_DIR"]

EXPOSE 3000

CMD exec $HAPPYGEARS_DIR/grafana/run.sh