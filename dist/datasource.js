'use strict';

System.register(['lodash'], function (_export, _context) {
    "use strict";

    var _, _createClass, NetSpyGlassDatasource;

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

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource = function () {
                function NetSpyGlassDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    _classCallCheck(this, NetSpyGlassDatasource);

                    this.type = instanceSettings.type;
                    this.url = instanceSettings.url;
                    this.name = instanceSettings.name;
                    this.$q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.networkId = instanceSettings.jsonData.networkId || 1;
                    this.accessToken = instanceSettings.jsonData.useToken !== false && instanceSettings.jsonData.accessToken !== undefined && instanceSettings.jsonData.accessToken !== '' ? '?access_token=' + instanceSettings.jsonData.accessToken : '';
                    this.endpointsBase = '/v2/grafana/net/' + this.networkId;
                    this.endpoints = {};
                    this.endpoints.category = this.endpointsBase + '/catalog/categories/list' + this.accessToken;
                    this.endpoints.variable = this.endpointsBase + '/catalog/categories/';
                    this.endpoints.device = this.endpointsBase + '/catalog/devices' + this.accessToken;
                    this.endpoints.component = this.endpointsBase + '/catalog/components' + this.accessToken;
                    this.endpoints.tagFacet = this.endpointsBase + '/catalog/tags/facets' + this.accessToken;
                    this.endpoints.query = this.endpointsBase + '/query' + this.accessToken;
                    this.endpoints.test = this.endpointsBase + '/test' + this.accessToken;

                    this.targetName = {};
                    this.targetName.variable = 'select variable';
                    this.targetName.device = '*';
                    this.targetName.component = '*';
                    this.targetName.sortByEl = 'select sorting';
                    this.targetName.selector = 'select selector';
                    this.targetName.limit = 'select limit';
                    this.targetName.group = 'select group';
                    this.targetName.tagFacet = 'select tag facet';
                    this.targetName.tagWord = 'select tag word';
                    this.targetName.interval = 'select interval';
                    this.targetName.tagData = [];
                    this.targetName.resultFormat = '';
                    this.targetName.columns = '';

                    this.clearString = '-- clear selection --';
                }

                _createClass(NetSpyGlassDatasource, [{
                    key: 'buildNewData',
                    value: function buildNewData(item) {
                        var temp = {};
                        for (var key in item) {
                            var result = [];
                            if (!(key in this.targetName)) {
                                continue;
                            }
                            if (typeof item[key] == 'undefined' || item[key] == this.clearString || item[key] == this.targetName[key]) {
                                continue;
                            }
                            if (key == 'tagFacet' || key == 'tagWord') {
                                continue;
                            }
                            if (key == 'tagData') {
                                var tagsLoop = function tagsLoop(singleItem, index) {
                                    if (singleItem.tagFacet == "" || singleItem.tagFacet == "select tag facet") {
                                        return;
                                    }
                                    if (singleItem.tagWord == "" || singleItem.tagWord == "select tag word") {
                                        return;
                                    }
                                    result.push({
                                        tagFacet: singleItem.tagFacet,
                                        tagOperation: singleItem.tagOperation,
                                        tagWord: singleItem.tagWord
                                    });
                                };

                                item[key].forEach(tagsLoop);
                            }
                            if (result.length > 0) {
                                temp.tags = result;
                            }
                            if (key !== 'tagData') {
                                temp[key] = item[key];
                            }
                        }
                        return temp;
                    }
                }, {
                    key: 'buildQuery',
                    value: function buildQuery(options) {
                        var query = this.buildQueryParameters(options);
                        query.targets = query.targets.filter(function (t) {
                            return !t.hide;
                        });
                        var queryObject = {
                            targets: []
                        };
                        var temp;
                        if (query.targets.length <= 0) {
                            temp = this.buildNewData(query);
                            queryObject.targets.push(temp);
                        } else {
                            var index;
                            for (index = query.targets.length - 1; index >= 0; --index) {
                                temp = this.buildNewData(query.targets[index]);
                                queryObject.targets.push(temp);
                            }
                            if (typeof query.rangeRaw != 'undefined') {
                                queryObject.from = query.rangeRaw.from;
                                queryObject.until = query.rangeRaw.to;
                                queryObject.groupByTime = query.interval;
                            }
                            queryObject.scopedVars = '$variable';
                        }
                        return queryObject;
                    }
                }, {
                    key: '_apiCall',
                    value: function _apiCall(endpoint, method, query) {
                        return this.backendSrv.datasourceRequest({
                            url: this.url + endpoint,
                            data: query,
                            method: method,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }, {
                    key: 'query',
                    value: function query(options) {
                        var data = this.buildQuery(options);
                        // console.log(data);
                        var query = JSON.stringify(data);
                        // replace templated variables
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query);
                    }
                }, {
                    key: 'testDatasource',
                    value: function testDatasource() {
                        var endpoint = this.endpoints.test;
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
                    key: 'metricFindQuery',
                    value: function metricFindQuery(query) {
                        var interpolated;
                        try {
                            // interpolated = this.templateSrv.replace(query, null, 'regex');
                            // replace templated variables
                            interpolated = this.templateSrv.replace(query, query.scopedVars);
                        } catch (err) {
                            return this.$q.reject(err);
                        }
                        var data = this.buildQuery(interpolated);
                        var columns = data.targets[0].columns;
                        var endpoint = this.endpointsBase + '/catalog/' + columns;
                        return this._apiCall(endpoint, 'POST', JSON.stringify(data)).then(this.mapToTextText);
                    }
                }, {
                    key: 'findCategoriesQuery',
                    value: function findCategoriesQuery() {
                        return this._apiCall(this.endpoints.category, 'POST', '').then(this.mapToTextValue);
                    }
                }, {
                    key: 'findVariablesQuery',
                    value: function findVariablesQuery(options) {
                        var endpoint = this.endpoints.variable + options.category + this.accessToken;
                        return this._apiCall(endpoint, 'POST', '').then(this.mapToTextValue);
                    }
                }, {
                    key: 'findDevices',
                    value: function findDevices(options) {
                        var data = this.buildQuery(options);
                        return this._apiCall(this.endpoints.device, 'POST', JSON.stringify(data)).then(this.mapToTextValue);
                    }
                }, {
                    key: 'findComponents',
                    value: function findComponents(options) {
                        var data = this.buildQuery(options);
                        return this._apiCall(this.endpoints.component, 'POST', JSON.stringify(data)).then(this.mapToTextValue);
                    }
                }, {
                    key: 'findTagFacets',
                    value: function findTagFacets(options) {
                        var data = this.buildQuery(options);
                        return this._apiCall(this.endpoints.tagFacet, 'POST', JSON.stringify(data)).then(this.mapToTextValue);
                    }
                }, {
                    key: 'findTagWordsQuery',
                    value: function findTagWordsQuery(options, facet) {
                        var data = this.buildQuery(options);
                        var endpoint = this.endpointsBase + '/catalog/tags/' + facet + this.accessToken;
                        return this._apiCall(endpoint, 'POST', JSON.stringify(data)).then(this.mapToTextValue);
                    }
                }, {
                    key: 'mapToTextValue',
                    value: function mapToTextValue(result) {
                        return _.map(result.data, function (d, i) {
                            return { text: d, value: i };
                        });
                    }
                }, {
                    key: 'mapToTextText',
                    value: function mapToTextText(result) {
                        return _.map(result.data, function (d, i) {
                            return { text: d, value: d };
                        });
                    }
                }, {
                    key: 'debug',
                    value: function debug(ctrl) {
                        console.log(ctrl);
                    }
                }, {
                    key: 'buildQueryParameters',
                    value: function buildQueryParameters(options) {
                        var _this = this;

                        if (typeof options === 'string') {
                            var obj = {
                                'targets': []
                            };
                            obj.targets.push(JSON.parse(options));
                            return obj;
                        }

                        var targets = _.map(options.targets, function (target) {
                            return {
                                category: _this.templateSrv.replace(target.category),
                                variable: _this.templateSrv.replace(target.variable),
                                device: _this.templateSrv.replace(target.device),
                                component: _this.templateSrv.replace(target.component),
                                tagFacet: _this.templateSrv.replace(target.tagFacet),
                                tagOperation: _this.templateSrv.replace(target.tagOperation),
                                tagWord: _this.templateSrv.replace(target.tagWord),
                                sortByEl: _this.templateSrv.replace(target.sortByEl),
                                selector: _this.templateSrv.replace(target.selector),
                                resultFormat: _this.templateSrv.replace(target.resultFormat),
                                limit: target.limit === '' ? -1 : _this.templateSrv.replace(target.limit),
                                columns: _this.templateSrv.replace(target.columns),
                                alias: _this.templateSrv.replace(target.alias, options.scopedVars),
                                refId: target.refId,
                                hide: target.hide,
                                tagData: target.tagData
                            };
                        });

                        options.targets = targets;

                        return options;
                    }
                }]);

                return NetSpyGlassDatasource;
            }());

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map
