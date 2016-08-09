'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _, _createClass, GenericDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('GenericDatasource', GenericDatasource = function () {
        function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, GenericDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
        }

        // Called once per panel (graph)


        _createClass(GenericDatasource, [{
          key: 'query',
          value: function query(options) {
            console.log('options');
            console.log(options);
            var query = this.buildQueryParameters(options);
            query.targets = query.targets.filter(function (t) {
              return !t.hide;
            });

            if (query.targets.length <= 0) {
              return this.q.when({ data: [] });
            }
            console.log('query');
            console.log(query);
            var endpoint = '';
            if (typeof query.targets[0].variable !== "undefined" && query.targets[0].variable !== "select variable") {
              endpoint = '/v2/grafana/net/2/query?';
              endpoint += 'name=' + query.targets[0].variable;
              if (typeof query.targets[0].device !== "undefined" && query.targets[0].device !== "select device") {
                endpoint += '&devices=' + query.targets[0].device;
              }
              if (typeof query.targets[0].component !== "undefined" && query.targets[0].component !== "select component") {
                endpoint += '&components=' + query.targets[0].component;
              }
              return this.backendSrv.datasourceRequest({
                url: this.url + endpoint,
                data: query,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
            } else {
              return '';
            }
          }
        }, {
          key: 'testDatasource',
          value: function testDatasource() {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/',
              method: 'GET'
            }).then(function (response) {
              if (response.status === 200) {
                return { status: "success", message: "Data source is working", title: "Success" };
              }
            });
          }
        }, {
          key: 'annotationQuery',
          value: function annotationQuery(options) {
            var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
            var annotationQuery = {
              range: options.range,
              annotation: {
                name: options.annotation.name,
                datasource: options.annotation.datasource,
                enable: options.annotation.enable,
                iconColor: options.annotation.iconColor,
                query: query
              },
              rangeRaw: options.rangeRaw
            };

            return this.backendSrv.datasourceRequest({
              url: this.url + '/annotations',
              method: 'POST',
              data: annotationQuery
            }).then(function (result) {
              return result.data;
            });
          }
        }, {
          key: 'metricFindCategoryQuery',
          value: function metricFindCategoryQuery(options) {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/v2/grafana/net/2/catalog/categories/list',
              data: options,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).then(this.mapToTextValue);
          }
        }, {
          key: 'metricFindVariableQuery',
          value: function metricFindVariableQuery(options) {
            var endpoint = '/v2/grafana/net/2/catalog/categories/';
            if (options.category !== 'select category') {
              endpoint += options.category;
            }
            return this.backendSrv.datasourceRequest({
              url: this.url + endpoint,
              data: options,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).then(this.mapToTextValue);
          }
        }, {
          key: 'metricFindDeviceQuery',
          value: function metricFindDeviceQuery(options) {
            var endpoint = '/v2/grafana/net/2/catalog/variables/';
            if (options.category !== 'select category' && options.variable !== 'select variable') {
              endpoint += options.variable;
              endpoint += '/devices/list';
            }
            return this.backendSrv.datasourceRequest({
              url: this.url + endpoint,
              data: options,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).then(this.mapToTextValue);
          }
        }, {
          key: 'metricFindComponentQuery',
          value: function metricFindComponentQuery(options) {
            var endpoint = '/v2/grafana/net/2/catalog/variables/';
            if (options.category !== 'select category' && options.variable !== 'select variable') {
              endpoint += options.variable;
              endpoint += '/components/list';
            }
            return this.backendSrv.datasourceRequest({
              url: this.url + endpoint,
              data: options,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).then(this.mapToTextValue);
          }
        }, {
          key: 'metricFindTagQuery',
          value: function metricFindTagQuery(options) {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/v2/grafana/net/2/catalog/categories/list',
              data: options,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).then(this.mapToTextValue);
          }
        }, {
          key: 'mapToTextValue',
          value: function mapToTextValue(result) {
            return _.map(result.data, function (d, i) {
              return { text: d, value: i };
            });
          }
        }, {
          key: 'buildQueryParameters',
          value: function buildQueryParameters(options) {
            var _this = this;

            //remove placeholder targets
            options.targets = _.filter(options.targets, function (target) {
              return target.target !== 'select metric';
            });

            var targets = _.map(options.targets, function (target) {
              return {
                category: _this.templateSrv.replace(target.category),
                variable: _this.templateSrv.replace(target.variable),
                device: _this.templateSrv.replace(target.device),
                component: _this.templateSrv.replace(target.component),
                tag: _this.templateSrv.replace(target.tag),
                refId: target.refId,
                hide: target.hide
              };
            });

            options.targets = targets;

            return options;
          }
        }]);

        return GenericDatasource;
      }());

      _export('GenericDatasource', GenericDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
