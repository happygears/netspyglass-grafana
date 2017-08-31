'use strict';

System.register(['lodash', './datemath', './services/api', './dictionary', './services/utils'], function (_export, _context) {
    "use strict";

    var _, dateMath, NSGQLApi, SQLGenerator, QueryPrompts, utils, _createClass, QueryTableNames, NetSpyGlassDatasource;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_datemath) {
            dateMath = _datemath;
        }, function (_servicesApi) {
            NSGQLApi = _servicesApi.NSGQLApi;
            SQLGenerator = _servicesApi.SQLGenerator;
        }, function (_dictionary) {
            QueryPrompts = _dictionary.QueryPrompts;
        }, function (_servicesUtils) {
            utils = _servicesUtils.default;
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
                function NetSpyGlassDatasource(instanceSettings, $q, backendSrv, templateSrv, $timeout) {
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
                    this.$timeout = $timeout;
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

                        var timeRange = {
                            from: utils.getTime(options.rangeRaw.from, false),
                            to: utils.getTime(options.rangeRaw.to, true)
                        };

                        var sqlTargets = options.targets.map(function (item) {
                            return _this.api.generateTarget(SQLGenerator.generateSQLQuery(item, { timeRange: timeRange }), item.format);
                        }).filter(function (item) {
                            return item.nsgql !== false;
                        });

                        if (sqlTargets.length === 0) {
                            return this.$q.resolve({ data: [] });
                        }

                        return this.api.queryData(sqlTargets).then(function (list) {
                            return { data: list };
                        });
                    }
                }, {
                    key: 'testDatasource',
                    value: function testDatasource() {
                        return this.api.ping();
                    }
                }, {
                    key: 'getCategories',
                    value: function getCategories() {
                        var query = SQLGenerator.categories();
                        return this.api.queryData(query, NSGQLApi.FORMAT_JSON, 'categories_cache').then(function (data) {
                            return _.groupBy(data[0].rows, 'category');
                        });
                    }
                }, {
                    key: 'getFacets',
                    value: function getFacets(variable) {
                        var query = SQLGenerator.facets(variable);
                        return this.api.queryData(query, NSGQLApi.FORMAT_LIST, 'facet_cache_' + variable);
                    }
                }, {
                    key: 'getSuggestions',
                    value: function getSuggestions(data) {
                        var query = void 0;

                        switch (data.type) {
                            case 'device':
                            case 'component':
                                query = SQLGenerator.suggestion(data.type, data.variable, data.tags);
                                break;
                            default:
                                query = SQLGenerator.suggestion(data.type, QueryTableNames.DEVICES);
                                break;
                        }
                        // return this.api.queryData(query, NSGQLApi.FORMAT_LIST);
                        return this.api.queryData(query, NSGQLApi.FORMAT_LIST, 'suggestions_cache_' + data.type);
                    }
                }]);

                return NetSpyGlassDatasource;
            }());

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map
