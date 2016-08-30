## NetSpyGlass Data source 

## Installation

1. make sure you have latest `node.js`
2. install grunt:  `npm install -g grunt-cli` (see http://gruntjs.com/getting-started )
3. install dependencies: `npm install`
4. run `grunt`. This should build the project and put all generated files in subdirectory `dist`
5. run script `maketar.sh`. This script produces archive `netspyglass-datasource.tar`

Unpack `netspyglass-datasource.tar` in the directory `/var/lib/grafana/plugins/`
on the server where Grafana runs and run `service grafana-server restart`.
 
## Usage

Create new data source in grafana admin panel. 
Then choose NetSpyGlass datasource from the data source type dropdown in the Add Data Source View.
Set Http settings to http://lab.happygears.net:9100.
Use the data source with the proxy connection. Direct connection and Http Auth are not working so far. 

To create a Graph use Grafana menu - Dashboard -> New, then after click on small green block in the left choose Add Panel -> Graph.
After that you will be able to set category and variable to build a Graph.

Tags not working so far too. They are showing categories and not affect on query

### Tested with Grafana 3.1.0
Please, update your grafana-server if you are using previous version 