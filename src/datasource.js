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
import * as dateMath from './datemath';
import {NSGQLApi, SQLGenerator} from './services/api';
import {QueryPrompts} from './dictionary';
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
    constructor(instanceSettings, $q, backendSrv, templateSrv, $timeout) {
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
        this.$timeout = $timeout;
        this.instanceSettings = instanceSettings;
    }

    /**
     * @description This function is called when plugin builds a graph
     * @param options {QueryOptions} an object built from the data entered in the query dialog
     * @returns {Promise}
     */
    query(options) {
        const timeRange = {
            from: utils.getTime(options.rangeRaw.from, false),
            to: utils.getTime(options.rangeRaw.to, true),
        };

        const sqlTargets = options.targets
            .map((target) => {
                if( !target.rawQuery ) {
                    return this.api.generateTarget(SQLGenerator.generateSQLQuery(target, {timeRange, interval: options.interval}), target.format, target.refId);
                } else {
                    return this.api.generateTarget(SQLGenerator.generateSQLQueryFromString(target, {timeRange, interval: options.interval}), target.format, target.refId)
                }
            })
            .filter((target) => target.nsgql !== false);

        if (sqlTargets.length === 0) {
            return this.$q.resolve({data: []});
        }

        return this.api.queryData(sqlTargets/* , null, 'query_cache' */).then((list) => {
            let errorsList = _.filter(list,'error'),
                errors = {};
            let data = {data: list};

            if( errorsList.length ) {
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
        const query = SQLGenerator.categories();
        return this.api
            .queryData(query, NSGQLApi.FORMAT_JSON/* , 'categories_cache' */)
            .then((data) => _.groupBy(data[0].rows, 'category'));
    }

    /**
     * @param {string} variable
     * @returns {Promise}
     */
    getFacets(variable) {
        const query = SQLGenerator.facets(variable);
        return this.api.queryData(query, NSGQLApi.FORMAT_LIST/* , 'facets_cache' */);
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
            const columns = [];

            columns.push({
                text: 'tags',
                submenu: tags.map((tag) => ({text: tag, value: tag}))
            });

            columns.push({text: '---------'});

            columns.push({
                text: 'predefined',
                submenu: [
                    {text: 'metric', value: 'metric'},
                    {text: 'time', value: 'time'}
                ]
            });

            columns.push({text: '---------'});

            for (let category in categories) {
                columns.push({
                    text: category,
                    submenu: categories[category].map((category) => ({text: category.name, value:  category.name}))
                });
            }

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
                query = SQLGenerator.suggestion(data.type, data.variable, data.tags);
                break;
            default:
                query = SQLGenerator.suggestion(data.type, QueryTableNames.DEVICES);
                break;
        }
        // return this.api.queryData(query, NSGQLApi.FORMAT_LIST);
        return this.api.queryData(query, NSGQLApi.FORMAT_LIST);
    }

    /**
     * @returns {String}
     */
    getSQLString(target) {
        return SQLGenerator.generateSQLQuery(target, {}, true);
    }
}