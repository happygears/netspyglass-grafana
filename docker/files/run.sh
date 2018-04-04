#!/usr/bin/env bash
#
# Grafana startup script

HAPPYGEARS_DIR="/happygears"

GRAFANA_HOME_DIR="/opt/grafana"
GRAFANA_PLUGINS_DIR="$GRAFANA_HOME_DIR/plugins/"

#GRAFANA_DB="$GRAFANA_HOME_DIR/db/grafana.db"
#GRAFANA_DB_JOURNAL="${GRAFANA_HOME_DIR}/db/grafana.db-journal"
#GRAFANA_PLUGIN_TAR="netspyglass-datasource-v2.tar"
#GRAFANA_API_TOKEN="eyJrIjoidGhXcFVHYnZMNEZtYWo5UDVwVlFEWTdOWFJpV2lmcUwiLCJuIjoiZG9ja2VyX3J1biIsImlkIjoxfQ=="

GRAFANA_DASHBOARDS_DIR="$HAPPYGEARS_DIR/grafana/dashboards"
GRAFANA_DATASOURCES_DIR="$HAPPYGEARS_DIR/grafana/data_sources"

INIT_DIR=${GRAFANA_HOME_DIR}/.initialized

mkdir ${INIT_DIR} 2>/dev/null || {
    echo "${INIT_DIR} exsists. Assuming volume ${GRAFANA_HOME_DIR} initialization has already started"
    service grafana-server start
    tail -F ${GRAFANA_HOME_DIR}/logs/grafana.log
    exit 0
}

cd ${HAPPYGEARS_DIR}

ls -la

PLUGIN_ID=$(jq -r '.["id"]' dist/plugin.json) && \
    mkdir -p ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID} && \
    cp -r dist/* ${GRAFANA_PLUGINS_DIR}/${PLUGIN_ID}/

service grafana-server start



echo "SQL_HOST=$SQL_HOST"
echo "SQL_USER=$SQL_USER"

BASE_URL="http://admin:admin@localhost:3000"
CONTENT_TYPE="Content-Type: application/json"

# Initialization of the database takes a while, so we should be patient.
# wait for the server to come up and start to listen on the port.
while :;
do
    curl -s --connect-timeout 10 ${BASE_URL}/api/admin/settings >/dev/null && break
    sleep 10
done


ORG_ID=$(curl -X POST -H ${CONTENT_TYPE} -d '{"name":"netspyglass"}' ${BASE_URL}/api/orgs | \
    jq -r '.["orgId"]')

# Expected response:  {"message":"Organization created","orgId":6}. Use the orgId for the next steps.
echo "Organization created, orgId=$ORG_ID"
test -z "$ORG_ID" && {
    echo "Something went wrong and I could not create Grafana organization"
    exit 1
}

curl -X POST -H ${CONTENT_TYPE} -d '{"loginOrEmail":"admin", "role": "Admin"}' ${BASE_URL}/api/orgs/${ORG_ID}/users

curl -X POST ${BASE_URL}/api/user/using/${ORG_ID}

API_KEY=$(curl -X POST -H ${CONTENT_TYPE} -d '{"name":"apikeycurl", "role": "Admin"}' ${BASE_URL}/api/auth/keys | \
    jq -r '.["key"]')

# response: {"name":"apikeycurl","key":"eyJrIjoiR0ZXZmt1UFc0OEpIOGN5RWdUalBJTllUTk83VlhtVGwiLCJuIjoiYXBpa2V5Y3VybCIsImlkIjo2fQ=="}.

test -z "$API_KEY" && {
    echo "Something went wrong and I could not create API key"
    exit 1
}

echo "API_KEY=$API_KEY"




#
#
#
## update NetSpyGlass datasource plugin by copying it from the "storage" directory in the image
## This ensures that new version of the plugin the image was built with is actually used
##mkdir -p ${GRAFANA_PLUGINS_DIR} && \
##    tar -xf "$HAPPYGEARS_DIR/plugins/$GRAFANA_PLUGIN_TAR" --directory ${GRAFANA_PLUGINS_DIR}
#
#test -f ${GRAFANA_DB} || {
#    echo "Starting Grafana to create database ..."
#    service grafana-server start
#    while test -f ${GRAFANA_DB_JOURNAL}
#    do
#        ls -la ${GRAFANA_DB_JOURNAL}
#        sleep 1
#    done
#    sleep 5
#    service grafana-server stop
#}
#
## do this while Grafana is stopped because database is locked when Grafana is running
#n=$(sqlite3 ${GRAFANA_DB} "SELECT name FROM data_source WHERE name='NetSpyGlass-v2'")
#test -z "$n" && {
#    echo "Configuring default user and api key ..."
#    echo "update user set password = 'cf7e09992bb25e0186db66514b5925ffd3851e479156ce55c7a7195ae016f28aab7444002321d7a29be13dee5f612cd9c472', salt = 'F3FAxVm33R' where login = 'admin_c842df8da7ae';" | \
#         sqlite3 ${GRAFANA_DB} || echo "Failed to add data sources"
#    echo "INSERT INTO 'api_key' VALUES(1,1,'docker_run','2dcfb641b7ade3479bba29c2f483c2cf3e70804f1d2afc6cc1daa093972924670652c1ba0a9a4705e47f3db1c8c82cbe540c','Admin','2017-10-27 04:59:34','2017-10-27 04:59:34');" | \
#         sqlite3 ${GRAFANA_DB} || echo "Failed to add data sources"
#
#    echo "Starting Grafana again ..."
#    service grafana-server start
#    sleep 10
#
#    for data_source_file in $(ls ${GRAFANA_DATASOURCES_DIR}/*.json)
#    do
#        echo -n "Adding $data_source_file ..."
#        curl -s --data @${data_source_file} \
#            -H "Content-Type: application/json" \
#            -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
#            http://localhost:3000/api/datasources
#        echo
#    done
#
#}
#
#echo "Grafana environment variables:"
#env | grep GF_
#
#service grafana-server start
#sleep 10
#
#for dashboard_file in $(ls ${GRAFANA_DASHBOARDS_DIR}/*.json)
#do
#    echo -n "Adding or updating $dashboard_file ..."
#    curl -s --data @${dashboard_file} \
#        -H "Content-Type: application/json" \
#        -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
#        http://localhost:3000/api/dashboards/db
#    echo
#done

service grafana-server start

tail -F ${GRAFANA_HOME_DIR}/logs/grafana.log
