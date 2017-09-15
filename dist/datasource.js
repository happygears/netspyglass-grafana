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
                        accessToken = _instanceSettings$jso.accessToken;
                    var url = instanceSettings.url;


                    /** @type INSGQLApiOptions */
                    var options = {
                        baseUrl: url + '/v2',
                        token: accessToken || false,
                        endpoints: {
                            data: '/query/net/' + networkId + '/data',
                            test: '/ping/net/' + networkId + '/test'
                        }
                    };

                    this.api = new NSGQLApi(backendSrv, $q, options);
                    this.$q = $q;
                    this.templateSrv = templateSrv;
                    this.sqlQuery = new SQLQuery(templateSrv);
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

                        var processTarget = function processTarget(target) {
                            aliases[target.refId] = target.alias;

                            var sql = target.rawQuery ? _this.sqlQuery.generateSQLQueryFromString(target, { timeRange: timeRange, interval: options.interval }) : _this.sqlQuery.generateSQLQuery(target, { timeRange: timeRange, interval: options.interval });

                            return _this.api.generateTarget(_this.templateSrv.replace(sql), target.format, target.refId);
                        };

                        var sqlTargets = targets.map(processTarget).filter(function (target) {
                            return target.nsgql !== false;
                        });

                        if (sqlTargets.length === 0) {
                            return this.$q.resolve({ data: [] });
                        }

                        return this.api.queryData(sqlTargets).then(function (data) {
                            return _this._proccessingDataErrors(data);
                        }).then(function (data) {
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

                            if (!item.tags || item.tags[group] === 'undefined') {
                                return match;
                            } else {
                                return item.tags[group];
                            }
                        });
                    }
                }, {
                    key: '_proccessingDataErrors',
                    value: function _proccessingDataErrors(data) {
                        var errorsList = _.filter(data, 'error'),
                            errors = {};

                        if (errorsList.length) {
                            errorsList.forEach(function (error) {
                                errors[error.id.toUpperCase()] = error.error;
                            });

                            throw errors;
                        }

                        return data;
                    }
                }, {
                    key: '_processingGraphAliases',
                    value: function _processingGraphAliases(data, aliases) {
                        var _this2 = this;

                        data.forEach(function (item) {
                            var alias = aliases[item.id.toUpperCase()];
                            if (!item || !item.datapoints || !item.target || !alias) return;

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
                        });
                    }
                }, {
                    key: 'getFacets',
                    value: function getFacets(variable) {
                        var query = this.sqlQuery.facets(variable);
                        return this.api.queryData(query, NSGQLApi.FORMAT_LIST);
                    }
                }, {
                    key: 'getColumns',
                    value: function getColumns(variable) {
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
                            columns.push({
                                text: 'Pre Defined columns',
                                submenu: [{ text: 'metric', value: 'metric' }, { text: 'time', value: 'time' }]
                            });

                            columns.push({ text: '---------', separator: true });
                            columns = _.concat(columns, categories);

                            return columns;
                        });
                    }
                }, {
                    key: 'getSuggestions',
                    value: function getSuggestions(data) {
                        var query = void 0;

                        switch (data.type) {
                            case 'device':
                            case 'component':
                                query = this.sqlQuery.suggestion(data.type, data.variable, data.tags);
                                break;
                            default:
                                query = this.sqlQuery.suggestion(data.type, QueryTableNames.DEVICES);
                                break;
                        }

                        return this.api.queryData(query, NSGQLApi.FORMAT_LIST);
                    }
                }, {
                    key: 'getSQLString',
                    value: function getSQLString(target) {
                        return this.sqlQuery.generateSQLQuery(target, {}, true);
                    }
                }, {
                    key: 'metricFindQuery',
                    value: function metricFindQuery(query) {
                        return this.api.queryData(query, NSGQLApi.FORMAT_LIST).then(function (data) {
                            return data.map(function (el) {
                                return { text: el };
                            });
                        });
                    }
                }]);

                return NetSpyGlassDatasource;
            }());

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource);
        }
    };
});
