import _ from "lodash";

export class GenericDatasource {

    constructor(instanceSettings, $q, backendSrv, templateSrv) {
        this.type = instanceSettings.type;
        this.url = instanceSettings.url;
        this.name = instanceSettings.name;
        this.q = $q;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;
    }

    // Called once per panel (graph)
    query(options) {
        var query = this.buildQueryParameters(options);
        query.targets = query.targets.filter(t => !t.hide);

        if (query.targets.length <= 0) {
            return this.q.when({data: []});
        }
        var endpoint = '';
        if (typeof query.targets[0].variable !== "undefined" && query.targets[0].variable !== "select variable") {
            endpoint = '/v2/grafana/net/2/query';

            var queryObject = {
                targets: [],
                from: "-6h",
                until: "now"
            };

            query.targets.forEach(targetsLoop);

            function targetsLoop(item, index) {
                var temp = {};
                if (typeof item.variable !== "undefined" && item.variable !== "select variable") {
                    temp.variable = item.variable;
                }
                if (typeof item.device !== "undefined" && item.device !== "select device") {
                    temp.device = item.device;
                }
                if (typeof item.component !== "undefined" && item.component !== "select component") {
                    temp.component = item.component;
                }
                if (typeof item.tagFacet !== "undefined" && item.tagFacet !== "select tag facet" && typeof item.tagFacet !== "undefined" && item.tagFacet !== "select tag facet" && typeof item.tagOperation !== "undefined" && typeof item.tagWord !== "undefined" && item.tagWord !== "select tag name") {

                    var result = [];
                    item.tagData.forEach(tagsLoop);
                    function tagsLoop(singleItem, index) {
                        if (typeof singleItem.tagFacet !== "undefined" && singleItem.tagFacet !== "" && typeof singleItem.tagWord !== "undefined" && singleItem.tagWord !== "") {
                            result.push({
                                tagFacet: singleItem.tagFacet,
                                tagOperation: singleItem.tagOperation,
                                tagWord: singleItem.tagWord
                            });
                        }
                    }

                    temp.tags = result;
                }
                queryObject.targets.push(temp);
            }

            queryObject.from = query.rangeRaw.from;
            queryObject.until = query.rangeRaw.to;
            var data = JSON.stringify(queryObject);
            console.log(data);
            return this.backendSrv.datasourceRequest({
                url: this.url + endpoint,
                data: data,
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });
        }
        else {
            return '';
        }
    }

    // Required
    // Used for testing datasource in datasource configuration pange
    testDatasource() {
        return this.backendSrv.datasourceRequest({
            url: this.url + '/',
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
            url: this.url + '/annotations',
            method: 'POST',
            data: annotationQuery
        }).then(result => {
            return result.data;
        });
    }

    // Optional
    // Required for templating
    metricFindCategoryQuery(options) {
        return this.backendSrv.datasourceRequest({
            url: this.url + '/v2/grafana/net/2/catalog/categories/list',
            data: options,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }

    metricFindVariableQuery(options) {
        var endpoint = '/v2/grafana/net/2/catalog/categories/';
        if (options.category !== 'select category') {
            endpoint += options.category;
        }
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: options,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }

    metricFindDeviceQuery(options) {
        var endpoint = '';
        if (options.category !== 'select category' && options.variable !== 'select variable') {
            endpoint = '/v2/grafana/net/2/catalog/devices?name=' + options.variable;
            if (options.component !== 'select component') {
                endpoint += '&components=' + options.component;
            }
        }
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: options,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }

    metricFindComponentQuery(options) {
        var endpoint = '';
        if (options.category !== 'select category' && options.variable !== 'select variable') {
            endpoint = '/v2/grafana/net/2/catalog/components?name=' + options.variable;
            if (options.device !== 'select device') {
                endpoint += '&devices=' + options.device;
            }
        }
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: options,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }

    metricFindTagFacetQuery(options) {
        var endpoint = '';
        if (options.category !== 'select category' && options.variable !== 'select variable') {
            endpoint = '/v2/grafana/net/2/catalog/tags/facets?name=' + options.variable;
            if (options.device !== 'select device') {
                endpoint += '&devices=' + options.device;
            }
            if (options.component !== 'select component') {
                endpoint += '&components=' + options.component;
            }
        }
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: options,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }

    metricFindTagOperationQuery(options) {
        var endpoint = '';
        if (options.category !== 'select category' && options.variable !== 'select variable') {
            endpoint = '/v2/grafana/net/2/catalog/tags/facets?name=' + options.variable;
            if (options.device !== 'select device') {
                endpoint += '&devices=' + options.device;
            }
            if (options.component !== 'select component') {
                endpoint += '&components=' + options.component;
            }
        }
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: options,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }

    metricFindTagWordQuery(options) {
        var endpoint = '';
        if (options.category !== 'select category' && options.variable !== 'select variable' && options.tagFacet !== 'select tag facet') {
            endpoint = '/v2/grafana/net/2/catalog/tags/' + options.tagFacet + '?name=' + options.variable;
            if (options.device !== 'select device') {
                endpoint += '&devices=' + options.device;
            }
            if (options.component !== 'select component') {
                endpoint += '&components=' + options.component;
            }
        }
        return this.backendSrv.datasourceRequest({
            url: this.url + endpoint,
            data: options,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }).then(this.mapToTextValue);
    }

    mapToTextValue(result) {
        return _.map(result.data, (d, i) => {
            return {text: d, value: i};
        });
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
                refId: target.refId,
                hide: target.hide,
                tagData: target.tagData
            };
        });

        options.targets = targets;

        return options;
    }
}
