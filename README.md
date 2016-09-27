# NetSpyGlass data source plugin for Grafana 

This data source enabled Grafana to query metrics collected and stored
by [NetSpyGlass](http://www.happygears.net) server.

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

  - Flexible query editor with device, component and tags match
  - Support for the Graph and Table panels
  - Support for Dashboard template variables
  - With this plugin, Grafana makes queries directly to NetSpyGlass
    server to receive lists of available metrics, devices, components
    and tags. This means it is agnostic with respect to the time series
    database used by the NetSpyGlass server and can work with any of 
    them (rrd, graphite, InfluxDb, hbase)
  - 

## Templated dashboards support

Device name, component name or any tag defined in NetSpyGlass can be used
as template variable. For example, this can be used to build an interactive 
dashboard that can display information for a device you choose. Dashboard
makes special query to NetSpyGlass server to receive list of devices. Once
you choose the device, all panels in the dashboard switch to show data
collected from this device. Component names or tags can be used in a similar
way to build interactive dashboards.

## Installation

1. clone this git repository
2. run script `./tools/maketar.sh`. This script produces archive `netspyglass-datasource.tar`

Copy this archive to the server where Grafana runs and unpack it in 
the directory `/var/lib/grafana/plugins/`, then restart the server with command
`sudo service grafana-server restart`.
 

## Screenshots


Example of a graph query that matches metrics by tag "Role.Switch":

![query editor screenshot](https://raw.githubusercontent.com/happygears/netspyglass-grafana/master/doc/screenshots/graph_query_with_tag_match_annotated.png)


Building "top N" report in Grafana table panel (selects top 5):

![top N report](https://raw.githubusercontent.com/happygears/netspyglass-grafana/master/doc/screenshots/top_n_table_panel_editor_annotated.png)

## Tested with Grafana 3.1.1

(C) 2016 Happy Gears, Inc  www.happygears.net

Grafana plugin for NetSpyGlass is licensed under the Apache 2.0 License
