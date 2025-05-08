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

## Screenshots

Data Source configuration:

![datasource configuration](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-edit-data-source.png)

![query editor screenshot](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-query-editor-1.png)

![query editor screenshot](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-query-editor-nsgql.png)

![device dshboard](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-device-dashboard.png)

![graph panel](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-graph-panel.png)

![table panel](https://raw.githubusercontent.com/happygears/netspyglass-grafana/v2.0.x/doc/screenshots/nsg-grafana-plugin-v2-table-panel.png)

## Minimal supported version of Grafana is >= 10.4.0

(C) 2025 Zscaler, Inc, www.zscaler.com www.happygears.net

Grafana plugin for NetSpyGlass is licensed under the Apache 2.0 License

# Change Log

### v3.0.0

New major version of plugin rewritten in react for supporting Grafana 10.x versions.
