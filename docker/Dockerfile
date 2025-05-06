
# https://docs.docker.com/engine/reference/builder/
# http://docs.grafana.org/installation/docker/
# https://hub.docker.com/r/grafana/grafana/tags/

FROM grafana/grafana:11.6.1-ubuntu

ENV PLUGIN_ID="happygears-netspyglass-datasource-v2"
ENV GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS="${PLUGIN_ID}"
ENV GF_DEFAULT_APP_MODE="development"
ENV GF_PLUGINS_PREINSTALL="vonage-status-panel"

# copy netspyglass plugin code in the image
COPY dist $GF_PATHS_PLUGINS/${PLUGIN_ID}/
COPY docker/files/dashboards /${GF_PATHS_PROVISIONING}/dashboards/

RUN  mkdir -p                                                       $GF_PATHS_PROVISIONING/datasources/
COPY docker/files/provisioning/datasources/grafana-datasources.yml  $GF_PATHS_PROVISIONING/datasources/

RUN  mkdir -p                                                       $GF_PATHS_PROVISIONING/dashboards/
COPY docker/files/provisioning/dashboards/dashboards.yml            $GF_PATHS_PROVISIONING/dashboards/

VOLUME ["$GF_PATHS_DATA"]

EXPOSE 3000

USER grafana

ENTRYPOINT ["/run.sh"]
