#!/usr/bin/env bash

BASIC_AUTH="${GF_SECURITY_ADMIN_USER}:${GF_SECURITY_ADMIN_PASSWORD}"

GRAFANA_PROVISIONING_DIR="/etc/grafana/provisioning"
FIRST_START_FILE="/var/lib/grafana/.first_start"

# wait for Grafana to come up and begin to respond to API queries. It may take longer
# when it starts for the first time because it needs to initialize the database

while :; do
    curl -s -u ${BASIC_AUTH} http://localhost:3000/api/orgs && break
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

response=$(curl -s -X POST -H 'Content-Type: application/json' --data '{"name":"Happy Gears"}' -u ${BASIC_AUTH} http://localhost:3000/api/orgs)

echo "### response: $response"

test -f $FIRST_START_FILE && {
  echo "### This is our first attempt to start grafana, killing container to force exit"
  # this is the first start, since we have created organization already, just kill the container and let
  # docker restart it
  pkill grafana-server
  exit
}

## at this point, two organizations should exist and we can proceed to upload
## dashbords and datasources files that use them
#
#echo "### Generate Grafana datasources.yml from template ..."
#perl -pe 's{@(\w+)@}{$ENV{$1} // $&}ge' < ${HAPPYGEARS_DIR}/datasources/grafana-datasources.yml > $GRAFANA_PROVISIONING_DIR/datasources/datasources.yml
#
#echo "### Copy dashboards.yml ..."
#cp ${HAPPYGEARS_DIR}/dashboards/dashboards.yml  $GRAFANA_PROVISIONING_DIR/dashboards/dashboards.yml

echo "### post-startup script is done "

