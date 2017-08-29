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
            .map((item) => SQLGenerator.generateSQLQuery(item, {timeRange}))
            .filter((item) => item !== false)
            .map((item) => this.api.generateTarget(item, item.format));

        if (sqlTargets.length === 0) {
            return this.$q.resolve({data: []});
        }

        return this.api.queryData(sqlTargets)
            .then(function(list) {
                return {data: list};
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
            .queryData(query, NSGQLApi.FORMAT_JSON, 'categories_cache')
            .then((data) => _.groupBy(data[0].rows, 'category'));
    }

    /**
     * @param {string} variable
     * @returns {Promise}
     */
    getFacets(variable) {
        const query = SQLGenerator.facets(variable);
        return this.api.queryData(query, NSGQLApi.FORMAT_LIST, `facet_cache_${variable}`);
    }

    /**
     * @returns {Promise}
     */
    getSuggestions(data) {
        let query;

        switch (data.type) {
            case 'device':
            case 'component':
                query = SQLGenerator.suggestion(data.type, data.variable);
                break;
            default:
                query = SQLGenerator.suggestion(data.type, QueryTableNames.DEVICES);
                break;
        }
        // return this.api.queryData(query, NSGQLApi.FORMAT_LIST);
        return this.api.queryData(query, NSGQLApi.FORMAT_LIST, `suggestions_cache_${data.type}`);

        // function _buildTagsWhere(tags) {
        //     const result = [];
        //
        //     tags.forEach((tag) => {
        //         if (tag.value !== QueryPrompts.whereValue) {
        //             if (tag.condition) {
        //                 result.push(tag.condition);
        //             }
        //
        //             result.push({
        //                 [tag.key]:[tag.operator, tag.value]
        //             });
        //         }
        //     });
        //
        //     if (result.length) {
        //         result.unshift('AND');
        //         return result;
        //     }
        //
        //     return false;
        // }
        //
        //
        // console.log(_buildTagsWhere(data.tags));
        //
        // return this.$q.resolve([]);
    }
}