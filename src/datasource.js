/*
 * Copyright (c) 2016.  Happy Gears, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import _ from 'lodash';
import {NSGQLApi, SQLQuery} from './services/api';
import utils from './services/utils';

const QueryTableNames = {
    DEVICES: 'devices'
};

/**
 * @typedef {{accessToken: string, networkId: number}} PluginOptions
 * @typedef {{url: string, jsonData: PluginOptions}} PluginSettings
 * @typedef {{}} QueryTarget
 * @typedef {{rangeRaw: {from: string, to: string} targets: QueryTarget[]}} QueryOptions
 */
 
export class NetSpyGlassDatasource {
    /**
     * @param {PluginSettings} instanceSettings
     * @param $q
     * @param backendSrv
     * @param templateSrv
     */
    constructor(instanceSettings, $q, backendSrv, templateSrv) {
        const {networkId, accessToken, useToken, addTokenToHeader} = instanceSettings.jsonData;
        const {url} = instanceSettings;

        /** @type INSGQLApiOptions */
        const options = {
            baseUrl: `${url}/v2`,
            token: useToken  && accessToken ? accessToken: false,
            useTokenInHeader: addTokenToHeader,
            basicAuth: instanceSettings.basicAuth,
            withCredentials: instanceSettings.withCredentials,
            endpoints: {
                data: `/query/net/${networkId}/data`,
                test: `/ping/net/${networkId}/test`
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
    query(options) {
        const {targets, rangeRaw} = options;
        const timeRange = {
            from: utils.getTime(rangeRaw.from, false),
            to: utils.getTime(rangeRaw.to, true),
        };
        const aliases = {};
        const adhocFilters = this.sqlQuery.correctAdhoc(this.templateSrv.getAdhocFilters(this.name));

        //this variable is used for building "raw" query in the getSQLString method
        this.queryOptions = {
            timeRange, 
            interval: options.interval, 
            adHoc: adhocFilters,
            scopedVars: options.scopedVars
        };

        const processTarget = (target) => {
            let maxDataPoints = options.maxDataPoints && target.format === 'time_series' ? options.maxDataPoints : undefined;

            aliases[target.refId] = target.alias;

            if (target.orderBy && target.orderBy.column.name === 'column') {
                target.orderBy.column.value = target.orderBy.colValue;
            }

            let sql = target.rawQuery
                ? this.sqlQuery.generateSQLQueryFromString(target, this.queryOptions)
                : this.sqlQuery.generateSQLQuery(target, this.queryOptions);

            sql = this.templateSrv.replace(sql, options.scopedVars, this._formatValue);

            return this.api.generateTarget(sql, target.format, target.refId, maxDataPoints);
        };

        const sqlTargets = targets
            .map((target) => {
                const nsgTarget = _.cloneDeep(target._nsgTarget) || {};
                nsgTarget.refId = target.refId;
                nsgTarget.hide = target.hide;
                return nsgTarget;
            })
            .filter((target) => target.hide !== true)
            .map(processTarget)
            .filter((target) => target.nsgql !== false);

        if (sqlTargets.length === 0) {
            return this.$q.resolve({data: []});
        }

        return this.api.queryData(sqlTargets)
            .then(data => this._processingGraphAliases(data, aliases))
            // needs to remove tags from data because start from v7 tags are rendered as part of the legend
            .then(data => {
                return data.map(el => {
                    delete el.tags;

                    return el;
                });
            })
            .then(list => ({data: list}));
    }

    /**
     * this is where ALIAS BY substitution happens
     */
    getSeriesName(item, alias) {
        const regex = /\$(\w+)|\[\[([\s\S]+?)]]/g;

        alias = this.templateSrv.replace(alias);

        return alias.replace(regex, function (match, g1, g2) {
            const group = g1 || g2;

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

    };

    _formatValue(value) {
        if (_.isArray(value)) {
            if (value.length === 1) {
                value = value[0];
            } else {
                return `${value.join("', '")}`;
            }
        }

        return this.templateSrv.formatValue(value);
    }


    /**
     * @param data
     * @param aliases
     * @returns {*}
     */
    _processingGraphAliases(data, aliases) {
        data.forEach(item => {
            const alias = aliases[item.id.toUpperCase()];
            if (!item || !alias) return;

            item.target = this.getSeriesName(item, alias);
        });

        return data;
    }

    /**
     * @returns {Promise}
     */
    testDatasource() {
        return this.api.ping();
    }

    /**
     * @returns {Promise}
     */
    getCategories() {
        const query = this.sqlQuery.categories();
        return this.api
            .queryData(query, NSGQLApi.FORMAT_JSON)
            .then((data) => {
                let categories = _.groupBy(data[0].rows, 'category'),
                    result = [];

                for (let category in categories) {
                    result.push({
                        text: category,
                        submenu: categories[category].map((category) => ({text: category.name, value: category.name}))
                    });
                }

                return result;
            })
            .catch(() => ([]));
    }

    /**
     * @param {string} variable
     * @returns {Promise}
     */
    getFacets(variable) {
        const query = this.sqlQuery.facets(variable);
        return this.api
            .queryData(query, NSGQLApi.FORMAT_LIST)
            .catch(() => ([]));
    }

    /**
     * @param {string} variable
     * @returns {Promise}
     */
    getTableColumns(variable){
        const query = this.sqlQuery.columns(variable);
        return this.api.queryData(query, NSGQLApi.FORMAT_TABLE)
            .then((data) => {
                return {
                    text: "columns",
                    submenu: data[0].columns.map((column) => ({text: column.text, value: column.text}))
                }
            })
            .catch(() => [])
    }

    /**
     * @param {string} variable
     * @returns {Promise}
     */
    getColumns(variable) {
        return this.$q.all([
            this.getCategories(),
            this.getFacets(variable),
            // this.getTableColumns(variable)
        ]).then((data) => {
            const [categories, tags] = data;  // c0ls
            let columns = [];

            columns.push({
                text: 'tags',
                submenu: tags.map((tag) => ({text: tag, value: tag}))
            });

            columns.push({text: '---------', separator: true});
            columns.push(this.getPredefinedColumns());
            // columns.push(cols)

            columns.push({text: '---------', separator: true});

            // columns = _.concat(columns, categories);
            columns.push({
                text: 'variables',
                submenu: categories
            });

            return columns;
        });
    }

    getPredefinedColumns() {
        return {
            text: 'predefined columns',
            submenu: [
                {text: 'address', value: 'address'},
                {text: 'boxDescr', value: 'boxDescr'},
                {text: 'combinedRoles', value: 'combinedRoles'},
                {text: 'combinedNsgRoles', value: 'combinedNsgRoles'},
                {text: 'component', value: 'component'},
                {text: 'device', value: 'device'},
                {text: 'description', value: 'description'},
                {text: 'discoveryTime', value: 'discoveryTime'},
                {text: 'freshness', value: 'freshness'},
                {text: 'metric', value: 'metric'},
                {text: 'name', value: 'name'},
                {text: 'time', value: 'time'},
                {text: 'stale', value: 'stale'},
            ]
        };
    }

    /**
     * @returns {Promise}
     */
    getSuggestions(data) {
        let query;

        query = this.sqlQuery.suggestion(
            data.type, 
            data.variable, 
            data.tags,
            data.scopedVars
        );
        
        query = this.templateSrv.replace(query, data.scopedVars);

        return this.api
            .queryData(query, NSGQLApi.FORMAT_LIST)
            .catch(() => []);
    }

    /**
     * @returns {String}
     */
    getSQLString(target) {
        return this.sqlQuery.generateSQLQuery(target, this.queryOptions, true);
    }

    /**
     * @param query
     * @returns {Promise}
     */
    metricFindQuery(query) {
        query = this.sqlQuery.replaceVariables(query);
        query = this.templateSrv.replace(query, null, this._formatValue);

        return this.api
            .queryData(query, NSGQLApi.FORMAT_LIST).then(data => {
                return data.map(el => ({text: el}));
            })
            .catch(() => ([]));
    }

    /**
     * Use to get tagFacets names for AdHoc Filter
     * @returns {Promise}
     */
    getTagKeys() {
        return this.api.queryData(this.sqlQuery.getTagKeysForAdHoc(), NSGQLApi.FORMAT_LIST)
            .then((list) => list.map((item) => ({text: item})))
            .catch(() => ([]));
    };

    /**
     * Use to get tags names for AdHoc Filter
     * @param {object} options
     * @param {string} options.key - tagFacet name
     * @returns {Promise}
     */
    getTagValues(options) {
        const queries = this.sqlQuery.getTagValuesForAdHoc(options.key)
            .map(query => (this.api.generateTarget(query, NSGQLApi.FORMAT_LIST)));

        return this.api.queryData(queries)
            .then((list) => {
                return list
                    .filter((item, pos, self) => self.indexOf(item) === pos)
                    .map((item) => {
                        if (item.error) {
                            console.log(item.error);
                            return;
                        }
                        return {text: item}
                    })
                    .filter(Boolean);
            })
            .catch(() => ([]));
    };

    /**
     *
     */
    getCombinedList(variable) {
        return this.getFacets(variable)
            .then((tags) => {
                const list = [];

                list.push({
                    text: 'tags',
                    submenu: tags.map((tag) => ({text: tag, value: tag}))
                });

                list.push({text: '---------', separator: true});

                list.push(this.getPredefinedColumns());

                return list;
            });
    }
}