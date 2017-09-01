'use strict';

System.register(['../hg-sql-builder', '../dictionary'], function (_export, _context) {
    "use strict";

    var SQLBuilderFactory, QueryPrompts, _createClass, sqlBuilder, SQLGenerator, Cache, NSGQLApi;

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

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

    return {
        setters: [function (_hgSqlBuilder) {
            SQLBuilderFactory = _hgSqlBuilder.default;
        }, function (_dictionary) {
            QueryPrompts = _dictionary.QueryPrompts;
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

            sqlBuilder = SQLBuilderFactory();

            _export('SQLGenerator', SQLGenerator = {
                categories: function categories() {
                    return sqlBuilder.factory({
                        select: ['category', 'name'],
                        distinct: true,
                        from: 'variables',
                        where: ['AND', {
                            category: ['<>', '']
                        }],
                        orderBy: ['category']
                    }).compile();
                },

                /**
                 * @param from {string}
                 * @returns {*}
                 */
                facets: function facets(from) {
                    return sqlBuilder.factory({
                        select: ['tagFacet'],
                        distinct: true,
                        from: from,
                        orderBy: ['tagFacet']
                    }).compile();
                },

                /**
                 * @param {string} type
                 * @param {string} from
                 * @param {array} tags
                 */
                suggestion: function suggestion(type, from) {
                    var tags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

                    var query = sqlBuilder.factory().setDistinct(true).from(from).select([type]).orderBy([type]);

                    switch (type) {
                        case 'device':
                        case 'component':
                            query.where(this.generateWhereFromTags(tags));
                            break;
                        default:
                            query.where(_defineProperty({}, type, [sqlBuilder.OP.NOT_NULL]));
                            break;
                    }

                    return query.compile();
                },

                /**
                 * @param {array} tags
                 * @returns {array}
                 */
                generateWhereFromTags: function generateWhereFromTags(tags) {
                    var result = [];

                    tags.forEach(function (tag) {
                        if (tag.value !== QueryPrompts.whereValue) {
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

                    return null;
                },

                generateSQLQuery: function generateSQLQuery(target, options) {
                    var useTemplates = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

                    var query = sqlBuilder.factory();
                    var timeVar = useTemplates ? '$_timeFilter' : {
                        time: [sqlBuilder.OP.BETWEEN, options.timeRange.from, options.timeRange.to]
                    };

                    if (!target.columns || target.columns.length === 0) {
                        return false;
                    }

                    query.select(target.columns);
                    query.from(target.variable);
                    query.where([sqlBuilder.OP.AND, this.generateWhereFromTags(target.tags), timeVar]);

                    return query.compile();
                }
            });

            Cache = {};

            _export('NSGQLApi', NSGQLApi = function () {
                /**
                 * @param $backend
                 * @param $q
                 * @param options {INSGQLApiOptions}
                 */
                function NSGQLApi($backend, $q, options) {
                    _classCallCheck(this, NSGQLApi);

                    this.$backend = $backend;
                    this.$q = $q;
                    this.options = options;
                }

                /**
                 * @returns {Promise}
                 */


                _createClass(NSGQLApi, [{
                    key: 'ping',
                    value: function ping() {
                        return this._request(this.options.endpoints.test, {}, 'get').then(function (response) {
                            if (response.status === 200) {
                                return {
                                    title: 'Success',
                                    status: 'success',
                                    message: 'Data source is working'
                                };
                            }
                        });
                    }
                }, {
                    key: 'queryData',
                    value: function queryData() {
                        var targets = [];

                        var _arguments = Array.prototype.slice.call(arguments),
                            _arguments$ = _arguments[2],
                            cacheKey = _arguments$ === undefined ? false : _arguments$,
                            _arguments$2 = _arguments[3],
                            reloadCache = _arguments$2 === undefined ? false : _arguments$2;

                        if (Array.isArray(arguments[0])) {
                            targets.push.apply(targets, _toConsumableArray(arguments[0]));
                        } else {
                            targets.push(this.generateTarget(arguments[0], arguments[1]));
                        }

                        if (cacheKey && Cache.hasOwnProperty(cacheKey) && !reloadCache) {
                            return this.$q.resolve(_.cloneDeep(Cache[cacheKey]));
                        }

                        return this._request(this.options.endpoints.data, { targets: targets }, 'POST').then(function (response) {
                            if (response.status === 200) {
                                var data = response.data || response;

                                if (data && cacheKey) {
                                    Cache[cacheKey] = _.cloneDeep(data);
                                }

                                return data;
                            }
                        });
                    }
                }, {
                    key: 'generateTarget',
                    value: function generateTarget(nsgql) {
                        var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'json';

                        return {
                            nsgql: nsgql,
                            format: format
                        };
                    }
                }, {
                    key: '_request',
                    value: function _request(resource, data) {
                        var method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'POST';

                        var query = '?';

                        if (this.options.token) {
                            query += this.$backend.$http.defaults.paramSerializer({ access_token: this.options.token });
                        }

                        return this.$backend.datasourceRequest({
                            url: this.options.baseUrl + resource + query,
                            data: data,
                            method: method,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }]);

                return NSGQLApi;
            }());

            NSGQLApi.FORMAT_JSON = 'json';
            NSGQLApi.FORMAT_LIST = 'list';

            _export('SQLGenerator', SQLGenerator);

            _export('NSGQLApi', NSGQLApi);
        }
    };
});
//# sourceMappingURL=api.js.map
