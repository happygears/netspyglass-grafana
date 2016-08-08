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

    if (query.targets.length <= 0) {
      return this.q.when([]);
    }

    return this.backendSrv.datasourceRequest({
      url: this.url + '/v2/grafana/net/2/query/icmpRtt.30.1',
      data: query,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Required
  // Used for testing datasource in datasource configuration pange
  testDatasource() {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/v2/grafana/net/2/test',
      method: 'GET'
    }).then(response => {
      if (response.status === 200) {
        return { status: "success", message: "Data source is working", title: "Success" };
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
  metricFindQuery(options) {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/v2/grafana/net/2/catalog/variables/list',
      data: options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(this.mapToTextValue);
  }

  metricFindCategoryQuery(options) {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/v2/grafana/net/2/catalog/categories/list',
      data: options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(this.mapToTextValue);
  }

    metricFindVariableQuery(options) {
        return this.backendSrv.datasourceRequest({
            url: this.url + '/v2/grafana/net/2/catalog/categories/list',
            data: options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).then(this.mapToTextValue);
    }
    metricFindDeviceQuery(options) {
        return this.backendSrv.datasourceRequest({
            url: this.url + '/v2/grafana/net/2/catalog/categories/list',
            data: options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).then(this.mapToTextValue);
    }
    metricFindComponentQuery(options) {
        return this.backendSrv.datasourceRequest({
            url: this.url + '/v2/grafana/net/2/catalog/categories/list',
            data: options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).then(this.mapToTextValue);
    }
    metricFindTagQuery(options) {
        return this.backendSrv.datasourceRequest({
            url: this.url + '/v2/grafana/net/2/catalog/categories/list',
            data: options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).then(this.mapToTextValue);
    }

  mapToTextValue(result) {
    return _.map(result.data, (d, i) => {
      return { text: d, value: i};
    });
  }

  buildQueryParameters(options) {
    //remove placeholder targets
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    var targets = _.map(options.targets, target => {
      return {
        target: this.templateSrv.replace(target.target),
        refId: target.refId
      };
    });

    options.targets = targets;

    return options;
  }
}
