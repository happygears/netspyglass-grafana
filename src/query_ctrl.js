import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv)  {
    super($scope, $injector);

    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.target.category = this.target.category || 'select category';
    this.target.variable = this.target.variable || 'select variable';
    this.target.device = this.target.device || 'select device';
    this.target.component = this.target.component || 'select component';
    this.target.tagFacet = this.target.tagFacet || 'select tag facet';
    this.target.tagOperation = this.target.tagOperation || 'select tag operation';
    this.target.tagName = this.target.tagName || 'select tag name';
  }

  getCategories() {
    return this.datasource.metricFindCategoryQuery(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
  }
  getVariables() {
    return this.datasource.metricFindVariableQuery(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
  }
  getDevices() {
    return this.datasource.metricFindDeviceQuery(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
  }
  getComponents() {
    return this.datasource.metricFindComponentQuery(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
  }
    getTagsFacet() {
    return this.datasource.metricFindTagFacetQuery(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
  }
  getTagsOperation() {
    return this.datasource.metricFindTagOperationQuery(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
  }
    getTagsName() {
    return this.datasource.metricFindTagNameQuery(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

