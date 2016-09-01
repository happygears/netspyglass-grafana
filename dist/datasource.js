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
                    key: 'transformTagMatch',
                    value: function transformTagMatch(tagMatches) {
                        var tags = [];
                        var idx;
                        for (idx = 0; idx < tagMatches.length; idx++) {
                            var tm = tagMatches[idx];
                            var tt = (tm.tagOperation === '<>' ? '!' : '') + tm.tagFacet + (tm.tagWord !== '' ? '.' + tm.tagWord : '');
                            tags.push(tt);
                        }
                        return tags.join(',');
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
                    this.endpointsBase = '/v2/query/net/' + this.networkId;
                    this.endpoints = {};
                    this.endpoints.category = this.endpointsBase + '/categories/' + this.accessToken;
                    this.endpoints.variable = this.endpointsBase + '/variables/';
                    this.endpoints.query = this.endpointsBase + '/data/' + this.accessToken;
                    this.endpoints.test = '/v2/ping/net/' + this.networkId + "/test/" + this.accessToken;

                    this.blankDropDownElement = '---';

                    this.targetName = {};
                    this.targetName.alias = '';
                    this.targetName.variable = 'select variable';
                    this.targetName.device = 'select device';
                    this.targetName.component = 'select component';
                    this.targetName.sortByEl = 'select sorting';
                    this.targetName.selector = 'choose selector';
                    this.targetName.limit = 'select limit';
                    this.targetName.group = 'select group';
                    this.targetName.tagFacet = this.blankDropDownElement;
                    this.targetName.tagWord = this.blankDropDownElement;
                    this.targetName.interval = 'select interval';
                    this.targetName.tagData = [];
                    this.targetName.format = '';
                    this.targetName.columns = '';
                    this.targetName.unique = '';
                    this.targetName.refId = '';

                    this.clearString = '-- clear selection --';
                }

                /**
                 * makes actual API call to NetSpyGlass server
                 *
                 * @param endpoint   API call endpoint
                 * @param method     GET or POST
                 * @param query      query object
                 * @returns {*}
                 * @private
                 */


                _createClass(NetSpyGlassDatasource, [{
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
                        var self = this;
                        var data = this.buildQueryFromQueryDialogData(options);
                        var aliases = {};
                        for (var idx = 0; idx < options.targets.length; idx++) {
                            var targetDlg = options.targets[idx];
                            aliases[targetDlg.refId] = targetDlg.alias;
                        }
                        for (var i = 0; i < data.targets.length; i++) {
                            var target = data.targets[i];
                            // UI passes only sort order ("ascending","descending" or "none"). Prepend it with default column name
                            target.sortByEl = target.sortByEl !== 'none' ? 'metric:' + target.sortByEl : target.sortByEl;
                        }
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        var response = this._apiCall(this.endpoints.query, 'POST', query);
                        // then: function(a,b,c)
                        return response.then(function (response) {
                            var data = response.data;
                            if (!data) return response;

                            // data is an Array of these:
                            //
                            // component:  "eth0"
                            // datapoints: Array[121]
                            // device:     "synas1"
                            // target:     "ifInRate:synas1:eth0"
                            // variable:   "ifInRate"

                            for (idx = 0; idx < data.length; idx++) {
                                var series = data[idx];
                                if (!series || !series.datapoints || !series.target) continue;
                                var alias = aliases[series.id];
                                if (alias) series.target = self.getSeriesName(series, alias);
                            }

                            return response;
                        });
                    }
                }, {
                    key: 'getSeriesName',
                    value: function getSeriesName(series, alias) {
                        var regex = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;

                        return alias.replace(regex, function (match, g1, g2) {
                            var group = g1 || g2;
                            var segIndex = parseInt(group, 10);

                            if (group === 'm' || group === 'measurement') {
                                return series.variable;
                            }
                            if (group === 'device') return series.device;
                            if (group === 'component') return series.component;
                            if (group.indexOf('tag_') !== 0) {
                                return match;
                            }

                            var tag = group.replace('tag_', '');
                            if (!series.tags) {
                                return match;
                            }
                            return series.tags[tag];
                        });
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
                        var data = this.buildQueryFromText(interpolated);
                        var target = data.targets[0];
                        target.format = 'list';
                        return this._apiCall(this.endpoints.query, 'POST', JSON.stringify(data)).then(NetSpyGlassDatasource.mapToTextText);
                    }
                }, {
                    key: 'findCategoriesQuery',
                    value: function findCategoriesQuery() {
                        return this._apiCall(this.endpoints.category, 'POST', '').then(NetSpyGlassDatasource.mapToTextValue);
                    }
                }, {
                    key: 'findVariablesQuery',
                    value: function findVariablesQuery(options) {
                        var endpoint = this.endpoints.variable + options.category + this.accessToken;
                        return this._apiCall(endpoint, 'POST', '').then(NetSpyGlassDatasource.mapToTextValue);
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
                        target.format = 'list';
                        target.limit = -1;
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.mapToTextText);
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
                        target.format = 'list';
                        target.limit = -1;
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.mapToTextText);
                    }
                }, {
                    key: 'findTagFacets',
                    value: function findTagFacets(options) {
                        var data = this.buildQuery(options);
                        var target = data.targets[0];
                        target.columns = 'tagFacet';
                        target.unique = 'tagFacet';
                        target.sortByEl = 'tagFacet:ascending';
                        target.format = 'list';
                        target.limit = -1;
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.mapToTextText);
                    }
                }, {
                    key: 'findTagWordsQuery',
                    value: function findTagWordsQuery(options, facet) {
                        var data = this.buildQuery(options);
                        var target = data.targets[0];
                        target.columns = facet;
                        target.unique = facet;
                        target.sortByEl = facet + ':ascending';
                        target.format = 'list';
                        target.limit = -1;
                        var query = JSON.stringify(data);
                        query = this.templateSrv.replace(query, options.scopedVars);
                        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.mapToTextText);
                    }
                }, {
                    key: 'templateSrvParameters',
                    value: function templateSrvParameters(queryObject) {
                        var _this = this;

                        queryObject.targets = _.map(queryObject.targets, function (target) {
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
                                format: _this.templateSrv.replace(target.format),
                                limit: target.limit === '' ? -1 : target.limit,
                                columns: _this.templateSrv.replace(target.columns),
                                alias: _this.templateSrv.replace(target.alias, queryObject.scopedVars),
                                refId: target.refId,
                                hide: target.hide,
                                tagData: target.tagData
                            };
                        });
                        return queryObject;
                    }
                }, {
                    key: 'removeBlanks',
                    value: function removeBlanks(item) {
                        var _this2 = this;

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
                                    return !_this2.isBlankTagMatch(t);
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
                        var queryObject = {
                            targets: [options]
                        };
                        return this.buildQueryFromQueryDialogData(queryObject);
                    }
                }, {
                    key: 'buildQueryFromText',
                    value: function buildQueryFromText(options) {
                        var queryObject = {
                            targets: [JSON.parse(options)]
                        };
                        return this.buildQueryFromQueryDialogData(queryObject);
                    }
                }, {
                    key: 'buildQueryFromQueryDialogData',
                    value: function buildQueryFromQueryDialogData(query) {
                        this.templateSrvParameters(query);
                        query.targets = query.targets.filter(function (t) {
                            return !t.hide;
                        });
                        var queryObject = {
                            targets: []
                        };
                        var index;
                        for (index = query.targets.length - 1; index >= 0; --index) {
                            var target = this.removeBlanks(query.targets[index]);
                            target.tags = NetSpyGlassDatasource.transformTagMatch(target.tagData);
                            delete target.tagData;
                            delete target.alias;
                            target.id = target.refId;
                            delete target.refId;
                            queryObject.targets.push(target);
                        }
                        if (typeof query.rangeRaw != 'undefined') {
                            queryObject.from = query.rangeRaw.from;
                            queryObject.until = query.rangeRaw.to;
                            queryObject.groupByTime = query.interval;
                        }
                        // queryObject.scopedVars = '$variable';
                        return queryObject;
                    }
                }]);

                return NetSpyGlassDatasource;
            }());

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map
