import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

    constructor($scope, $injector, uiSegmentSrv) {
        super($scope, $injector);

        this.scope = $scope;
        this.uiSegmentSrv = uiSegmentSrv;
        this.target.category = this.target.category || 'select category';
        this.target.variable = this.target.variable || 'select variable';
        this.target.device = this.target.device || 'select device';
        this.target.component = this.target.component || 'select component';
        this.target.tagFacet = this.target.tagFacet || 'select tag facet';
        this.target.tagOperation = this.target.tagOperation || '==';
        this.target.tagWord = this.target.tagWord || 'select tag name';
        this.target.tagData = [{
            tagFacet : '',
            tagWord : '',
            tagOperation : '=='
        }];
    }

    tagDataAdd() {
        this.target.tagData[this.target.tagData.length] = {
            tagFacet : this.target.tagData.length,
            tagWord : '',
            tagOperation : '=='
        };
        this.panelCtrl.refresh();
    }

    tagDataRemove(index) {
        this.target.tagData.splice(index,1);
        this.panelCtrl.refresh();
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

    getTagsWord() {
        return this.datasource.metricFindTagWordQuery(this.target)
            .then(this.uiSegmentSrv.transformToSegments(false));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    addAdditionalTags(param) {
        this.target.tagOperation = param;
        this.panelCtrl.refresh();
    }

    toggleEditorMode() {
        this.target.rawQuery = !this.target.rawQuery;
    }

    onChangeInternal() {
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    onChangeInternalTagFacet(index) {
        this.target.tagData[index].tagFacet = this.target.tagFacet;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    onChangeInternalTagWord(index) {
        this.target.tagData[index].tagWord = this.target.tagWord;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    tagOperation(index, operation) {
        this.target.tagData[index].tagOperation = operation;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

