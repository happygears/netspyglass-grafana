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
        const {networkId, accessToken} = instanceSettings.jsonData;
        const {url} = instanceSettings;

        /** @type INSGQLApiOptions */
        const options = {
            baseUrl: `${url}/v2`,
            token: accessToken || false,
            endpoints: {
                data: `/query/net/${networkId}/data`,
                test: `/ping/net/${networkId}/test`
            }
        };

        this.api = new NSGQLApi(backendSrv, $q, options);
        this.$q = $q;
        this.templateSrv = templateSrv;
        this.sqlQuery = new SQLQuery(templateSrv)
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

        const processTarget = (target) => {
            const sql = target.rawQuery
                ? this.sqlQuery.generateSQLQueryFromString(target, {timeRange, interval: options.interval})
                : this.sqlQuery.generateSQLQuery(target, {timeRange, interval: options.interval});

            return this.api.generateTarget(sql, target.format, target.refId);
        };

        const sqlTargets = targets
            .map(processTarget)
            .filter((target) => target.nsgql !== false);

        if (sqlTargets.length === 0) {
            return this.$q.resolve({data: []});
        }

        return this.api.queryData(sqlTargets).then((list) => {
            let errorsList = _.filter(list, 'error'),
                errors = {};
            let data = {data: list};

            if (errorsList.length) {
                errorsList.forEach((error) => {
                    errors[error.id] = error.error;
                });

                throw errors;
            }

            return data;
        });
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
            });
    }

    /**
     * @param {string} variable
     * @returns {Promise}
     */
    getFacets(variable) {
        const query = this.sqlQuery.facets(variable);
        return this.api.queryData(query, NSGQLApi.FORMAT_LIST);
    }

    /**
     * @param {string} variable
     * @returns {Promise}
     */
    getColumns(variable) {
        return this.$q.all([
            this.getCategories(),
            this.getFacets(variable)
        ]).then(function (data) {
            const [categories, tags] = data;
            let columns = [];

            columns.push({
                text: 'tags',
                submenu: tags.map((tag) => ({text: tag, value: tag}))
            });

            columns.push({text: '---------', separator: true});
            columns.push({
                text: 'Pre Defined columns',
                submenu: [
                    {text: 'metric', value: 'metric'},
                    {text: 'time', value: 'time'}
                ]
            });

            columns.push({text: '---------', separator: true});
            columns = _.concat(columns,categories);

            return columns;
        });
    }

    /**
     * @returns {Promise}
     */
    getSuggestions(data) {
        let query;

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

    /**
     * @returns {String}
     */
    getSQLString(target) {
        return this.sqlQuery.generateSQLQuery(target, {}, true);
    }

    /**
     * @param query
     * @returns {Promise}
     */
    metricFindQuery(query) {
        return this.api.queryData(query, NSGQLApi.FORMAT_LIST).then(data => {
            return data.map(el => ({text: el}));
        });
    }
}