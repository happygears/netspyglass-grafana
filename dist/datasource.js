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
                _createClass(NetSpyGlassDatasource, null, [{
                    key: 'tableResponseRowsToMap',
                    value: function tableResponseRowsToMap(response) {
                        return _.map(response.data[0].rows, function (d, i) {
                            return { text: d[0], value: i };
                        });
                    }
                }]);

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
                    // this.endpoints.device = this.endpointsBase + '/catalog/devices' + this.accessToken;
                    // this.endpoints.component = this.endpointsBase + '/catalog/components' + this.accessToken;
                    // this.endpoints.tagFacet = this.endpointsBase + '/catalog/tags/facets' + this.accessToken;
                    this.endpoints.query = this.endpointsBase + '/query' + this.accessToken;
                    this.endpoints.test = this.endpointsBase + '/test' + this.accessToken;

                    this.blankDropDownElement = '---';

                    this.targetName = {};
                    this.targetName.variable = 'select variable';
                    this.targetName.device = 'select device';
                    this.targetName.component = 'select component';
                    this.targetName.sortByEl = 'select sorting';
                    this.targetName.selector = 'select selector';
                    this.targetName.limit = 'select limit';
                    this.targetName.group = 'select group';
                    this.targetName.tagFacet = this.blankDropDownElement;
                    this.targetName.tagWord = this.blankDropDownElement;
                    this.targetName.interval = 'select interval';
                    this.targetName.tagData = [];
                    this.targetName.format = '';
                    this.targetName.columns = '';
                    this.targetName.unique = '';

                    this.clearString = '-- clear selection --';
                }

                _createClass(NetSpyGlassDatasource, [{
                    key: 'removePrompts',
                    value: function removePrompts(item) {
                        var _this = this;

                        var temp = {};
                        for (var key in item) {
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
                                temp[key] = item[key].filter(function (t) {
                                    return !_this.isBlankTagMatch(t);
                                });
                            } else {
                                temp[key] = item[key];
                            }
                        }
                        return temp;
                    }
                }, {
                    key: 'isBlankTagMatch',
                    value: function isBlankTagMatch(tm) {
                        if (tm.tagFacet === "" || tm.tagFacet === this.blankDropDownElement) return true;
                        return !!(tm.tagWord === "" || tm.tagWord === this.blankDropDownElement);
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
                            temp = this.removePrompts(query);
                            queryObject.targets.push(temp);
                        } else {
                            var index;
                            for (index = query.targets.length - 1; index >= 0; --index) {
                                temp = this.removePrompts(query.targets[index]);
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
                        var target = data.targets[0];
                        // UI passes only sort order ("ascending","descending" or "none"). Prepend it with default column name
                        target.sortByEl = target.sortByEl !== 'none' ? 'metric:' + target.sortByEl : target.sortByEl;
                        var query = JSON.stringify(data);
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
                            interpolated = this.templateSrv.replace(query, query.scopedVars);
                        } catch (err) {
                            return this.$q.reject(err);
                        }
                        var data = this.buildQuery(interpolated);
                        var target = data.targets[0];
                        target.format = 'table';
                        return this._apiCall(this.endpoints.query, 'POST', JSON.stringify(data)).then(NetSpyGlassDatasource.tableResponseRowsToMap);
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
                        var target = data.targets[0];
                        target.device = ''; // erase to ignore current selection in the dialog
                        target.component = '';
                        target.columns = 'device';
                        target.unique = 'device';
                        target.sortByEl = 'device:ascending';
                        target.format = 'table';
                        target.limit = -1;
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.tableResponseRowsToMap);
                    }
                }, {
                    key: 'findComponents',
                    value: function findComponents(options) {
                        var data = this.buildQuery(options);
                        var target = data.targets[0];
                        target.component = ''; // erase to ignore current selection in the dialog
                        target.columns = 'component';
                        target.unique = 'component';
                        target.sortByEl = 'component:ascending';
                        target.format = 'table';
                        target.limit = -1;
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.tableResponseRowsToMap);
                    }
                }, {
                    key: 'findTagFacets',
                    value: function findTagFacets(options) {
                        var data = this.buildQuery(options);
                        var target = data.targets[0];
                        target.columns = 'tagFacet';
                        target.unique = 'tagFacet';
                        target.sortByEl = 'tagFacet:ascending';
                        target.format = 'table';
                        target.limit = -1;
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.tableResponseRowsToMap);
                    }
                }, {
                    key: 'findTagWordsQuery',
                    value: function findTagWordsQuery(options, facet) {
                        var data = this.buildQuery(options);
                        var target = data.targets[0];
                        target.columns = facet;
                        target.unique = facet;
                        target.sortByEl = facet + ':ascending';
                        target.format = 'table';
                        target.limit = -1;
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.tableResponseRowsToMap);
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
                        var _this2 = this;

                        if (typeof options === 'string') {
                            var obj = {
                                'targets': []
                            };
                            obj.targets.push(JSON.parse(options));
                            return obj;
                        }

                        var targets = _.map(options.targets, function (target) {
                            return {
                                category: _this2.templateSrv.replace(target.category),
                                variable: _this2.templateSrv.replace(target.variable),
                                device: _this2.templateSrv.replace(target.device),
                                component: _this2.templateSrv.replace(target.component),
                                tagFacet: _this2.templateSrv.replace(target.tagFacet),
                                tagOperation: _this2.templateSrv.replace(target.tagOperation),
                                tagWord: _this2.templateSrv.replace(target.tagWord),
                                sortByEl: _this2.templateSrv.replace(target.sortByEl),
                                selector: _this2.templateSrv.replace(target.selector),
                                format: _this2.templateSrv.replace(target.format),
                                limit: target.limit === '' ? -1 : target.limit,
                                columns: _this2.templateSrv.replace(target.columns),
                                alias: _this2.templateSrv.replace(target.alias, options.scopedVars),
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
