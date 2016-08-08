## NetSpyGlass Data source 

## Installation

Copy the data source to /public/app/plugins/datasource/. Then restart grafana-server.

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