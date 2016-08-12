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
        this.tagblocks = new Array('tags_1');
        this.tagArray = {
            tags_1 : {
                tagFacet : '',
                tagWord : '',
                tagOperation : '=='
            }
        };
        this.counter = 1;
    }

    addTagBlock() {
        console.log('array_add');
        console.log(this.tagblocks);
        var len = this.tagblocks.length;
        var name = 'tags_' + (this.counter++);
        this.tagblocks.push('tags_' + (this.counter++));
        this.tagArray[name] = {
            tagFacet : '',
            tagWord : '',
            tagOperation : '=='
        };
        this.panelCtrl.refresh();
    }

    removeTagBlock(element) {
        var index = this.tagblocks.indexOf(element);
        if (index > -1) {
            this.tagblocks.splice(index, 1);
        }
        delete this.tagArray[name];
        console.log('array_rmove');
        console.log(this.tagblocks);
        console.log('obj_rmove');
        console.log(this.tagArray);
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

    onChangeInternalTagFacet(element) {
        console.log(this.tagArray);
        console.log(element);
        this.tagArray[element].tagFacet = this.target.tagFacet;
        console.log('options');
        console.log(this.tagArray);
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    onChangeInternalTagWord(element) {
        this.tagArray[element].tagWord = this.target.tagWord;
        console.log('options');
        console.log(this.tagArray);
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

