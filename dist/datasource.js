'use strict';

System.register(['lodash', './services/api', './services/utils'], function (_export, _context) {
    "use strict";

    var _, NSGQLApi, SQLQuery, utils, _slicedToArray, _createClass, QueryTableNames, NetSpyGlassDatasource;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_servicesApi) {
            NSGQLApi = _servicesApi.NSGQLApi;
            SQLQuery = _servicesApi.SQLQuery;
        }, function (_servicesUtils) {
            utils = _servicesUtils.default;
        }],
        execute: function () {
            _slicedToArray = function () {
                function sliceIterator(arr, i) {
                    var _arr = [];
                    var _n = true;
                    var _d = false;
                    var _e = undefined;

                    try {
                        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                            _arr.push(_s.value);

                            if (i && _arr.length === i) break;
                        }
                    } catch (err) {
                        _d = true;
                        _e = err;
                    } finally {
                        try {
                            if (!_n && _i["return"]) _i["return"]();
                        } finally {
                            if (_d) throw _e;
                        }
                    }

                    return _arr;
                }

                return function (arr, i) {
                    if (Array.isArray(arr)) {
                        return arr;
                    } else if (Symbol.iterator in Object(arr)) {
                        return sliceIterator(arr, i);
                    } else {
                        throw new TypeError("Invalid attempt to destructure non-iterable instance");
                    }
                };
            }();

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

            QueryTableNames = {
                DEVICES: 'devices'
            };

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource = function () {
                /**
                 * @param {PluginSettings} instanceSettings
                 * @param $q
                 * @param backendSrv
                 * @param templateSrv
                 */
                function NetSpyGlassDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    _classCallCheck(this, NetSpyGlassDatasource);

                    var _instanceSettings$jso = instanceSettings.jsonData,
                        networkId = _instanceSettings$jso.networkId,
                        accessToken = _instanceSettings$jso.accessToken,
                        useToken = _instanceSettings$jso.useToken,
                        addTokenToHeader = _instanceSettings$jso.addTokenToHeader;
                    var url = instanceSettings.url;


                    /** @type INSGQLApiOptions */
                    var options = {
                        baseUrl: url + '/v2',
                        token: useToken && accessToken ? accessToken : false,
                        useTokenInHeader: addTokenToHeader,
                        basicAuth: instanceSettings.basicAuth,
                        withCredentials: instanceSettings.withCredentials,
                        endpoints: {
                            data: '/query/net/' + networkId + '/data',
                            test: '/ping/net/' + networkId + '/test'
                        }
                    };

                    this.api = new NSGQLApi(backendSrv, $q, options);
                    this.$q = $q;
                    this.templateSrv = templateSrv;
                    this.sqlQuery = new SQLQuery(templateSrv);
                    this._formatValue = this._formatValue.bind(this);

                    this.name = instanceSettings.name;
                }

                /**
                 * @description This function is called when plugin builds a graph
                 * @param options {QueryOptions} an object built from the data entered in the query dialog
                 * @returns {Promise}
                 */


                _createClass(NetSpyGlassDatasource, [{
                    key: 'query',
                    value: function query(options) {
                        var _this = this;

                        var targets = options.targets,
                            rangeRaw = options.rangeRaw;

                        var timeRange = {
                            from: utils.getTime(rangeRaw.from, false),
                            to: utils.getTime(rangeRaw.to, true)
                        };
                        var aliases = {};
                        var adhocFilters = this.sqlQuery.correctAdhoc(this.templateSrv.getAdhocFilters(this.name));

                        //this variable is used for building "raw" query in the getSQLString method
                        this.queryOptions = {
                            timeRange: timeRange,
                            interval: options.interval,
                            adHoc: adhocFilters,
                            scopedVars: options.scopedVars
                        };

                        var processTarget = function processTarget(target) {
                            var maxDataPoints = options.maxDataPoints && target.format === 'time_series' ? options.maxDataPoints : undefined;

                            aliases[target.refId] = target.alias;

                            if (target.orderBy && target.orderBy.column.name === 'column') {
                                target.orderBy.column.value = target.orderBy.colValue;
                            }

                            var sql = target.rawQuery ? _this.sqlQuery.generateSQLQueryFromString(target, _this.queryOptions) : _this.sqlQuery.generateSQLQuery(target, _this.queryOptions);

                            sql = _this.templateSrv.replace(sql, options.scopedVars, _this._formatValue);

                            return _this.api.generateTarget(sql, target.format, target.refId, maxDataPoints);
                        };

                        var sqlTargets = targets.map(function (target) {
                            var nsgTarget = _.cloneDeep(target._nsgTarget) || {};
                            nsgTarget.refId = target.refId;
                            nsgTarget.hide = target.hide;
                            return nsgTarget;
                        }).filter(function (target) {
                            return target.hide !== true;
                        }).map(processTarget).filter(function (target) {
                            return target.nsgql !== false;
                        });

                        if (sqlTargets.length === 0) {
                            return this.$q.resolve({ data: [] });
                        }

                        return this.api.queryData(sqlTargets).then(function (data) {
                            return _this._processingGraphAliases(data, aliases);
                        }).then(function (list) {
                            return { data: list };
                        });
                    }
                }, {
                    key: 'getSeriesName',
                    value: function getSeriesName(item, alias) {
                        var regex = /\$(\w+)|\[\[([\s\S]+?)]]/g;

                        alias = this.templateSrv.replace(alias);

                        return alias.replace(regex, function (match, g1, g2) {
                            var group = g1 || g2;

                            switch (group) {
                                case 'm':
                                case 'measurement':
                                case 'variable':
                                    return item.variable;
                                case 'device':
                                    return item.device;
                                case 'component':
                                    return item.component;
                                case 'description':
                                    return item.description;
                            }

                            if (item[group]) {
                                return item[group];
                            }

                            if (!item.tags || !item.tags[group]) {
                                return match;
                            } else {
                                return item.tags[group];
                            }
                        });
                    }
                }, {
                    key: '_formatValue',
                    value: function _formatValue(value) {
                        if (_.isArray(value)) {
                            if (value.length === 1) {
                                value = value[0];
                            } else {
                                return '' + value.join("', '");
                            }
                        }

                        return this.templateSrv.formatValue(value);
                    }
                }, {
                    key: '_processingGraphAliases',
                    value: function _processingGraphAliases(data, aliases) {
                        var _this2 = this;

                        data.forEach(function (item) {
                            var alias = aliases[item.id.toUpperCase()];
                            if (!item || !alias) return;

                            item.target = _this2.getSeriesName(item, alias);
                        });

                        return data;
                    }
                }, {
                    key: 'testDatasource',
                    value: function testDatasource() {
                        return this.api.ping();
                    }
                }, {
                    key: 'getCategories',
                    value: function getCategories() {
                        var query = this.sqlQuery.categories();
                        return this.api.queryData(query, NSGQLApi.FORMAT_JSON).then(function (data) {
                            var categories = _.groupBy(data[0].rows, 'category'),
                                result = [];

                            for (var category in categories) {
                                result.push({
                                    text: category,
                                    submenu: categories[category].map(function (category) {
                                        return { text: category.name, value: category.name };
                                    })
                                });
                            }

                            return result;
                        }).catch(function () {
                            return [];
                        });
                    }
                }, {
                    key: 'getFacets',
                    value: function getFacets(variable) {
                        var query = this.sqlQuery.facets(variable);
                        return this.api.queryData(query, NSGQLApi.FORMAT_LIST).catch(function () {
                            return [];
                        });
                    }
                }, {
                    key: 'getColumns',
                    value: function getColumns(variable) {
                        var _this3 = this;

                        return this.$q.all([this.getCategories(), this.getFacets(variable)]).then(function (data) {
                            var _data = _slicedToArray(data, 2),
                                categories = _data[0],
                                tags = _data[1];

                            var columns = [];

                            columns.push({
                                text: 'tags',
                                submenu: tags.map(function (tag) {
                                    return { text: tag, value: tag };
                                })
                            });

                            columns.push({ text: '---------', separator: true });
                            columns.push(_this3.getPredefinedColumns());

                            columns.push({ text: '---------', separator: true });

                            // columns = _.concat(columns, categories);
                            columns.push({
                                text: 'variables',
                                submenu: categories
                            });

                            return columns;
                        });
                    }
                }, {
                    key: 'getPredefinedColumns',
                    value: function getPredefinedColumns() {
                        return {
                            text: 'predefined columns',
                            submenu: [{ text: 'address', value: 'address' }, { text: 'boxDescr', value: 'boxDescr' }, { text: 'combinedRoles', value: 'combinedRoles' }, { text: 'combinedNsgRoles', value: 'combinedNsgRoles' }, { text: 'component', value: 'component' }, { text: 'device', value: 'device' }, { text: 'description', value: 'description' }, { text: 'discoveryTime', value: 'discoveryTime' }, { text: 'freshness', value: 'freshness' }, { text: 'metric', value: 'metric' }, { text: 'name', value: 'name' }, { text: 'time', value: 'time' }, { text: 'stale', value: 'stale' }]
                        };
                    }
                }, {
                    key: 'getSuggestions',
                    value: function getSuggestions(data) {
                        var query = void 0;

                        query = this.sqlQuery.suggestion(data.type, data.variable, data.tags, data.scopedVars);

                        query = this.templateSrv.replace(query, data.scopedVars);

                        return this.api.queryData(query, NSGQLApi.FORMAT_LIST).catch(function () {
                            return [];
                        });
                    }
                }, {
                    key: 'getSQLString',
                    value: function getSQLString(target) {
                        return this.sqlQuery.generateSQLQuery(target, this.queryOptions, true);
                    }
                }, {
                    key: 'metricFindQuery',
                    value: function metricFindQuery(query) {
                        query = this.sqlQuery.replaceVariables(query);
                        query = this.templateSrv.replace(query, null, this._formatValue);

                        return this.api.queryData(query, NSGQLApi.FORMAT_LIST).then(function (data) {
                            return data.map(function (el) {
                                return { text: el };
                            });
                        }).catch(function () {
                            return [];
                        });
                    }
                }, {
                    key: 'getTagKeys',
                    value: function getTagKeys() {
                        return this.api.queryData(this.sqlQuery.getTagKeysForAdHoc(), NSGQLApi.FORMAT_LIST).then(function (list) {
                            return list.map(function (item) {
                                return { text: item };
                            });
                        }).catch(function () {
                            return [];
                        });
                    }
                }, {
                    key: 'getTagValues',
                    value: function getTagValues(options) {
                        var _this4 = this;

                        var queries = this.sqlQuery.getTagValuesForAdHoc(options.key).map(function (query) {
                            return _this4.api.generateTarget(query, NSGQLApi.FORMAT_LIST);
                        });

                        return this.api.queryData(queries).then(function (list) {
                            return list.filter(function (item, pos, self) {
                                return self.indexOf(item) === pos;
                            }).map(function (item) {
                                if (item.error) {
                                    console.log(item.error);
                                    return;
                                }
                                return { text: item };
                            }).filter(Boolean);
                        }).catch(function () {
                            return [];
                        });
                    }
                }, {
                    key: 'getCombinedList',
                    value: function getCombinedList(variable) {
                        var _this5 = this;

                        return this.getFacets(variable).then(function (tags) {
                            var list = [];

                            list.push({
                                text: 'tags',
                                submenu: tags.map(function (tag) {
                                    return { text: tag, value: tag };
                                })
                            });

                            list.push({ text: '---------', separator: true });

                            list.push(_this5.getPredefinedColumns());

                            return list;
                        });
                    }
                }]);

                return NetSpyGlassDatasource;
            }());

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource);
        }
    };
});
