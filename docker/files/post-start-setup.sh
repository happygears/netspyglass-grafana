#!/usr/bin/env bash

BASIC_AUTH="${GF_SECURITY_ADMIN_USER}:${GF_SECURITY_ADMIN_PASSWORD}"

# wait for Grafana to come up and begin to respond to API queries. It may take longer
# when it starts for the first time because it needs to initialize the database

while :; do
    curl -u ${BASIC_AUTH} http://localhost:3000/api/orgs && break
    sleep 5
done

# assume that Grafana has come up by now. Create organization "Happy Gears". If this is not
# the first time we start Grafana, this API call fails with error '{"message":"Organization name taken"}'
#
# Since this organization will be created before any other activity is possible when Grafana starts
# for the first time, it should get id=2. This is important because provisioned dashboards get
# assigned to this organization by id
#

echo "### Creating organization 'Happy Gears'"

curl -X POST -H 'Content-Type: application/json' --data '{"name":"Happy Gears"}' -u ${BASIC_AUTH} http://localhost:3000/api/orgs

echo "### Generate Grafana datasources.yaml from template ..."
perl -pe 's{@(\w+)@}{$ENV{$1} // $&}ge' < ${SRC_PLUGINS_DIR}/grafana-datasources.yaml > ${GRAFANA_DATASOURCES_DIR}/datasources.yaml
