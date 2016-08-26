import _ from "lodash";


export class NetSpyGlassDatasource {


    constructor(instanceSettings, $q, backendSrv, templateSrv) {
        this.type = instanceSettings.type;
        this.url = instanceSettings.url;
        this.name = instanceSettings.name;
        this.q = $q;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;
        this.networkId = instanceSettings.jsonData.networkId || 1;
        this.accessToken = (instanceSettings.jsonData.useToken !== false && instanceSettings.jsonData.accessToken !== undefined && instanceSettings.jsonData.accessToken !== '') ? '?access_token='+instanceSettings.jsonData.accessToken :'';
        this.endpoints = {};
        this.endpoints.category = '/v2/grafana/net/' + this.networkId + '/catalog/categories/list' + this.accessToken;
        this.endpoints.variable = '/v2/grafana/net/' + this.networkId + '/catalog/categories/';
        this.endpoints.device = '/v2/grafana/net/' + this.networkId + '/catalog/devices' + this.accessToken;
        this.endpoints.component = '/v2/grafana/net/' + this.networkId + '/catalog/components' + this.accessToken;
        this.endpoints.tagFacet = '/v2/grafana/net/' + this.networkId + '/catalog/tags/facets' + this.accessToken;
        this.endpoints.query = '/v2/grafana/net/' + this.networkId + '/query' + this.accessToken;
        this.endpoints.test = '/v2/grafana/net/' + this.networkId + '/test' + this.accessToken;

        this.targetName = {};
        this.targetName.variable = 'select variable';
        this.targetName.device = 'select device';
        this.targetName.component = 'select component';
        this.targetName.sortByEl = 'select sorting';
        this.targetName.selector = 'select selector';
        this.targetName.limit = 'select limit';
        this.targetName.group = 'select group';
        this.targetName.tagFacet = 'select tag facet';
        this.targetName.tagWord = 'select tag word';
        this.targetName.interval = 'select interval';
        this.targetName.tagData = [];
        this.targetName.resultFormat = '';
        this.targetName.columns = '';

        this.clearString = '-- clear selection --';
    }

    buildNewData(item) {
        var temp = {};
        for (var key in item) {
            var result = [];
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
                item[key].forEach(tagsLoop);
                function tagsLoop(singleItem, index) {
                    if (singleItem.tagFacet == "" || singleItem.tagFacet == "select tag facet"){
                       return;
                    }
                    if(singleItem.tagWord == "" || singleItem.tagWord == "select tag word") {
                        return;
                    }
                    result.push({
                        tagFacet: singleItem.tagFacet,
                        tagOperation: singleItem.tagOperation,
                        tagWord: singleItem.tagWord
                    });

                }
            }
            if (result.length > 0) {
                temp.tags = result;
            }
            if(key !== 'tagData') {
                temp[key] = item[key];
            }
        }
        return temp;
    }


    buildQuery(options) {
        var query = this.buildQueryParameters(options);
        query.targets = query.targets.filter(t => !t.hide);
        var queryObject = {
            targets: []
        };
        var temp;
        if (query.targets.length <= 0) {
            temp = this.buildNewData(query);
            queryObject.targets.push(temp);
        } else {
            var index;
            for (index = query.targets.length - 1; index >= 0; --index) {
                temp = this.buildNewData(query.targets[index]);
                queryObject.targets.push(temp);
            }
            queryObject.from = query.rangeRaw.from;
            queryObject.until = query.rangeRaw.to;
            queryObject.groupByTime = query.interval;
            queryObject.scopedVars = '$variable';
        }
        var data = JSON.stringify(queryObject);
        return data;
    }


    query(options) {
        var data = this.buildQuery(options);
        var temp = JSON.parse(data);
        console.log(data);
        if (temp.targets.filter(function (target) {
                return typeof target.variable !== "undefined" && target.variable !== "select variable";
            }).length > 0) {
            var endpoint = this.endpoints.query;
            return this.backendSrv.datasourceRequest({
                url: this.url + endpoint,
                data: data,
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });
        } else {
            return null;
        }
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


    metricFindQuery(options, name) {
        var data = this.buildQuery(options);
        var endpoint = this.endpoints[name];
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: data,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }


    metricFindCategoryQuery() {
        return this.backendSrv.datasourceRequest({
            url: this.url + this.endpoints.category,
            data: '',
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }


    metricFindVariableQuery(options) {
        var endpoint = this.endpoints.variable + options.category + this.accessToken;
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: '',
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }


    metricFindTagWordQuery(options, index) {
        var endpoint = '/v2/grafana/net/' + this.networkId + '/catalog/tags/' + index.tagFacet + this.accessToken;
        var data = this.buildQuery(options);
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: data,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }


    mapToTextValue(result) {
        return _.map(result.data, (d, i) => {
            return {text: d, value: i};
        });
    }

    debug(ctrl) {
        console.log(ctrl);
    }

    buildQueryParameters(options) {

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
                resultFormat: this.templateSrv.replace(target.resultFormat),
                limit: (target.limit === '') ? -1 : this.templateSrv.replace(target.limit),
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