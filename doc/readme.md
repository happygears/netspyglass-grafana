# Development notes

## Installation

1. make sure you have latest `node.js`
2. install grunt:  `npm install -g grunt-cli` (see http://gruntjs.com/getting-started )
3. install dependencies: `npm install`
4. run `grunt`. This should build the project and put all generated files in subdirectory `dist`
5. run script `maketar.sh`. This script produces archive `netspyglass-datasource.tar`

Unpack `netspyglass-datasource.tar` in the directory `/var/lib/grafana/plugins/`
on the server where Grafana runs and restart the server `service grafana-server restart`.
 
## Using Grunt Task Runner with Intellij IDEA

https://www.jetbrains.com/help/idea/2016.2/using-grunt-task-runner.html

