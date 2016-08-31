import _ from "lodash";


export class NetSpyGlassDatasource {

    /**
     * Convert server's response to a map where key and value are taken from the first
     * column. Request is assumed to have been in the format "table".
     *
     * Server returns data in the following format:
     *
     * [ {
          "columns" : [ { "text" : "device" } ],
          "rows" : [ [ "synas1" ], [ "ex2200" ] ],
          "type" : "table"
        } ]
     *
     * "rows" is a list of lists because normally this query can return multiple columns.
     * For the purpose of dashboard template we use only the first column if request specified multiple.
     *
     */
    static tableResponseRowsToMap(response) {
        return _.map(response.data[0].rows, (d, i) => {
            return {text: d[0], value: i};
        });
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
        this.endpointsBase = '/v2/grafana/net/' + this.networkId;
        this.endpoints = {};
        this.endpoints.category = this.endpointsBase + '/catalog/categories/list' + this.accessToken;
        this.endpoints.variable = this.endpointsBase + '/catalog/categories/';
        // this.endpoints.device = this.endpointsBase + '/catalog/devices' + this.accessToken;
        // this.endpoints.component = this.endpointsBase + '/catalog/components' + this.accessToken;
        // this.endpoints.tagFacet = this.endpointsBase + '/catalog/tags/facets' + this.accessToken;
        this.endpoints.query = this.endpointsBase + '/query' + this.accessToken;
        this.endpoints.test = this.endpointsBase + '/test' + this.accessToken;

        this.blankDropDownElement = '---';

        this.targetName = {};
        this.targetName.variable = 'select variable';
        this.targetName.device = 'select device';
        this.targetName.component = 'select component';
        this.targetName.sortByEl = 'select sorting';
        this.targetName.selector = 'select selector';
        this.targetName.limit = 'select limit';
        this.targetName.group = 'select group';
        this.targetName.tagFacet = this.blankDropDownElement;
        this.targetName.tagWord = this.blankDropDownElement;
        this.targetName.interval = 'select interval';
        this.targetName.tagData = [];
        this.targetName.format = '';
        this.targetName.columns = '';
        this.targetName.unique = '';

        this.clearString = '-- clear selection --';
    }


    removePrompts(item) {
        var temp = {};
        for (var key in item) {
            if (!(key in this.targetName)) {
                continue;
            }
            if (typeof item[key] == 'undefined' || item[key] == this.clearString || item[key] == this.targetName[key]) {
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

    buildQuery(options) {
        var query = this.buildQueryParameters(options);
        query.targets = query.targets.filter(t => !t.hide);
        var queryObject = {
            targets: []
        };
        var temp;
        if (query.targets.length <= 0) {
            temp = this.removePrompts(query);
            queryObject.targets.push(temp);
        } else {
            var index;
            for (index = query.targets.length - 1; index >= 0; --index) {
                temp = this.removePrompts(query.targets[index]);
                queryObject.targets.push(temp);
            }
            if (typeof query.rangeRaw != 'undefined') {
                queryObject.from = query.rangeRaw.from;
                queryObject.until = query.rangeRaw.to;
                queryObject.groupByTime = query.interval;
            }
            queryObject.scopedVars = '$variable';
        }
        return queryObject;
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
     * @param options
     * @returns {*}
     */
    query(options) {
        var data = this.buildQuery(options);
        var target = data.targets[0];
        // UI passes only sort order ("ascending","descending" or "none"). Prepend it with default column name
        target.sortByEl = (target.sortByEl !== 'none') ? 'metric:' + target.sortByEl : target.sortByEl;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query);
    }

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
        var data = this.buildQuery(interpolated);
        var target = data.targets[0];
        target.format = 'table';
        return this._apiCall(this.endpoints.query, 'POST', JSON.stringify(data)).then(NetSpyGlassDatasource.tableResponseRowsToMap);
    }

    findCategoriesQuery() {
        return this._apiCall(this.endpoints.category, 'POST', '').then(this.mapToTextValue);
    }

    findVariablesQuery(options) {
        var endpoint = this.endpoints.variable + options.category + this.accessToken;
        return this._apiCall(endpoint, 'POST', '').then(this.mapToTextValue);
    }

    findDevices(options) {
        var data = this.buildQuery(options);
        var target = data.targets[0];
        target.device = '';  // erase to ignore current selection in the dialog
        target.component = '';
        target.columns = 'device';
        target.unique = 'device';
        target.sortByEl = 'device:ascending';
        target.format = 'table';
        target.limit = -1;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.tableResponseRowsToMap);
    }

    findComponents(options) {
        var data = this.buildQuery(options);
        var target = data.targets[0];
        target.component = '';  // erase to ignore current selection in the dialog
        target.columns = 'component';
        target.unique = 'component';
        target.sortByEl = 'component:ascending';
        target.format = 'table';
        target.limit = -1;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.tableResponseRowsToMap);
    }

    findTagFacets(options) {
        var data = this.buildQuery(options);
        var target = data.targets[0];
        target.columns = 'tagFacet';
        target.unique = 'tagFacet';
        target.sortByEl = 'tagFacet:ascending';
        target.format = 'table';
        target.limit = -1;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.tableResponseRowsToMap);
    }

    findTagWordsQuery(options, facet) {
        var data = this.buildQuery(options);
        var target = data.targets[0];
        target.columns = facet;
        target.unique = facet;
        target.sortByEl = facet + ':ascending';
        target.format = 'table';
        target.limit = -1;
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        return this._apiCall(this.endpoints.query, 'POST', query).then(NetSpyGlassDatasource.tableResponseRowsToMap);
    }

    mapToTextValue(result) {
        return _.map(result.data, (d, i) => {
            return {text: d, value: i};
        });
    }

    mapToTextText(result) {
        return _.map(result.data, (d, i) => {
            return {text: d, value: d};
        });
    }

    debug(ctrl) {
        console.log(ctrl);
    }

    /**
     * when building graphing query, this function is called with JS object that has at least
     * attribute 'targets'
     *
     * when building query for the templating variable in dashboard template, this is called with
     * whatever user entered in the Query Options -> Query input field (a string)
     *
     * @param options
     * @returns {*}
     */
    buildQueryParameters(options) {

        if (typeof options === 'string') {
            var obj = {
                'targets': []
            };
            obj.targets.push(JSON.parse(options));
            return obj;
        }

        var targets = _.map(options.targets, target => {
            return {
                category: this.templateSrv.replace(target.category),
                variable: this.templateSrv.replace(target.variable),
                device: this.templateSrv.replace(target.device),
                component: this.templateSrv.replace(target.component),
                tagFacet: this.templateSrv.replace(target.tagFacet),
                tagOperation: this.templateSrv.replace(target.tagOperation),
                tagWord: this.templateSrv.replace(target.tagWord),
                sortByEl: this.templateSrv.replace(target.sortByEl),
                selector: this.templateSrv.replace(target.selector),
                format: this.templateSrv.replace(target.format),
                limit: (target.limit === '') ? -1 : target.limit,
                columns: this.templateSrv.replace(target.columns),
                alias: this.templateSrv.replace(target.alias, options.scopedVars),
                refId: target.refId,
                hide: target.hide,
                tagData: target.tagData
            };
        });

        options.targets = targets;

        return options;
    }
}