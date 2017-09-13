import SQLBuilderFactory from '../hg-sql-builder';
import {QueryPrompts} from '../dictionary';
import {GrafanaVariables} from '../dictionary';
import angular from 'angular';

const sqlBuilder = SQLBuilderFactory();

/**
 * @typedef {{ token: string, baseUrl: string, endpoints: {test: string, data: string} }} INSGQLApiOptions
 */

class SQLQuery {

    constructor(templateSrv) {
        this.templateSrv = templateSrv;
    }

    processColumn(column) {
        if (angular.isString(column)) {
            return column;
        }

        if (angular.isObject(column)) {
            let columnName = column.name;

            if (column.appliedFunctions && angular.isArray(column.appliedFunctions) && column.appliedFunctions.length) {
                columnName = `${column.appliedFunctions.map(((func) => func.name)).join('(')}(${columnName}${')'.repeat(column.appliedFunctions.length)}`;
            }

            if (column.alias) {
                columnName += ` as ${column.alias}`;
            }

            return columnName;
        }

        throw new Error('Unknow column type!');
    }

    categories() {
        return sqlBuilder.factory({
            select: ['category', 'name'],
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
            orderBy: ['tagFacet']
        }).compile();
    }

    /**
     * @param {string} type
     * @param {string} from
     * @param {array} tags
     */
    suggestion(type, from, tags = []) {
        const query = sqlBuilder
            .factory()
            .setDistinct(true)
            .from(from)
            .select([type])
            .orderBy([type]);

        switch (type) {
            case 'device':
            case 'component':
                query.where(this.generateWhereFromTags(tags));
                break;
            default:
                query.where({
                    [type]: [sqlBuilder.OP.NOT_NULL]
                });
                break;
        }

        return query.compile();
    }

    /**
     * @param {array} tags
     * @returns {array}
     */
    generateWhereFromTags(tags) {
        let result = [];

        tags.forEach((tag) => {
            if (tag.value !== QueryPrompts.whereValue) {
                if (tag.condition) {
                    result.push(tag.condition);
                }

                result.push({
                    [tag.key]: [tag.operator, this.templateSrv.replace(tag.value)]
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
        const query = sqlBuilder.factory();
        const timeVar = useTemplates ? GrafanaVariables.timeFilter : {
            time: [sqlBuilder.OP.BETWEEN, options.timeRange.from, options.timeRange.to]
        };
        const columns = (target.columns || [])
            .filter((column) => column.name !== QueryPrompts.column);

        if (columns.length === 0) {
            return false;
        }

        query.select(columns.map(this.processColumn));
        query.from(target.variable);
        query.where([
            sqlBuilder.OP.AND,
            this.generateWhereFromTags(target.tags),
            timeVar
        ]);

        if (target.limit) {
            query.limit(target.limit);
        }

        if (target.orderBy.column && target.orderBy.column !== QueryPrompts.orderBy) {
            query.orderBy([`${target.orderBy.column} ${target.orderBy.sort}`]);
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

    generateSQLQueryFromString(target, options) {
        const timeFilter = `time BETWEEN '${options.timeRange.from}' AND '${options.timeRange.to}'`;
        const interval = `${options.interval}`;

        let query = target.nsgqlString;

        if (query && query.indexOf(GrafanaVariables.timeFilter) > 0) {
            query = _.replace(query, GrafanaVariables.timeFilter, timeFilter);
        }

        if (query && query.indexOf(GrafanaVariables.interval) > 0) {
            query = _.replace(query, GrafanaVariables.interval, interval);
        }

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
}


const Cache = {};

Object.defineProperty(Cache, 'sync', {
    value: function (save = false) {
        if (save) {
            localStorage.setItem('cache', JSON.stringify(this));
        } else {
            const cache = localStorage.getItem('cache');
            if (cache) {
                const cacheObj = JSON.parse(cache);
                angular.extend(this, cacheObj);
            }
        }
    },
    writable: false,
    enumerable: false,
    configurable: false
});

Cache.sync();

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
            .then(function (response) {
                if (response.status === 200) {
                    const data = response.data || response;

                    if (data && cacheKey) {
                        Cache[cacheKey] = _.cloneDeep(data);
                        Cache.sync(true);
                    }

                    return data;
                }
            });
    }

    /**
     * @param {string} nsgql
     * @param {string} format
     * @param {string} id
     */
    generateTarget(nsgql, format = 'json', id = 'A') {
        return {
            nsgql,
            format,
            id
        };
    }

    /**
     * @description Makes actual API call to NetSpyGlass server
     * @param {string} resource
     * @param {object} data
     * @param {string} method
     */
    _request(resource, data, method = 'POST') {
        let query = '?';

        if (this.options.token) {
            query += this.$backend.$http.defaults.paramSerializer({access_token: this.options.token});
        }

        return this.$backend.datasourceRequest({
            url: this.options.baseUrl + resource + query,
            data: data,
            method: method,
            timeout: 30000,
            headers: {'Content-Type': 'application/json'}
        });
    }
}


NSGQLApi.FORMAT_JSON = 'json';
NSGQLApi.FORMAT_LIST = 'list';

export {
    SQLQuery,
    NSGQLApi
}