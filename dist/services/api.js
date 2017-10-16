'use strict';

System.register(['../hg-sql-builder', '../dictionary', './utils', 'angular', 'lodash'], function (_export, _context) {
    "use strict";

    var SQLBuilderFactory, QueryPrompts, GrafanaVariables, utils, angular, _, _createClass, sqlBuilder, SQLQuery, Cache, NSGQLApi;

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

            return arr2;
        } else {
            return Array.from(arr);
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

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_hgSqlBuilder) {
            SQLBuilderFactory = _hgSqlBuilder.default;
        }, function (_dictionary) {
            QueryPrompts = _dictionary.QueryPrompts;
            GrafanaVariables = _dictionary.GrafanaVariables;
        }, function (_utils) {
            utils = _utils.default;
        }, function (_angular) {
            angular = _angular.default;
        }, function (_lodash) {
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

            sqlBuilder = SQLBuilderFactory();

            _export('SQLQuery', SQLQuery = function () {
                function SQLQuery() {
                    _classCallCheck(this, SQLQuery);
                }

                _createClass(SQLQuery, [{
                    key: 'processColumn',
                    value: function processColumn(column) {
                        var needToCreateAliases = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

                        if (angular.isString(column)) {
                            return column;
                        }

                        if (angular.isObject(column) && !angular.isArray(column)) {
                            var columnName = utils.compileColumnName(column);

                            if (column.alias) {
                                columnName += ' as ' + column.alias;
                            } else if (needToCreateAliases) {
                                var alias = utils.compileColumnAlias(column);
                                if (alias !== columnName) {
                                    columnName += ' as ' + alias;
                                }
                            }

                            return columnName;
                        }

                        throw new Error('Unknow column type!');
                    }
                }, {
                    key: 'categories',
                    value: function categories() {
                        return sqlBuilder.factory({
                            select: ['*'],
                            distinct: true,
                            from: 'variables',
                            where: ['AND', {
                                category: ['<>', '']
                            }],
                            orderBy: ['category']
                        }).compile();
                    }
                }, {
                    key: 'facets',
                    value: function facets(from) {
                        return sqlBuilder.factory({
                            select: ['tagFacet'],
                            distinct: true,
                            from: from,
                            orderBy: ['tagFacet']
                        }).compile();
                    }
                }, {
                    key: 'suggestion',
                    value: function suggestion(type, from) {
                        var tags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

                        var query = sqlBuilder.factory().setDistinct(true).from(from).select([type]).orderBy([type]);

                        switch (type) {
                            case 'device':
                            case 'component':
                                query.where(this.generateWhereFromTags(tags));
                                break;
                            default:
                                query.where([sqlBuilder.OP.AND, _defineProperty({}, type, [sqlBuilder.OP.NOT_NULL]), this.generateWhereFromTags(tags)]);
                                break;
                        }

                        return query.compile();
                    }
                }, {
                    key: 'getTagKeysForAdHoc',
                    value: function getTagKeysForAdHoc() {
                        return sqlBuilder.factory({
                            select: ['facet'],
                            from: 'tags'
                        }).compile();
                    }
                }, {
                    key: 'getTagValuesForAdHoc',
                    value: function getTagValuesForAdHoc(tagFacet) {
                        var queries = [sqlBuilder.factory({
                            select: [tagFacet],
                            distinct: true,
                            from: 'devices',
                            where: _defineProperty({}, tagFacet, [sqlBuilder.OP.NOT_NULL]),
                            orderBy: [tagFacet]
                        }).compile(), sqlBuilder.factory({
                            select: [tagFacet],
                            distinct: true,
                            from: 'interfaces',
                            where: _defineProperty({}, tagFacet, [sqlBuilder.OP.NOT_NULL]),
                            orderBy: [tagFacet]
                        }).compile()];

                        return queries.map(function (query) {
                            return { nsgql: query, format: NSGQLApi.FORMAT_LIST };
                        });
                    }
                }, {
                    key: 'generateWhereFromTags',
                    value: function generateWhereFromTags() {
                        var tags = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

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
                    }
                }, {
                    key: 'generateSQLQuery',
                    value: function generateSQLQuery(target, options) {
                        var _this = this;

                        var useTemplates = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

                        var columns = Array.isArray(target.columns) ? target.columns : [];
                        var query = sqlBuilder.factory();
                        var timeVar = useTemplates ? GrafanaVariables.timeFilter : {
                            time: [sqlBuilder.OP.BETWEEN, options.timeRange.from, options.timeRange.to]
                        };
                        var adHoc = null;

                        if (options.adHoc && options.adHoc.length) {
                            adHoc = useTemplates ? GrafanaVariables.adHocFilter : this.generateWhereFromTags(options.adHoc);
                        }

                        if (columns.length) {
                            columns = columns.filter(function (column) {
                                return column.name !== QueryPrompts.column;
                            });
                        }

                        if (columns.length === 0 || target.variable == QueryPrompts.variable) {
                            return false;
                        }

                        query.select(columns.map(function (column) {
                            return _this.processColumn(column, target.isTablePanel);
                        }));
                        query.from(target.variable);
                        query.where([sqlBuilder.OP.AND, this.generateWhereFromTags(target.tags), adHoc, timeVar]);

                        if (target.limit) {
                            if (typeof target.limit === 'string') {
                                query.limit(target.limit);
                            } else {
                                query.limit(target.limit);
                            }
                        }

                        if (target.orderBy.column && target.orderBy.column.name) {
                            query.orderBy([(target.orderBy.column.alias || target.orderBy.column.value) + ' ' + target.orderBy.sort]);
                        } else {
                            query.clearOrderBy();
                        }

                        if (target.groupBy.value && target.groupBy.value !== QueryPrompts.groupBy) {
                            query.groupBy([this.generateGroupByValue(target, options, useTemplates)]);
                        } else {
                            query.clearGroupBy();
                        }

                        return query.compile();
                    }
                }, {
                    key: 'generateSQLQueryFromString',
                    value: function generateSQLQueryFromString(target, options) {
                        var timeFilter = 'time BETWEEN \'' + options.timeRange.from + '\' AND \'' + options.timeRange.to + '\'';
                        var interval = '' + options.interval;
                        var adhocWhere = sqlBuilder.buildWhere(this.generateWhereFromTags(options.adHoc));

                        var query = target.nsgqlString;

                        if (query && query.indexOf(GrafanaVariables.timeFilter) > 0) {
                            query = _.replace(query, GrafanaVariables.timeFilter, timeFilter);
                        }

                        if (query && query.indexOf(GrafanaVariables.adHocFilter) > 0) {
                            query = _.replace(query, GrafanaVariables.adHocFilter, '( ' + adhocWhere + ' )');
                        }

                        if (query && query.indexOf(GrafanaVariables.interval) > 0) {
                            query = _.replace(query, GrafanaVariables.interval, interval);
                        }

                        return query;
                    }
                }, {
                    key: 'generateGroupByValue',
                    value: function generateGroupByValue(target, options) {
                        var useTemplates = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

                        switch (target.groupBy.type) {
                            case 'time':
                                var groupByValue = target.groupBy.value === GrafanaVariables.interval && !useTemplates ? options.interval : target.groupBy.value;
                                return 'time(' + groupByValue + ')';
                                break;
                            case 'column':
                                return target.groupBy.value;
                                break;
                        }
                    }
                }, {
                    key: 'correctAdhoc',
                    value: function correctAdhoc(adhocFilters) {
                        return adhocFilters.map(function (el) {
                            switch (el.operator) {
                                case '=~':
                                    el.operator = sqlBuilder.OP.REGEXP;
                                    break;
                                case '!~':
                                    el.operator = sqlBuilder.OP.NOT_REGEXP;
                                    break;
                            }

                            return el;
                        });
                    }
                }]);

                return SQLQuery;
            }());

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

                            return [];
                        });
                    }
                }, {
                    key: 'generateTarget',
                    value: function generateTarget(nsgql) {
                        var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'json';
                        var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'A';

                        return {
                            nsgql: nsgql,
                            format: format,
                            id: id
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

            _export('SQLQuery', SQLQuery);

            _export('NSGQLApi', NSGQLApi);
        }
    };
});
