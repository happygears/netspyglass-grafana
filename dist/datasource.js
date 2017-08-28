'use strict';

System.register(['lodash', './datemath', './services/api', './services/utils'], function (_export, _context) {
    "use strict";

    var _, dateMath, NSGQLApi, SQLGenerator, utils, _createClass, Cache, NetSpyGlassDatasource;

    function _defineProperty(obj, key, value) {
        if (key in obj) {
            Object.defineProperty(obj, key, {
                value: value,
                enumerable: true,
                configurable: true,
                writable: true
            });
        } else {
            obj[key] = value;
        }

        return obj;
    }

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

            Cache = {
                categories: false
            };

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource = function () {
                /**
                 * @param instanceSettings {PluginSettings}
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
                            return SQLGenerator.generateSQLQuery(item, { timeRange: timeRange });
                        }).filter(function (item) {
                            return item !== false;
                        }).map(function (item) {
                            return _this.api.generateTarget(item, item.format);
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
                        // const query = SQLGenerator.suggestion(data);
                        // return this.api.queryData(query, NSGQLApi.FORMAT_LIST, `suggestions_cache_${type}`);


                        function _buildTagsWhere(tags) {
                            var defaults = 'select value';
                            var result = [];

                            tags.forEach(function (tag) {
                                if (tag.value !== defaults || 1) {
                                    if (tag.condition) {
                                        result.push(tag.condition);
                                    }

                                    result.push(_defineProperty({}, tag.key, [tag.operator, tag.value]));
                                }
                            });

                            if (result.length) {
                                result.unshift('AND');
                                return result;
                            }

                            return false;
                        }

                        console.log(_buildTagsWhere(data.tags));

                        return this.$q.resolve([]);
                    }
                }]);

                return NetSpyGlassDatasource;
            }());

            _export('NetSpyGlassDatasource', NetSpyGlassDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map
