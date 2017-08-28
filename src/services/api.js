import SQLBuilderFactory from '../hg-sql-builder';
const sqlBuilder = SQLBuilderFactory();

/**
 * @typedef {{ token: string, baseUrl: string, endpoints: {test: string, data: string} }} INSGQLApiOptions
 */

const SQLGenerator = {
    categories: function () {
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
    facets: function (from) {
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
     */
    suggestion: function (type, from) {
        const query = sqlBuilder
            .factory()
            .setDistinct(true)
            .from(from);

        switch (type) {
            case 'device':
            case 'component':
                query.select([type]);
                query.orderBy([type]);
            break;
        }

        console.log(query.compile());
    },

    generateSQLQuery: function (target, options) {
        const query = sqlBuilder.factory();

        if (!target.columns || target.columns.length === 0) {
            return false;
        }

        query.select(target.columns.split(','));
        query.from(target.variable);
        query.where({
            time: [sqlBuilder.OP.BETWEEN, options.timeRange.from, options.timeRange.to]
        });

        return query.compile();
    }
};


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

    queryData() {
        const targets = [];
        const cacheKey = arguments[2] || false;


        if (Array.isArray(arguments[0])) {
            targets.push(...arguments[0]);
        } else {
            targets.push(this.generateTarget(arguments[0], arguments[1]));
        }

        if (cacheKey && Cache.hasOwnProperty(cacheKey)) {
            console.log('Get data from: ' + cacheKey);
            return this.$q.resolve(_.cloneDeep(Cache[cacheKey]));
        }

        return this._request(this.options.endpoints.data, {targets}, 'POST', arguments[3])
            .then(function (response) {
                if (response.status === 200) {
                    const data = response.data || response;

                    if (data && cacheKey) {
                        Cache[cacheKey] = _.cloneDeep(data);
                    }

                    return data;
                }
            });
    }

    /**
     * @param {string} nsgql
     * @param {string} format
     */
    generateTarget(nsgql, format = 'json') {
        return {
            nsgql,
            format
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
            headers: {'Content-Type': 'application/json'}
        });
    }
}


NSGQLApi.FORMAT_JSON = 'json';
NSGQLApi.FORMAT_LIST = 'list';

export {
    SQLGenerator,
    NSGQLApi
}


/*
 this.templateSrv = templateSrv;
 this.networkId = instanceSettings.jsonData.networkId || 1;
 this.accessToken = (instanceSettings.jsonData.useToken !== false && instanceSettings.jsonData.accessToken !== undefined && instanceSettings.jsonData.accessToken !== '') ? '?access_token=' + instanceSettings.jsonData.accessToken : '';
 this.endpointsBase = '/v2/query/net/' + this.networkId;
 this.endpoints = {};
 this.endpoints.category = this.endpointsBase + '/categories/' + this.accessToken;
 this.endpoints.variable = this.endpointsBase + '/variables/';
 this.endpoints.query = this.endpointsBase + '/data/' + this.accessToken;
 this.endpoints.test = '/v2/ping/net/' + this.networkId + "/test/" + this.accessToken;
 this.clearString = '-- clear selection --';
 */
    
    