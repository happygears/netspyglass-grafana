import SQLBuilderFactory from '../hg-sql-builder';
import {GrafanaVariables, QueryPrompts} from '../dictionary';
import utils from './utils';
import angular from 'angular';
import _ from 'lodash';

const sqlBuilder = SQLBuilderFactory();

/**
 * @typedef {{ token: string, baseUrl: string, endpoints: {test: string, data: string} }} INSGQLApiOptions
 */

class SQLQuery {

    constructor(templateSrv) {
        this.templateSrv = templateSrv;
    }

    processColumn(column, needToCreateAliases = false) {
        if (angular.isString(column)) {
            return column;
        }

        if (angular.isObject(column) && !angular.isArray(column)) {
            let columnName = utils.compileColumnName(column);

            if (column.alias) {
                columnName += ` as ${sqlBuilder.escape(column.alias)}`;
            } else if (needToCreateAliases) {
                let alias = utils.compileColumnAlias(column);
                if (alias !== columnName) {
                    columnName += ` as ${sqlBuilder.escape(alias)}`;
                }
            }

            return columnName;
        }

        throw new Error('Unknow column type!');
    }

    categories() {
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

    /**
     * @param from {string}
     * @returns {*}
     */
    facets(from) {
        return sqlBuilder.factory({
            select: ['tagFacet'],
            distinct: true,
            from: from,
            orderBy: ['tagFacet'],
            where: ['AND', {
                tagFacet: [sqlBuilder.OP.NOT_NULL]
            }]
        }).compile();
    }

    /**
     * @param {string} type
     * @param {string} from
     * @param {array} tags
     */
    suggestion(type, from, tags = [], scopedVars) {
        const query = sqlBuilder
            .factory()
            .setDistinct(true)
            .from(from)
            .select([type])
            .orderBy([type]);

        switch (type) {
            case 'device':
            case 'component':
                query.where(this.generateWhereFromTags(tags, scopedVars));
                break;
            default:
                query.where([
                    sqlBuilder.OP.AND,
                    {[type]: [sqlBuilder.OP.NOT_NULL]},
                    this.generateWhereFromTags(tags, scopedVars)
                ]);
                break;
        }

        return query.compile();
    }

    /**
     * @returns {String} String that contain nsgql
     */
    getTagKeysForAdHoc() {
        return sqlBuilder.factory({
            select: ['facet'],
            from: 'tags',
            orderBy: ['facet']
        }).compile();
    }

    /**
     * @param {String} tagFacet
     * @returns {Array} array of targets with format {nsgql: 'select ..', format: 'list'}
     */
    getTagValuesForAdHoc(tagFacet) {
        return [
            sqlBuilder.factory({
                select: [tagFacet],
                distinct: true,
                from: 'devices',
                where: {
                    [tagFacet]: [sqlBuilder.OP.NOT_NULL]
                },
                orderBy: [tagFacet]
            }).compile(),
            
            sqlBuilder.factory({
                select: [tagFacet],
                distinct: true,
                from: 'interfaces',
                where: {
                    [tagFacet]: [sqlBuilder.OP.NOT_NULL]
                },
                orderBy: [tagFacet]
            }).compile(),
        ];
    }

    getTemplateValue (str, scopedVars) {
        const name = str.substr(1);
        
        if (name in scopedVars) {
            return scopedVars[name].value;
        }

        const variable = _.find(this.templateSrv.variables, {name});

        if (variable) {
            if (this.templateSrv.isAllValue(variable.current.value)) {
                return this.templateSrv.getAllValue(variable);
            } else {
                return _.cloneDeep(variable.current.value);
            }
        }

        return str;
    }

    /**
     * @param {array} tags
     * @returns {array}
     */
    generateWhereFromTags(tags = [], scopedVars = {}) {
        let result = [];

        const updateOpertor = function(opertor) {
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

        tags.forEach((tag) => {
            if (tag.value && tag.value[0] === '$') {
                tag.value = this.getTemplateValue(tag.value, scopedVars);
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
                    result.push({
                        [tag.key]: [tag.operator, ...tag.value]
                    });
                } else {
                    result.push({
                        [tag.key]: [tag.operator, tag.value]
                    });
                }   
            }

            if (
                tag.value === QueryPrompts.whereValue &&
                ["NOTNULL", "ISNULL"].indexOf(tag.operator) > -1
            ) {
                result.push({
                    [tag.key]: [tag.operator],
                });
            }
        });

        if (result.length) {
            result.unshift('AND');
            return result;
        }

        return null;
    }

    generateSQLQuery(target, options, useTemplates = false) {
        
        let adHoc = null;
        let columns = _.isArray(target.columns) ? target.columns : [];
        const query = sqlBuilder.factory();
        const timeVar = useTemplates 
            ? GrafanaVariables.timeFilter
            : { time: [sqlBuilder.OP.BETWEEN, options.timeRange.from, options.timeRange.to]};

        if (options.adHoc && options.adHoc.length && !target.disableAdHoc) {
            adHoc = useTemplates 
                ? GrafanaVariables.adHocFilter 
                : this.generateWhereFromTags(options.adHoc, options.scopedVars);
        }

        if (columns.length) {
            columns = columns.filter((column) => column.name !== QueryPrompts.column);
        }

        if (columns.length === 0 || target.variable === QueryPrompts.variable) {
            return false;
        }

        query.select(columns.map(column => this.processColumn(column,target.isMultiColumnMode)));
        query.from(target.variable);
        query.where([
            sqlBuilder.OP.AND,
            this.generateWhereFromTags(target.tags, options.scopedVars),
            adHoc,
            timeVar
        ]);

        if (target.limit) {
            if (typeof target.limit === 'string') {
                query.limit(target.limit);
            } else {
                query.limit(target.limit);
            }
        }

        if (target.orderBy.column && target.orderBy.column.value && target.orderBy.column.value !== QueryPrompts.orderBy) {
            query.orderBy([`${sqlBuilder.escape(target.orderBy.column.alias || target.orderBy.column.value)} ${target.orderBy.sort}`]);
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

    replaceVariables(sql, scopedVars = {}) {
        const varRegexp = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
        const isRegExp  = /REGEXP['"\s]+$/ig;
        let result;

        while (result = varRegexp.exec(sql)) {
            const [name] = result; 

            // We do not want replace private variables
            if (/^\$_/.test(name)) {
                continue;
            }

            let variable = this.getTemplateValue(name, scopedVars);

            // We do not want replace variables with value that store in Grafana private variables
            // Corner case #NET-2824
            if (/^\$_/.test(variable)) {
                continue;
            }

            if (variable) {
                let quote = sql.substr(result.index - 1, 1);
                let hasQuotes = /['"]{1}/.test(quote);

                if (!_.isArray(variable)) {
                    variable = [variable];
                }

                if (isRegExp.test(sql.substr(0, result.index))) {
                    variable = variable.join('|');
                } else {
                    variable = hasQuotes ? variable.join(`${quote}, ${quote}`) : variable.join(`, `);
                }

                sql = sql.replace(name, variable);
            }
        }

        return sql;
    }

    generateSQLQueryFromString(target, options) {
        const timeFilter = `time BETWEEN '${options.timeRange.from}' AND '${options.timeRange.to}'`;
        const interval = `${options.interval}`;
        const adhocWhere = sqlBuilder.buildWhere(this.generateWhereFromTags(options.adHoc, options.scopedVars));

        let query = this.replaceVariables(target.nsgqlString, options.scopedVars);

        if (query && query.indexOf(GrafanaVariables.timeFilter) > 0) {
            query = _.replace(query, GrafanaVariables.timeFilter, timeFilter);
        }

        if (query && query.indexOf(GrafanaVariables.adHocFilter) > 0) {
            const adhocString = adhocWhere ? `( ${adhocWhere} )` : '';

            query = _.replace(query, GrafanaVariables.adHocFilter, adhocString);
        }

        if (query && query.indexOf(GrafanaVariables.interval) > 0) {
            query = _.replace(query, GrafanaVariables.interval, interval);
        }

        query = this.removeExtraConditionStatements(query);

        return query;
    }

    generateGroupByValue(target, options, useTemplates = false) {
        switch (target.groupBy.type) {
            case 'time':
                const groupByValue = target.groupBy.value === GrafanaVariables.interval && !useTemplates ? options.interval : target.groupBy.value;
                return `time(${groupByValue})`;
                break;
            case 'column':
                return target.groupBy.value;
                break;
        }
    }

    correctAdhoc(adhocFilters) {
        return adhocFilters.map((el) => {
            switch (el.operator) {
                case '=~':
                    el.operator = sqlBuilder.OP.REGEXP;
                    break;
                case '!~':
                    el.operator = sqlBuilder.OP.NOT_REGEXP;
                    break;
            }

            return el;
        })
    }

    removeExtraConditionStatements(query) {
        return query
            .replace(/\s+(and)\s+and\s+/ig, ' $1 ')
            .replace(/\s+(or)\s+or\s+/ig, ' $1 ')
            .replace(/\s+((and|or)[\s]+)(group|order|limit)\s+/ig, ' $3 ')
            .replace(/\s+(where)[\s]+(and|or)\s+/ig, ' $1 ');
    }
}


const Cache = {};
class NSGQLApi {
    /**
     * @param $backend
     * @param $q
     * @param options {INSGQLApiOptions}
     */
    constructor($backend, $q, options) {
        this.$backend = $backend;
        this.$q = $q;
        this.options = options;
    }

    /**
     * @returns {Promise}
     */
    ping() {
        return this
            ._request(this.options.endpoints.test, {}, 'get')
            .then((response) => {
                if (response.status === 200) {
                    return {
                        title: 'Success',
                        status: 'success',
                        message: 'Data source is working'
                    };
                }
            });
    }

    /**
     * @param {Array|string} target - This param will be string that contain nsgql or array of targets with format {nsgql: 'select ..', format: 'list'}
     * @param {string} format - Using only if first param is string. Specify format for nsgql query with single target
     * @param {string} cacheKey - Use for caching requests by given key
     * @param {boolean} reloadCache - Use for ignoring existing cache and get data from server. Then data will stored in cache.
     * @return {Promise}
     */
    queryData() {
        const targets = [];
        const [ , , cacheKey = false, reloadCache = false] = arguments;

        if (Array.isArray(arguments[0])) {
            targets.push(...arguments[0]);
        } else {
            targets.push(this.generateTarget(arguments[0], arguments[1]));
        }

        if (cacheKey && Cache.hasOwnProperty(cacheKey) && !reloadCache) {
            return this.$q.resolve(_.cloneDeep(Cache[cacheKey]));
        }

        return this._request(this.options.endpoints.data, {targets}, 'POST')
            .then((response) => {
                if (response.status === 200) {
                    const data = response.data || response;

                    if (data && cacheKey) {
                        Cache[cacheKey] = _.cloneDeep(data);
                    }

                    this._proccessingNsgQlErrors(response);

                    return data;
                }

                return [];
            }, (err) => {
                throw {
                    message: 'Network Error: ' + err.statusText + '(' + err.status + ')',
                    data: err.data,
                    config: err.config,
                };
            });
    }

    /**
     * @param {string} nsgql
     * @param {string} format
     * @param {string} id
     * @param {number} maxDataPoints
     */
    generateTarget(nsgql, format = 'json', id = 'A', maxDataPoints) {
        return {
            nsgql,
            format,
            id,
            maxDataPoints
        };
    }

    /**
     * @description Makes actual API call to NetSpyGlass server
     * @param {string} resource
     * @param {object} data
     * @param {string} method
     */
    _request(resource, data, method = 'POST') {
        
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'},
            method: method,
            url: this.options.baseUrl + resource
        };

        if (method.toUpperCase() !== 'GET') {
            options.data = data;
        }

        if (this.options.token) {
            if (this.options.useTokenInHeader) {
                options.headers['X-NSG-Auth-API-Token'] = this.options.token;
            } else {
                let query =  `?access_token=${encodeURIComponent(this.options.token)}`;
                // this.$backend.$http.
                //     defaults.paramSerializer({access_token: this.options.token});
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

    /**
     * @param response
     * @returns {*}
     */
    _proccessingNsgQlErrors(response) {
        let errorsList = _.filter(response.data, 'error'),
            errors = {};

        if (errorsList.length) {
            errorsList.forEach((error) => {
                errors[(error.id).toUpperCase()] = error.error;
            });

            throw {
                message: `NsgQL Error`,
                data: errors,
                config: response.config,
            }
        }

        return response;
    }
}


NSGQLApi.FORMAT_JSON = 'json';
NSGQLApi.FORMAT_LIST = 'list';

export {
    SQLQuery,
    NSGQLApi
}