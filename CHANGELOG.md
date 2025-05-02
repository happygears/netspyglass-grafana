# Changelog

## 2.4.0 (Beta)

Rewrite plugin using react library for supporting new grafana versions.

### v2.0.x

improvements to the query builder dialog, support for new NsgQL functions

### v2.0.0
## Tested with Grafana 4.4.0 - this is the minimal required version

1. In this version of the plugin, we have completely changed the approach to getting data from
   the server, so this version is not compatible with the older ones. The server API was changed to
   a SQL-like syntax ( [NsgQL](http://docs.netspyglass.com/2.2.x/nsgql.html) ). The query builder is
   implemented from scratch in a more modern form.


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
