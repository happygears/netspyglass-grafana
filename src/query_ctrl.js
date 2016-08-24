import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

    constructor($scope, $injector, uiSegmentSrv) {
        super($scope, $injector);

        this.scope = $scope;
        this.uiSegmentSrv = uiSegmentSrv;
        this.clearSelection = '-- clear selection --';
        this.target.category = this.target.category || 'select category';
        this.target.variable = this.target.variable || 'select variable';
        this.target.device = this.target.device || 'select device';
        this.target.component = this.target.component || 'select component';
        this.target.sortByEl = this.target.sortByEl || 'none';
        this.target.selector = this.target.selector || 'choose selector';
        this.target.limit = this.target.limit || 'select limit';
        this.target.group = this.target.group || 'select group';
        this.target.tagFacet = this.target.tagFacet || 'select tag facet';
        this.target.tagOperation = this.target.tagOperation || '==';
        this.target.tagWord = this.target.tagWord || 'select tag word';
        this.target.tagData = this.target.tagData ||
        [{
            tagFacet : '',
            tagWord : '',
            tagOperation : '=='
        }];

        this.target.resultFormat = this.target.resultFormat || 'time_series';
        this.target.resultFormatDisplay = this.target.resultFormatDisplay || 'Time Series';

        this.target.columns = this.target.columns || 'time,variable,device,component,metric';

        this.temp = '';
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
            .then(this.transformToSegments(this.target.category, 'select category'));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    transformToSegments(element, addTemplateVars) {
        return (results) => {
            var segments = _.map(results, segment => {
                return this.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
            });

            if (element !== addTemplateVars) {
                segments.unshift(this.uiSegmentSrv.newSegment({ fake: true, value: this.clearSelection, html: addTemplateVars}));
            }

            var temp = segments[0].html;
            return segments;
        };
    }

    testRemove() {
        this.target.variable = 'select variable';
        this.getVariables();
        this.panelCtrl.refresh();
    }

    getVariables() {
        return this.datasource.metricFindVariableQuery(this.target)
            .then(this.transformToSegments(this.target.variable,'select variable'));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getDevices() {
        return this.datasource.metricFindQuery(this.target, 'device')
            .then(this.transformToSegments(this.target.device,'select device'));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getComponents() {
        return this.datasource.metricFindQuery(this.target, 'component')
            .then(this.transformToSegments(this.target.component,'select component'));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getTagsFacet() {
        return this.datasource.metricFindQuery(this.target, 'tagFacet')
            .then(this.transformToSegments(this.target.tagFacet,'select tag facet'));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getTagsOperation() {
        return this.datasource.metricFindTagOperationQuery(this.target)
            .then(this.transformToSegments(false));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getTagsWord(data) {
        return this.datasource.metricFindTagWordQuery(this.target, data)
            .then(this.transformToSegments(this.target.tagWord,'select tag word'));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    addAdditionalTags(param) {
        this.target.tagOperation = param;
        this.panelCtrl.refresh();
    }

    toggleEditorMode() {
        this.target.rawQuery = !this.target.rawQuery;
    }

    onChangeInternalCategory() {
        if(this.target.category == this.clearSelection) {
            this.target.category = 'select category';
        }
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
    onChangeInternalVariable() {
        if(this.target.variable == this.clearSelection) {
            this.target.variable = 'select variable';
        }
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
    onChangeInternalDevice() {
        if(this.target.device == this.clearSelection) {
            this.target.device = 'select device';
        }
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
    onChangeInternalComponent() {
        if(this.target.component == this.clearSelection) {
            this.target.component = 'select component';
        }
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
    

    onChangeInternalTagFacet(index) {
        if(this.target.tagFacet == this.clearSelection){
            this.target.tagFacet = 'select tag facet';
        }
        if(this.target.tagData[index].tagWord !== '') {
            this.target.tagData[index].tagWord = '';
        }
        angular.element('#tag-word-'+index).children().children("a.tag-word").html('select tag word');
        this.target.tagData[index].tagFacet = this.target.tagFacet;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    onChangeInternalTagWord(index) {
        if(this.target.tagWord == this.clearSelection){
            this.target.tagWord = 'select tag word';
        }
        this.target.tagData[index].tagWord = this.target.tagWord;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    tagOperation(index, operation) {
        this.target.tagData[index].tagOperation = operation;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    setSortByEl(element) {
        this.target.sortByEl = element;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    setSelector(element) {
        this.target.selector = element;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    setLimit() {
        if (this.target.limit == '') {
            if(this.temp !== ''){
                this.target.limit = this.temp;
            }
            else {
                this.target.limit = 'select limit';
            }
        }
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    setResultFormat(element, elementDisplayStr) {
        this.target.resultFormat = element;
        this.target.resultFormatDisplay = elementDisplayStr;
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    setColumns() {
        console.log(this.target.columns);
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }

    setGroup() {
        if (this.target.group == '') {
            if(this.tempNew !== ''){
                this.target.group = this.tempNew;
            }
            else {
                this.target.group = 'select group';
            }
        }
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }


}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

