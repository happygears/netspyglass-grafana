## NetSpyGlass Data source 

## Installation

1. make sure you have latest node.js
2. install grunt:  http://gruntjs.com/getting-started   `npm install -g grunt-cli`
3. install dependencies: `npm install`
4. run grunt

this should build the project and put all generated files in subdirectory `dist`

Copy contents of the `dist` directory to /public/app/plugins/datasource/ or /var/lib/grafana/plugins/ on the server
where Grafana runs and restart grafana-server.


## Usage

Create new data source in grafana admin panel. 
Then choose NetSpyGlass datasource from the data source type dropdown in the Add Data Source View.
Set Http settings to http://lab.happygears.net:9100.
Use the data source with the proxy connection. Direct connection and Http Auth are not working so far. 

To create a Graph use Grafana menu - Dashboard -> New, then after click on small green block in the left choose Add Panel -> Graph.
After that you will be able to set category and variable to build a Graph.

Devices, Components and Tags not working so far too. They are showing categories and not affect on query because of request mechanism problems

### Tested with Grafana 3.1.0
Please, update your grafana-server if you are using previous version 