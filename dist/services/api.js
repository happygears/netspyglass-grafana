'use strict';

System.register(['../hg-sql-builder', '../dictionary', './utils', 'angular', 'lodash'], function (_export, _context) {
    "use strict";

    var SQLBuilderFactory, GrafanaVariables, QueryPrompts, utils, angular, _, _slicedToArray, _createClass, sqlBuilder, SQLQuery, Cache, NSGQLApi;

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
            GrafanaVariables = _dictionary.GrafanaVariables;
            QueryPrompts = _dictionary.QueryPrompts;
        }, function (_utils) {
            utils = _utils.default;
        }, function (_angular) {
            angular = _angular.default;
        }, function (_lodash) {
            _ = _lodash.default;
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

            sqlBuilder = SQLBuilderFactory();

            _export('SQLQuery', SQLQuery = function () {
                function SQLQuery(templateSrv) {
                    _classCallCheck(this, SQLQuery);

                    this.templateSrv = templateSrv;
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
                                columnName += ' as ' + sqlBuilder.escape(column.alias);
                            } else if (needToCreateAliases) {
                                var alias = utils.compileColumnAlias(column);
                                if (alias !== columnName) {
                                    columnName += ' as ' + sqlBuilder.escape(alias);
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
                        var scopedVars = arguments[3];

                        var query = sqlBuilder.factory().setDistinct(true).from(from).select([type]).orderBy([type]);

                        switch (type) {
                            case 'device':
                            case 'component':
                                query.where(this.generateWhereFromTags(tags, scopedVars));
                                break;
                            default:
                                query.where([sqlBuilder.OP.AND, _defineProperty({}, type, [sqlBuilder.OP.NOT_NULL]), this.generateWhereFromTags(tags, scopedVars)]);
                                break;
                        }

                        return query.compile();
                    }
                }, {
                    key: 'getTagKeysForAdHoc',
                    value: function getTagKeysForAdHoc() {
                        return sqlBuilder.factory({
                            select: ['facet'],
                            from: 'tags',
                            orderBy: ['facet']
                        }).compile();
                    }
                }, {
                    key: 'getTagValuesForAdHoc',
                    value: function getTagValuesForAdHoc(tagFacet) {
                        return [sqlBuilder.factory({
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
                    }
                }, {
                    key: 'getTemplateValue',
                    value: function getTemplateValue(str, scopedVars) {
                        var name = str.substr(1);

                        if (name in scopedVars) {
                            return scopedVars[name].value;
                        }

                        var variable = _.find(this.templateSrv.variables, { name: name });

                        if (variable) {
                            if (this.templateSrv.isAllValue(variable.current.value)) {
                                return this.templateSrv.getAllValue(variable);
                            } else {
                                return _.cloneDeep(variable.current.value);
                            }
                        }

                        return str;
                    }
                }, {
                    key: 'generateWhereFromTags',
                    value: function generateWhereFromTags() {
                        var _this = this;

                        var tags = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
                        var scopedVars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                        var result = [];

                        var updateOpertor = function updateOpertor(opertor) {
                            switch (opertor) {
                                case sqlBuilder.OP.EQ:
                                    return sqlBuilder.OP.IN;
                                case sqlBuilder.OP.NOT_EQ:
                                case sqlBuilder.OP.NOT_EQ_2:
                                    return sqlBuilder.OP.NOT_IN;
                                default:
                                    return opertor;
                            }
                        };

                        tags.forEach(function (tag) {
                            if (tag.value && tag.value[0] === '$') {
                                tag.value = _this.getTemplateValue(tag.value, scopedVars);
                                if (_.isArray(tag.value)) {
                                    if (tag.value.length === 1) {
                                        tag.value = tag.value[0];
                                    } else if (tag.value.length > 1) {
                                        tag.operator = updateOpertor(tag.operator);
                                    }
                                }
                            }

                            if (tag.value !== QueryPrompts.whereValue) {
                                if (tag.condition) {
                                    result.push(tag.condition);
                                }

                                if (_.isArray(tag.value)) {
                                    result.push(_defineProperty({}, tag.key, [tag.operator].concat(_toConsumableArray(tag.value))));
                                } else {
                                    result.push(_defineProperty({}, tag.key, [tag.operator, tag.value]));
                                }
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
                        var _this2 = this;

                        var useTemplates = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;


                        var adHoc = null;
                        var columns = _.isArray(target.columns) ? target.columns : [];
                        var query = sqlBuilder.factory();
                        var timeVar = useTemplates ? GrafanaVariables.timeFilter : { time: [sqlBuilder.OP.BETWEEN, options.timeRange.from, options.timeRange.to] };

                        if (options.adHoc && options.adHoc.length && !target.disableAdHoc) {
                            adHoc = useTemplates ? GrafanaVariables.adHocFilter : this.generateWhereFromTags(options.adHoc, options.scopedVars);
                        }

                        if (columns.length) {
                            columns = columns.filter(function (column) {
                                return column.name !== QueryPrompts.column;
                            });
                        }

                        if (columns.length === 0 || target.variable === QueryPrompts.variable) {
                            return false;
                        }

                        query.select(columns.map(function (column) {
                            return _this2.processColumn(column, target.isTablePanel);
                        }));
                        query.from(target.variable);
                        query.where([sqlBuilder.OP.AND, this.generateWhereFromTags(target.tags, options.scopedVars), adHoc, timeVar]);

                        if (target.limit) {
                            if (typeof target.limit === 'string') {
                                query.limit(target.limit);
                            } else {
                                query.limit(target.limit);
                            }
                        }

                        if (target.orderBy.column && target.orderBy.column.value && target.orderBy.column.value !== QueryPrompts.orderBy) {
                            query.orderBy([sqlBuilder.escape(target.orderBy.column.alias || target.orderBy.column.value) + ' ' + target.orderBy.sort]);
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
                    key: 'replaceVariables',
                    value: function replaceVariables(sql) {
                        var scopedVars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                        var varRegexp = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
                        var isRegExp = /REGEXP['"\s]+$/ig;
                        var result = void 0;

                        while (result = varRegexp.exec(sql)) {
                            var _result = result,
                                _result2 = _slicedToArray(_result, 1),
                                name = _result2[0];

                            // We do not want replace private variables
                            if (/^\$_/.test(name)) {
                                continue;
                            }

                            var variable = this.getTemplateValue(name, scopedVars);

                            if (variable) {
                                var quote = sql.substr(result.index - 1, 1);
                                var hasQuotes = /['"]{1}/.test(quote);

                                if (!_.isArray(variable)) {
                                    variable = [variable];
                                }

                                if (isRegExp.test(sql.substr(0, result.index))) {
                                    variable = variable.join('|');
                                } else {
                                    variable = hasQuotes ? variable.join(quote + ', ' + quote) : variable.join(', ');
                                }

                                sql = sql.replace(name, variable);
                            }
                        }

                        return sql;
                    }
                }, {
                    key: 'generateSQLQueryFromString',
                    value: function generateSQLQueryFromString(target, options) {
                        var timeFilter = 'time BETWEEN \'' + options.timeRange.from + '\' AND \'' + options.timeRange.to + '\'';
                        var interval = '' + options.interval;
                        var adhocWhere = sqlBuilder.buildWhere(this.generateWhereFromTags(options.adHoc, options.scopedVars));

                        var query = this.replaceVariables(target.nsgqlString, options.scopedVars);

                        if (query && query.indexOf(GrafanaVariables.timeFilter) > 0) {
                            query = _.replace(query, GrafanaVariables.timeFilter, timeFilter);
                        }

                        if (query && query.indexOf(GrafanaVariables.adHocFilter) > 0) {
                            var adhocString = adhocWhere ? '( ' + adhocWhere + ' )' : '';

                            query = _.replace(query, GrafanaVariables.adHocFilter, adhocString);
                        }

                        if (query && query.indexOf(GrafanaVariables.interval) > 0) {
                            query = _.replace(query, GrafanaVariables.interval, interval);
                        }

                        query = this.removeExtraConditionStatements(query);

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
                }, {
                    key: 'removeExtraConditionStatements',
                    value: function removeExtraConditionStatements(query) {
                        return query.replace(/\s+(and)\s+and\s+/ig, ' $1 ').replace(/\s+(or)\s+or\s+/ig, ' $1 ').replace(/\s+((and|or)[\s]+)(group|order|limit)\s+/ig, ' $3 ').replace(/\s+(where)[\s]+(and|or)\s+/ig, ' $1 ');
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
                        var _this3 = this;

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

                                _this3._proccessingNsgQlErrors(response);

                                return data;
                            }

                            return [];
                        }, function (err) {
                            throw {
                                message: 'Network Error: ' + err.statusText + '(' + err.status + ')',
                                data: err.data,
                                config: err.config
                            };
                        });
                    }
                }, {
                    key: 'generateTarget',
                    value: function generateTarget(nsgql) {
                        var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'json';
                        var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'A';
                        var maxDataPoints = arguments[3];

                        return {
                            nsgql: nsgql,
                            format: format,
                            id: id,
                            maxDataPoints: maxDataPoints
                        };
                    }
                }, {
                    key: '_request',
                    value: function _request(resource, data) {
                        var method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'POST';


                        var options = {
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest' },
                            method: method,
                            data: data,
                            url: this.options.baseUrl + resource
                        };

                        if (this.options.token) {
                            if (this.options.useTokenInHeader) {
                                options.headers['X-NSG-Auth-API-Token'] = this.options.token;
                            } else {
                                var query = '?' + this.$backend.$http.defaults.paramSerializer({ access_token: this.options.token });
                                options.url += query;
                            }
                        }

                        if (this.options.basicAuth || this.options.withCredentials) {
                            options.withCredentials = true;
                        }

                        if (this.options.basicAuth) {
                            options.headers.Authorization = this.options.basicAuth;
                        }

                        return this.$backend.datasourceRequest(options);
                    }
                }, {
                    key: '_proccessingNsgQlErrors',
                    value: function _proccessingNsgQlErrors(response) {
                        var errorsList = _.filter(response.data, 'error'),
                            errors = {};

                        if (errorsList.length) {
                            errorsList.forEach(function (error) {
                                errors[error.id.toUpperCase()] = error.error;
                            });

                            throw {
                                message: 'NsgQL Error',
                                data: errors,
                                config: response.config
                            };
                        }

                        return response;
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
