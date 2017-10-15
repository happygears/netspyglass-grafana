import prunk from 'prunk';
import chai from 'chai';
const jsdom = require("jsdom");
const {JSDOM} = jsdom;


// Mock Grafana modules that are not available outside of the core project
// Required for loading module.js
// prunk.mock('./css/query-editor.css!', 'no css, dude.');
prunk.mock('app/plugins/sdk', {
    QueryCtrl: null,
    loadPluginCss: () => {}
});

// Setup jsdom
// Required for loading angularjs
global.document = new JSDOM('<html><head><script></script></head><body></body></html>');
global.window = global.document.window;
global.window.mocha = {};
global.window.beforeEach = beforeEach;
global.window.afterEach = afterEach;

require('angular/angular');
require('angular-mocks');

global.angular = window.angular;
global.inject = global.angular.mock.inject;
global.ngModule = global.angular.mock.module;
global.assert = chai.assert;
global.expect = chai.expect;
global.NSG_PLUGIN_ID = 'nsg-test';


global.angular.module('grafana', []);
global.angular.module('grafana.directives', []);
