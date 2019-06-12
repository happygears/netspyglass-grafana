# NetSpyGlass data source plugin for Grafana 

This data source enabled Grafana to query metrics collected and stored
by [NetSpyGlass](http://www.netspyglass.com) server.

NetSpyGlass is integrated network mapping and monitoring system that presents live monitoring 
data as series of animated network maps. NetSpyGlass discovers your network using SNMP,
builds a model that represents Layer2 connections and automatically configures itself to 
monitor all aspects of network devices and servers, striving to be useful “out of the box” 
with very little initial configuration and ongoing maintenance. 

Administrator can write Python scripts that run inside of the server
on every polling interval. These scripts operate with monitoring
data and can be used to calculate new metrics derived from the collected "raw" data,
for example various aggregates. Results produced by these scripts become
part of the general data pool and are available for graphing with
Grafana, as well as for alerts and reports.

NetSpyGlass requires little effort to set up and keep up with your network 
as it grows and can scale to thousands of devices and millions of metrics.


## Features

  - Data Source plugin provides a flexible query editor with device, component and tags match
  - Data queries use SQL-like syntax (called [NsgQL](http://docs.netspyglass.com/2.2.x/nsgql.html) )
  - The user can build queries using by choosing variables, matching operators
    and attributes, and other parameters using drop-down lists, or 
    by typing NsgQL query manually
  - Data Source supports Graph, Table, and Singlestat panels
  - Dashboard template variables and ad-hoc filters are supported
  - With this plugin, Grafana makes queries directly to NetSpyGlass
    server to receive lists of available metrics, devices, components
    and tags. This means it is agnostic with respect to the time series
    database used by the NetSpyGlass server and can work with any of 
    them (rrd, graphite, InfluxDb, hbase)
  - 


## Installation

1. clone this git repository
2. run script `./tools/maketar.sh`. This script produces archive `netspyglass-datasource-v2.tar`
3. Copy this archive to the server where Grafana runs and unpack it in 
the directory `/var/lib/grafana/plugins/`, then restart the server with command
`sudo service grafana-server restart`.
4. After the restart, NetSpyGlass should appear in the list of available
 data sources. If your NetSpyGlass server requires user authentication,
 add enable and configure access token. The token is set in NetSpyGlass
 configuration file `nw2.conf` using parameter key `api.accessTokens.grafana`
5. Click "Add" and then "Save and Test" to test communication with
 the server

 

## Screenshots

Data Source configuration:

![datasource configuration](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-edit-data-source.png)

![query editor screenshot](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-query-editor-1.png)

![query editor screenshot](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-query-editor-nsgql.png)

![device dshboard](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-device-dashboard.png)

![graph panel](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-graph-panel.png)

![table panel](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-table-panel.png)

## Minimal supported version of Grafana is 4.4.0

(C) 2019 Happy Gears, Inc  www.happygears.net

Grafana plugin for NetSpyGlass is licensed under the Apache 2.0 License

# Change Log


### v2.0.0
## Tested with Grafana 4.4.0 - this is the minimal required version

1. In this version of the plugin, we have completely changed the approach to getting data from 
   the server, so this version is not compatible with the older ones. The server API was changed to 
   a SQL-like syntax ( [NsgQL](http://docs.netspyglass.com/2.2.x/nsgql.html) ). The query builder is 
   implemented from scratch in a more modern form.


## Tested with Grafana 4.0.1
### v1.0.4

1. fixed regression caused by the switch to lodash 4.x. This bug broke time intervals "today", 
   "yesterday" and others like that.


### v 1.0.3
1. Fixed regression caused by "Grafana" bug [#6912](https://github.com/grafana/grafana/pull/6912) 
that break ability to build queries/fields.


### v 1.0.2

1. fixed bug that prevented the data source from properly fetching graph
data for graphs with fixed time intervals or time intervals in the past,
such as "yesterday" or "day before yesterday"
2. made it possible to use dashboard template variables in "ALIAS BY"
query field.


# Development

1. clone this git repository
2. go to the cloned folder
3. run npm install 
4. 

