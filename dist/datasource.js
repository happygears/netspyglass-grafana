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
                    this.networkId = instanceSettings.jsonData.networkId;
                    this.accessToken = instanceSettings.jsonData.useToken !== false && instanceSettings.jsonData.accessToken !== undefined && instanceSettings.jsonData.accessToken !== '' ? '?access_token=' + instanceSettings.jsonData.accessToken : '';
                }

                // Called once per panel (graph)


                _createClass(GenericDatasource, [{
                    key: 'query',
                    value: function query(options) {
                        var query = this.buildQueryParameters(options);
                        query.targets = query.targets.filter(function (t) {
                            return !t.hide;
                        });

                        if (query.targets.length <= 0) {
                            return this.q.when({ data: [] });
                        }
                        var endpoint = '';

                        function isCategorySet(target) {
                            return typeof target.category !== "undefined" && target.category !== "select category" && typeof target.variable !== "undefined" && target.variable !== "select variable";
                        }

                        if (query.targets.filter(isCategorySet).length > 0) {
                            var targetsLoop = function targetsLoop(item, index) {
                                var temp = {};
                                if (typeof item.variable !== "undefined" && item.variable !== "select variable" && item.variable !== "-- clear selection --") {
                                    temp.variable = item.variable;
                                }
                                if (typeof item.device !== "undefined" && item.device !== "select device" && item.device !== "-- clear selection --") {
                                    temp.device = item.device;
                                }
                                if (typeof item.component !== "undefined" && item.component !== "select component" && item.component !== "-- clear selection --") {
                                    temp.component = item.component;
                                }
                                if (typeof item.sortByEl !== "undefined" && item.sortByEl !== "select sorting") {
                                    if (item.sortByEl == 'ascending') {
                                        temp.sortBy = 'curr.asc';
                                    }
                                    if (item.sortByEl == 'descending') {
                                        temp.sortBy = 'curr.desc';
                                    }
                                }
                                if (typeof item.selector !== "undefined" && item.selector !== "select selector") {
                                    temp.selector = item.selector;
                                }
                                if (typeof item.limit !== "undefined" && item.limit !== "select limit") {
                                    temp.limit = item.limit;
                                }
                                if (typeof item.tagFacet !== "undefined" && item.tagFacet !== "select tag facet" && item.tagFacet !== "-- clear selection --" && typeof item.tagOperation !== "undefined" && typeof item.tagWord !== "undefined" && item.tagWord !== "select tag name" && item.tagWord !== "-- clear selection --") {
                                    var tagsLoop = function tagsLoop(singleItem, index) {
                                        if (typeof singleItem.tagFacet !== "undefined" && singleItem.tagFacet !== "" && typeof singleItem.tagWord !== "undefined" && singleItem.tagWord !== "") {
                                            result.push({
                                                tagFacet: singleItem.tagFacet,
                                                tagOperation: singleItem.tagOperation,
                                                tagWord: singleItem.tagWord
                                            });
                                        }
                                    };

                                    var result = [];
                                    item.tagData.forEach(tagsLoop);


                                    temp.tags = result;
                                }
                                queryObject.targets.push(temp);
                            };

                            endpoint = '/v2/grafana/net/' + this.networkId + '/query' + this.accessToken;

                            var queryObject = {
                                targets: [],
                                from: "-6h",
                                until: "now"
                            };

                            query.targets.forEach(targetsLoop);

                            queryObject.from = query.rangeRaw.from;
                            queryObject.until = query.rangeRaw.to;
                            var data = JSON.stringify(queryObject);
                            console.log(data);
                            console.log(endpoint);

                            return this.backendSrv.datasourceRequest({
                                url: this.url + endpoint,
                                data: data,
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
                        var endpoint = '/v2/grafana/net/' + this.networkId + '/test' + this.accessToken;

                        return this.backendSrv.datasourceRequest({
                            url: this.url + endpoint,
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
                            url: this.url + '/annotations' + this.accessToken,
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
                            url: this.url + '/v2/grafana/net/' + this.networkId + '/catalog/categories/list' + this.accessToken,
                            data: options,
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        }).then(this.mapToTextValue);
                    }
                }, {
                    key: 'metricFindVariableQuery',
                    value: function metricFindVariableQuery(options) {
                        var endpoint = '/v2/grafana/net/' + this.networkId + '/catalog/categories/';
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
                        var endpoint = '';
                        if (options.category !== 'select category' && options.variable !== 'select variable') {
                            endpoint = '/v2/grafana/net/' + this.networkId + '/catalog/devices' + this.accessToken + '&name=' + options.variable;
                            if (options.component !== 'select component') {
                                endpoint += '&components=' + options.component;
                            }
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
                        var endpoint = '';
                        if (options.category !== 'select category' && options.variable !== 'select variable') {
                            endpoint = '/v2/grafana/net/' + this.networkId + '/catalog/components' + this.accessToken + '&name=' + options.variable;
                            if (options.device !== 'select device') {
                                endpoint += '&devices=' + options.device;
                            }
                        }

                        return this.backendSrv.datasourceRequest({
                            url: this.url + endpoint,
                            data: options,
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        }).then(this.mapToTextValue);
                    }
                }, {
                    key: 'metricFindTagFacetQuery',
                    value: function metricFindTagFacetQuery(options) {
                        var endpoint = '';
                        if (options.category !== 'select category' && options.variable !== 'select variable') {
                            endpoint = '/v2/grafana/net/' + this.networkId + '/catalog/tags/facets' + this.accessToken + '&name=' + options.variable;
                            if (options.device !== 'select device') {
                                endpoint += '&devices=' + options.device;
                            }
                            if (options.component !== 'select component') {
                                endpoint += '&components=' + options.component;
                            }
                        }

                        return this.backendSrv.datasourceRequest({
                            url: this.url + endpoint,
                            data: options,
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        }).then(this.mapToTextValue);
                    }
                }, {
                    key: 'metricFindTagOperationQuery',
                    value: function metricFindTagOperationQuery(options) {
                        var endpoint = '';
                        if (options.category !== 'select category' && options.variable !== 'select variable') {
                            endpoint = '/v2/grafana/net/' + this.networkId + '/catalog/tags/facets' + this.accessToken + '&name=' + options.variable;
                            if (options.device !== 'select device') {
                                endpoint += '&devices=' + options.device;
                            }
                            if (options.component !== 'select component') {
                                endpoint += '&components=' + options.component;
                            }
                        }

                        return this.backendSrv.datasourceRequest({
                            url: this.url + endpoint,
                            data: options,
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        }).then(this.mapToTextValue);
                    }
                }, {
                    key: 'metricFindTagWordQuery',
                    value: function metricFindTagWordQuery(options) {
                        var endpoint = '';
                        if (options.category !== 'select category' && options.variable !== 'select variable' && options.tagFacet !== 'select tag facet') {
                            endpoint = '/v2/grafana/net/' + this.networkId + '/catalog/tags/' + options.tagFacet + this.accessToken + '&name=' + options.variable;
                            if (options.device !== 'select device') {
                                endpoint += '&devices=' + options.device;
                            }
                            if (options.component !== 'select component') {
                                endpoint += '&components=' + options.component;
                            }
                        }

                        return this.backendSrv.datasourceRequest({
                            url: this.url + endpoint,
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

                        var targets = _.map(options.targets, function (target) {
                            return {
                                category: _this.templateSrv.replace(target.category),
                                variable: _this.templateSrv.replace(target.variable),
                                device: _this.templateSrv.replace(target.device),
                                component: _this.templateSrv.replace(target.component),
                                sortByEl: _this.templateSrv.replace(target.sortByEl),
                                selector: _this.templateSrv.replace(target.selector),
                                limit: _this.templateSrv.replace(target.limit),
                                tagFacet: _this.templateSrv.replace(target.tagFacet),
                                tagOperation: _this.templateSrv.replace(target.tagOperation),
                                tagWord: _this.templateSrv.replace(target.tagWord),
                                refId: target.refId,
                                hide: target.hide,
                                tagData: target.tagData
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
