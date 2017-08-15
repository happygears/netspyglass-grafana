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

import _ from "lodash";
import * as dateMath from './datemath';

export class NetSpyGlassDatasource {

    static mapToTextValue(result) {
        return _.map(result.data, (d, i) => {
            return {text: d, value: i};
        });
    }

    static mapToTextText(result) {
        return _.map(result.data, (d, i) => {
            return {text: d, value: d};
        });
    }

    /**
     * we get tag matches from the dialog in the form
     *
     * [{"tagFacet":"Explicit","tagWord":"core","tagOperation":"=="}, {"tagFacet":"Vendor","tagWord":"Cisco","tagOperation":"<>"}]
     *
     * transform this to
     *
     * "Explicit.core, !Vendor.Cisco"
     *
     */
    static transformTagMatch(tagMatches) {
        var tags = [];
        var idx;
        for (idx = 0; idx < tagMatches.length; idx++) {
            var tm = tagMatches[idx];
            var tt = ((tm.tagOperation === '<>') ? '!' : '') + tm.tagFacet + ((tm.tagWord !== '') ? ('.' + tm.tagWord) : '');
            tags.push(tt);
        }
        return tags.join(',');
    }

    constructor(instanceSettings, $q, backendSrv, templateSrv) {
        this.type = instanceSettings.type;
        this.url = instanceSettings.url;
        this.name = instanceSettings.name;
        this.$q = $q;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;
        this.networkId = instanceSettings.jsonData.networkId || 1;
        this.accessToken = (instanceSettings.jsonData.useToken !== false && instanceSettings.jsonData.accessToken !== undefined && instanceSettings.jsonData.accessToken !== '') ? '?access_token=' + instanceSettings.jsonData.accessToken : '';
        this.endpointsBase = '/v2/query/net/' + this.networkId;
        this.endpoints = {};
        this.endpoints.category = this.endpointsBase + '/categories/' + this.accessToken;
        this.endpoints.variable = this.endpointsBase + '/variables/';
        this.endpoints.query = this.endpointsBase + '/data/' + this.accessToken;
        this.endpoints.test = '/v2/ping/net/' + this.networkId + "/test/" + this.accessToken;

        this.blankDropDownElement = '---';

        this.blankValues = {};
        this.blankValues.alias = '';
        this.blankValues.variable = 'select variable';
        this.blankValues.device = 'select device';
        this.blankValues.component = 'select component';
        this.blankValues.description = '';
        this.blankValues.sortByEl = 'select sorting';
        this.blankValues.selector = ' -- ';
        this.blankValues.aggregator = ' -- ';
        this.blankValues.limit = 'select limit';
        this.blankValues.group = 'select group';
        this.blankValues.tagFacet = this.blankDropDownElement;
        this.blankValues.tagWord = this.blankDropDownElement;
        this.blankValues.interval = 'select interval';
        this.blankValues.tagData = [];
        this.blankValues.tags = '';
        this.blankValues.format = '';
        this.blankValues.columns = '';
        this.blankValues.unique = '';
        this.blankValues.refId = '';

        this.clearString = '-- clear selection --';
    }

    /**
     * makes actual API call to NetSpyGlass server
     *
     * @param endpoint   API call endpoint
     * @param method     GET or POST
     * @param query      query object
     * @returns {*}
     * @private
     */
    _apiCall(endpoint, method, query) {
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: query,
            method: method,
            headers: {'Content-Type': 'application/json'}
        });
    }

    /**
     * this function is called when plugin builds a graph
     *
     * @param options   an object built from the data entered in the query dialog
     * @returns {*}
     */
    query(options) {
        let i,
            aliases = {};

        for (let i = 0; i < options.targets.length; i++) {
            let targetDlg = options.targets[i];
            aliases[targetDlg.refId] = targetDlg.alias;
        }

        var response = this._apiCall(this.endpoints.query, 'POST', {
            targets: this.buildQueryFronNsgQlStirng(options),
        });

        return response.then( response => {
            return response;
        });
    }

    executeQuery(nsgql, format) {
        return this._apiCall(this.endpoints.query, 'POST',
            {'targets':[{
                'nsgql': nsgql,
                'format': format
            }]},
        ).then( response => {
            var data = response.data;
            if (!data) return response;

            console.log(data);

            return data;
        })
    }

    /**
     * this is where ALIAS BY substitution happens
     */
    getSeriesName(series, alias) {
        // NSGDB-82: we want to be able to use template vars as aliases
        var aliasWithVarsReplaced = this.templateSrv.replace(alias);

        var regex = /\$(\w+)|\[\[([\s\S]+?)]]/g;
        return aliasWithVarsReplaced.replace(regex, function(match, g1, g2) {
            var group = g1 || g2;

            if (group === 'm' || group === 'measurement' || group === 'variable') { return series.variable; }
            if (group === 'device') return series.device;
            if (group === 'component') return series.component;
            if (group === 'description') return series.description;

            // if variable has no tags, we can't substitute tag words
            if (!series.tags) { return match; }

            // see if it is tag facet
            var tag = series.tags[group];
            if (typeof tag === 'undefined') return match;
            return tag;
        });
    };

    // Required
    // Used for testing datasource in datasource configuration page
    testDatasource() {
        var endpoint = this.endpoints.test;
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            method: 'GET'
        }).then(response => {
            if (response.status === 200) {
                return {status: "success", message: "Data source is working", title: "Success"};
            }
        });
    }

    annotationQuery(options) {
        var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
        var annotationQuery = {
            range: options.range,
            annotation: {
                name: options.annotation.name,
                datasource: options.annotation.datasource,
                enable: options.annotation.enable,
                iconColor: options.annotation.iconColor,
                query: query
            },
            rangeRaw: options.rangeRaw
        };
        return this.backendSrv.datasourceRequest({
            url: this.url + '/annotations' + this.accessToken,
            method: 'POST',
            data: annotationQuery
        }).then(result => {
            return result.data;
        });
    }

    /**
     * generic query. Grafana calls this function when it needs to get list of values for a dashboard
     * template variable.
     *
     * User enters query in JSON Format, e.g.
     *
     * {"variable":"cpuUtil","columns":"device"}
     *
     * User is responsible for setting value of the "columns" to what they want to receive back. This can be
     * "device", "component" or tag facet
     *
     * This function forces request type=table even if user specified something else.
     *
     * Server returns data in the following format:
     *
     * [ {
     *   "columns" : [ { "text" : "device" } ],
     *   "rows" : [ [ "synas1" ], [ "ex2200" ] ],
     *   "type" : "table"
     * } ]
     *
     * "rows" is a list of lists because normally this query can return multiple columns.
     * For the purpose of dashboard template we use only the first column if request specified multiple.
     *
     * @param query     query object as text string
     * @returns {Promise.<TResult>}
     */
    metricFindQuery(query) {
        var interpolated;
        try {
            interpolated = this.templateSrv.replace(query, query.scopedVars);
        } catch (err) {
            return this.$q.reject(err);
        }
        var data = this.buildQueryFromText(interpolated);
        var target = data.targets[0];
        target.format = 'list';
        return this._apiCall(this.endpoints.query, 'POST', JSON.stringify(data)).then(NetSpyGlassDatasource.mapToTextText);
    }

    findCategoriesQuery() {
        return this._apiCall(this.endpoints.category, 'POST', '').then(NetSpyGlassDatasource.mapToTextValue);
    }

    findVariablesQuery(options) {
        var endpoint = this.endpoints.variable + options.category + this.accessToken;
        return this._apiCall(endpoint, 'POST', '').then(NetSpyGlassDatasource.mapToTextValue);
    }

    findDevices(options) {
        var data = this.buildQuery(options);
        var target = data.targets[0];
        target.device = '';  // erase to ignore current selection in the dialog
        target.component = '';
        target.columns = 'device';
        target.unique = 'device';
        target.sortByEl = 'device:ascending';
        target.format = 'list';
        target.limit = -1;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.mapToTextText);
    }

    findComponents(options) {
        var data = this.buildQuery(options);
        var target = data.targets[0];
        target.component = '';  // erase to ignore current selection in the dialog
        target.columns = 'component';
        target.unique = 'component';
        target.sortByEl = 'component:ascending';
        target.format = 'list';
        target.limit = -1;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.mapToTextText);
    }

    findTagFacets(options, index) {
        var clonedOptions = jQuery.extend(true, {}, options);
        clonedOptions.tagData[index].tagFacet = '';
        clonedOptions.tagData[index].tagWord = '';
        var data = this.buildQuery(clonedOptions);
        var target = data.targets[0];
        target.columns = 'tagFacet';
        target.unique = 'tagFacet';
        target.sortByEl = 'tagFacet:ascending';
        target.format = 'list';
        target.limit = -1;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.mapToTextText);
    }

    findTagWordsQuery(options, index) {
        var clonedOptions = jQuery.extend(true, {}, options);
        var facet = clonedOptions.tagData[index].tagFacet;
        clonedOptions.tagData[index].tagWord = '';
        var data = this.buildQuery(clonedOptions);
        var target = data.targets[0];
        target.columns = facet;
        target.unique = facet;
        target.sortByEl = facet + ':ascending';
        target.format = 'list';
        target.limit = -1;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.mapToTextText);
    }

    /**
     * when building graphing query, this function is called with JS object that has at least
     * attribute 'targets'
     *
     * This must include all fields we support in queries, both constructed from the query dialog
     * (where each field corresponds to the input element in the dialog) and from the input field in
     * the dashboard templates where user enters query as json.
     *
     * field "description" is allowed in dashboard template query but does not have corresponding
     * input field in the query dialog at this time.
     */
    templateSrvParameters(queryObject) {
        queryObject.targets = _.map(queryObject.targets, target => {
            var updatedTarget = jQuery.extend(true, {}, target);
            updatedTarget.category = this.replaceTemplateVars(updatedTarget.category);
            updatedTarget.device = this.replaceTemplateVars(updatedTarget.device);
            updatedTarget.component = this.replaceTemplateVars(updatedTarget.component);
            updatedTarget.description = this.replaceTemplateVars(updatedTarget.description);
            updatedTarget.limit = (updatedTarget.limit === '') ? -1 : updatedTarget.limit;
            // target.alias = this.replaceTemplateVars(target.alias);
            return updatedTarget;
        });
        return queryObject;
    }

    replaceTemplateVars(field) {
        if (typeof field === 'undefined') return field;
        var replaced = this.templateSrv.replace(field);
        // if templateSrc could not replace macro with a value, replace it with an empty string
        if (field.startsWith('$') && replaced.startsWith('$')) replaced = '';
        return replaced;
    }

    removeBlanks(item) {
        var temp = {};
        for (var key in item) {
            if (!(key in this.blankValues)) {
                continue;
            }
            if (typeof item[key] == 'undefined' || item[key] == this.clearString || item[key] == this.blankValues[key]) {
                continue;
            }
            if (key == 'tagFacet' || key == 'tagWord') {
                continue;
            }
            if (key == 'tagData') {
                temp[key] = item[key].filter(t => !this.isBlankTagMatch(t));
            } else {
                temp[key] = item[key];
            }
        }
        return temp;
    }

    isBlankTagMatch(tm) {
        if (tm.tagFacet === "" || tm.tagFacet === this.blankDropDownElement) return true;
        return !!(tm.tagWord === "" || tm.tagWord === this.blankDropDownElement);
    }

    /**
     * build query object from an object that represents single query target. This
     * is called to get items for drop-down lists in the graph or table panel query dialog.
     */
    buildQuery(options) {
        var queryObject = {
            targets: [ options ]
        };
        return this.buildQueryFromQueryDialogData(queryObject);
    }

    /**
     * this function is called when we need to build query object from
     * query entered as text string (e.g. in dashboard template dialog)
     */
    buildQueryFromText(options) {
        var queryObject = {
            targets: [ JSON.parse(options) ]
        };
        return this.buildQueryFromQueryDialogData(queryObject);
    }

    /**
     * build query object from query dialog that can have multiple targets. This
     * is used when plugin builds query for the graph or table panel
     */
    buildQueryFromQueryDialogData(query) {
        this.templateSrvParameters(query);
        // if we have any "$word" left in the query, those are leftover template
        // variables that did not get expanded because they have no value
        query.targets = query.targets.filter(t => !t.hide);
        var queryObject = {
            targets: []
        };
        var index;
        for (index = query.targets.length - 1; index >= 0; --index) {
            var target = this.removeBlanks(query.targets[index]);
            if (typeof target.tagData !== 'undefined') {
                target.tags = NetSpyGlassDatasource.transformTagMatch(target.tagData);
            }
            delete target.tagData;
            delete target.alias;
            target.id = target.refId;
            delete target.refId;
            queryObject.targets.push(target);
        }
        if (typeof query.rangeRaw != 'undefined') {
            // queryObject.from = this.getTimeFilter(query.rangeRaw.from);
            // queryObject.until = this.getTimeFilter(query.rangeRaw.to);
            queryObject.from = NetSpyGlassDatasource.getTimeForApiCall(query.rangeRaw.from, false);
            queryObject.until = NetSpyGlassDatasource.getTimeForApiCall(query.rangeRaw.to, true);
            queryObject.groupByTime = query.interval;
        }
        // queryObject.scopedVars = '$variable';
        return queryObject;
    }

    static getTimeForApiCall(date, roundUp) {
        if (_.isString(date)) {
            if (date === 'now') {
                return 'now';
            }

            var parts = /^now-(\d+)([dhmsM])$/.exec(date);
            if (parts) {
                return date;
                // var amount = parseInt(parts[1]);
                // var unit = parts[2];
                // return 'now-' + amount + unit;
            }
            date = dateMath.parse(date, roundUp);
        }
        return (date.valueOf() / 1000).toFixed(0) + 's';
    }


    getTimeFilter(options) {
        var from = this.getTime(options.rangeRaw.from, false);
        var until = this.getTime(options.rangeRaw.to, true);

        return `time BETWEEN ${from} AND ${until}`;
    }

    getTime(date, roundUp) {
        if (_.isString(date)) {
            if (date === 'now') return `'now'`;

            let parts = /^now-(\d+)([d|h|m|s])$/.exec(date);
            if (parts) {
                let amount = parseInt(parts[1]);
                let unit = parts[2];

                return `'now-${amount}${unit}'`;
            }
            date = dateMath.parse(date, roundUp);
        }

        return date.valueOf() + 'ms';
    }

    buildQueryFronNsgQlStirng(options) {
        let timeFilter = this.getTimeFilter(options);
        let queriesList = options.targets.map( (target) => {
            let query = target.customNsgqlQuery;

            if( query && query.indexOf('$_timeFilter') > 0 ) {
                query = _.replace(query, '$_timeFilter', timeFilter);
            }

            return {
                'nsgql': query,
                'format': 'time_series'
            };
        });

        return queriesList;
    }

}