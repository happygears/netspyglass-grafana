import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class NetSpyGlassDatasourceQueryCtrl extends QueryCtrl {

    constructor($scope, $injector, uiSegmentSrv) {
        super($scope, $injector);

        this.scope = $scope;
        this.uiSegmentSrv = uiSegmentSrv;
        this.clearSelection = '-- clear selection --';
        this.blankDropDownElement = '---';
        this.target.category = this.target.category || 'select category';
        this.target.variable = this.target.variable || 'select variable';
        this.target.device = this.target.device || 'select device';
        this.target.component = this.target.component || 'select component';
        this.target.sortByEl = this.target.sortByEl || 'none';
        this.target.selector = this.target.selector || 'choose selector';
        this.target.limit = this.target.limit || '';
        this.target.group = this.target.group || 'select group';
        this.target.tagFacet = this.target.tagFacet || this.blankDropDownElement;
        this.target.tagOperation = this.target.tagOperation || '==';
        this.target.tagWord = this.target.tagWord || this.blankDropDownElement;
        this.target.tagData = this.target.tagData || [];

        this.target.resultFormat = this.target.resultFormat || 'time_series';
        this.target.resultFormatDisplay = this.target.resultFormatDisplay || 'Time Series';

        this.target.columns = this.target.columns || 'time,variable,device,component,metric';
        this.target.alias = this.target.alias || '';
    }

    isCategorySelected() {
        return this.target.category !== 'select category' && this.target.category !== this.clearSelection;
    }

    isVariableSelected() {
        return this.target.variable !== 'select variable' && this.target.variable !== this.clearSelection;
    }

    /**
     * add new tag matching rule that consists of tag facet, operation ('==' or '<>') and tag word.
     * Unfortunately if input fields for the tag facet and word are blank, the height of the corresponding
     * visible element is reduced (element <a> is visible and its height is 0 when it has no contents, so
     * all we see is the margin around it). To work around that I put "-" in these fields. It is unobtrusive
     * enough and looks like some sort of a prompt, but it is a hack nonetheless.
     * TODO: find a way to fix the height of the visible element without adding any contents.
     */
    tagDataAdd() {
        this.target.tagData[this.target.tagData.length] = {
            tagFacet : this.blankDropDownElement,
            tagWord : this.blankDropDownElement,
            tagOperation : '=='
        };
        this.refresh();
    }

    tagDataRemove(index) {
        this.target.tagData.splice(index,1);
        this.refresh();
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
            return segments;
        };
    }

    testRemove() {
        this.target.variable = 'select variable';
        this.getVariables();
        this.refresh();
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
            .then(this.transformToSegments(this.target.tagFacet, this.target.tagFacet));  // do not add "-- clear selection --" item
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getTagsWord(facet) {
        return this.datasource.metricFindTagWordQuery(this.target, facet)
            .then(this.transformToSegments(this.target.tagWord, this.target.tagWord));  // do not add "-- clear selection --" item
    }

    toggleEditorMode() {
        this.target.rawQuery = !this.target.rawQuery;
    }

    onChangeInternalCategory() {
        if(this.target.category == this.clearSelection) {
            this.target.category = 'select category';
        }
        this.refresh();
    }
    onChangeInternalVariable() {
        if(this.target.variable == this.clearSelection) {
            this.target.variable = 'select variable';
        }
        this.refresh();
    }
    onChangeInternalDevice() {
        if(this.target.device == this.clearSelection) {
            this.target.device = 'select device';
        }
        this.refresh();
    }
    onChangeInternalComponent() {
        if(this.target.component == this.clearSelection) {
            this.target.component = 'select component';
        }
        this.refresh();
    }
    
    onChangeInternalTagFacet(index) {
        // clear tag word when user changes tag facet. The dialog enters state where tag facet is selected
        // but tag word is not. This state is invalid and should be transient, it does not make sense
        // to call this.refresh() because query is yet incomplete
        this.target.tagData[index].tagWord = this.blankDropDownElement;
        // this does not look right, there must be a way to update element without manipulating it directly in DOM
        angular.element('#tag-word-'+index).children().children("a.tag-word").html(this.target.tagData[index].tagWord);
    }

    //noinspection JSUnusedLocalSymbols
    onChangeInternalTagWord(index) {
        this.refresh();
    }

    tagOperation(index, operation) {
        this.target.tagData[index].tagOperation = operation;
        this.refresh();
    }

    setSortByEl(element) {
        this.target.sortByEl = element;
        this.refresh();
    }

    setSelector(element) {
        this.target.selector = element;
        this.refresh();
    }

    setAlias() {
        this.refresh();
    }

    setResultFormat(element, elementDisplayStr) {
        this.target.resultFormat = element;
        this.target.resultFormatDisplay = elementDisplayStr;
        this.refresh();
    }

    setColumns() {
        // console.log(this.target.columns);
        this.refresh();
    }

    // setGroup() {
    //     if (this.target.group == '') {
    //         if(this.tempNew !== ''){
    //             this.target.group = this.tempNew;
    //         }
    //         else {
    //             this.target.group = 'select group';
    //         }
    //     }
    //     this.refresh();
    // }

}

NetSpyGlassDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

