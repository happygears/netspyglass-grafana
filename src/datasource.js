import _ from "lodash";


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

        this.targetName = {};
        this.targetName.alias = '';
        this.targetName.variable = 'select variable';
        this.targetName.device = 'select device';
        this.targetName.component = 'select component';
        this.targetName.sortByEl = 'select sorting';
        this.targetName.selector = 'choose selector';
        this.targetName.limit = 'select limit';
        this.targetName.group = 'select group';
        this.targetName.tagFacet = this.blankDropDownElement;
        this.targetName.tagWord = this.blankDropDownElement;
        this.targetName.interval = 'select interval';
        this.targetName.tagData = [];
        this.targetName.format = '';
        this.targetName.columns = '';
        this.targetName.unique = '';
        this.targetName.refId = '';

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
        var self = this;
        var data = this.buildQueryFromQueryDialogData(options);
        var aliases = {};
        for (var idx = 0; idx < options.targets.length; idx++) {
            var targetDlg = options.targets[idx];
            aliases[targetDlg.refId] = targetDlg.alias;
        }
        for (var i = 0; i < data.targets.length; i++) {
            var target = data.targets[i];
            // UI passes only sort order ("ascending","descending" or "none"). Prepend it with default column name
            target.sortByEl = (target.sortByEl !== 'none') ? 'metric:' + target.sortByEl : target.sortByEl;
        }
        var query = JSON.stringify(data);
        query = this.templateSrv.replace(query, options.scopedVars);
        var response = this._apiCall(this.endpoints.query, 'POST', query);
        // then: function(a,b,c)
        return response.then( response => {
            var data = response.data;
            if (!data) return response;

            // data is an Array of these:
            //
            // component:  "eth0"
            // datapoints: Array[121]
            // device:     "synas1"
            // target:     "ifInRate:synas1:eth0"
            // variable:   "ifInRate"

            for (idx = 0; idx < data.length; idx++) {
                var series = data[idx];
                if (!series || !series.datapoints || !series.target) continue;
                var alias = aliases[series.id];
                if (alias) series.target = self.getSeriesName(series, alias);
            }

            return response;
        });
    }

    getSeriesName(series, alias) {
        var regex = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;

        return alias.replace(regex, function(match, g1, g2) {
            var group = g1 || g2;
            var segIndex = parseInt(group, 10);

            if (group === 'm' || group === 'measurement') { return series.variable; }
            if (group === 'variable') { return series.variable; }
            if (group === 'device') return series.device;
            if (group === 'component') return series.component;
            if (group.indexOf('tag_') !== 0) { return match; }

            var tag = group.replace('tag_', '');
            if (!series.tags) { return match; }
            return series.tags[tag];
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
     */
    templateSrvParameters(queryObject) {
        queryObject.targets = _.map(queryObject.targets, target => {
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
                alias: this.templateSrv.replace(target.alias, queryObject.scopedVars),
                refId: target.refId,
                hide: target.hide,
                tagData: target.tagData
            };
        });
        return queryObject;
    }

    removeBlanks(item) {
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
            queryObject.from = query.rangeRaw.from;
            queryObject.until = query.rangeRaw.to;
            queryObject.groupByTime = query.interval;
        }
        // queryObject.scopedVars = '$variable';
        return queryObject;
    }

}