/*
 * Copyright (c) 2016.  Happy Gears, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class NetSpyGlassDatasourceQueryCtrl extends QueryCtrl {

    constructor($scope, $injector, uiSegmentSrv) {
        super($scope, $injector);

        this.prompts = {
            'category': 'select category',
            'variable': 'select variable',
            'device': 'select device',
            'component': 'select component'
        };

        this.scope = $scope;
        this.injector = $injector;
        this.uiSegmentSrv = uiSegmentSrv;
        this.clearSelection = '-- clear selection --';
        this.blankDropDownElement = '---';
        this.target.category = this.target.category || this.prompts['category'];
        this.target.variable = this.target.variable || this.prompts['variable'];
        this.target.device = this.target.device || this.prompts['device'];
        this.target.component = this.target.component || this.prompts['component'];
        this.target.sortByEl = this.target.sortByEl || 'none';
        this.target.selector = this.target.selector || ' -- ';
        this.target.aggregator = this.target.aggregator || ' -- ';
        this.target.limit = this.target.limit || '100';
        this.target.group = this.target.group || 'select group';
        this.target.tagFacet = this.target.tagFacet || this.blankDropDownElement;
        this.target.tagOperation = this.target.tagOperation || '==';
        this.target.tagWord = this.target.tagWord || this.blankDropDownElement;
        this.target.tagData = this.target.tagData || [];

        this.target.format = this.target.format || 'time_series';
        this.target.formatDisplay = this.target.formatDisplay || 'Time Series';

        this.target.columns = this.target.columns || 'time,variable,device,component,metric';
        this.target.alias = this.target.alias || '';
    }

    isCategorySelected() {
        return this.target.category !== this.prompts['category'] && this.target.category !== this.clearSelection;
    }

    isVariableSelected() {
        return this.target.variable !== this.prompts['variable'] && this.target.variable !== this.clearSelection;
    }

    /**
     * add new tag matching rule that consists of tag facet, operation ('==' or '<>') and tag word.
     * Unfortunately if input fields for the tag facet and word are blank, the height of the corresponding
     * visible element is reduced (element <a> is visible and its height is 0 when it has no contents, so
     * all we see is the margin around it). To work around that I put "-" in these fields. It is unobtrusive
     * enough and looks like some sort of a prompt, but it is a hack nonetheless.
     * FIXME: find a way to fix height of the visible element without adding any contents.
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
        return this.datasource.findCategoriesQuery(this.target)
            .then(this.transformToSegments(this.target.category, this.prompts['category']));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    transformToSegments(currentValue, prompt) {
        console.log('transformToSegments called:  currentValue=' + currentValue + ' prompt=' + prompt);
        return (results) => {
            var segments = _.map(results, segment => {
                return this.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
            });
            // segments.unshift(this.uiSegmentSrv.newSegment({ fake: true, value: this.clearSelection, html: prompt}));

            // there is no need to add "clear selection" item if current value is already equal to prompt
            if (currentValue !== prompt) {
                segments.unshift(this.uiSegmentSrv.newSegment({ fake: true, value: this.clearSelection, html: prompt}));
            }
            return segments;
        };
    }

    testRemove() {
        this.target.variable = this.prompts['variable'];
        this.getVariables();
        this.refresh();
    }

    getVariables() {
        return this.datasource.findVariablesQuery(this.target)
            .then(this.transformToSegments(this.target.variable, this.prompts['variable']));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getDevices() {
        return this.datasource.findDevices(this.target)
            .then(this.transformToSegments(this.target.device, this.prompts['device']));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getComponents() {
        return this.datasource.findComponents(this.target)
            .then(this.transformToSegments(this.target.component, this.prompts['component']));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getTagsFacet(index) {
        return this.datasource.findTagFacets(this.target, index)
            .then(this.transformToSegments(this.target.tagFacet, this.target.tagFacet));  // do not add "-- clear selection --" item
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    getTagsWord(index) {
        return this.datasource.findTagWordsQuery(this.target, index)
            .then(this.transformToSegments(this.target.tagWord, this.target.tagWord));  // do not add "-- clear selection --" item
    }

    toggleEditorMode() {
        this.target.rawQuery = !this.target.rawQuery;
    }

    onChangeInternalCategory() {
        if (this.target.category == this.clearSelection) {
            this.target.category = this.prompts['category'];
        }
        // user has changed category, we should erase variable and other selections because they are
        // not valid anymore
        this.target.variable = this.prompts['variable'];
        this.target.device = this.prompts['device'];
        this.target.component = this.prompts['component'];
        this.target.tagData = [];
        // FIXME: this does not look right, there must be a way to update element in the browser without manipulating it directly in DOM
        angular.element('#variable-field').children().children('a').html(this.target.variable);
        // call refresh to force graph reload (which should turn blank since we dont have enough data
        // to build valid query)
        this.refresh();
    }

    onChangeInternalVariable() {
        console.log('Variable has changed to ' + this.target.variable);
        this.refresh();
    }

    onChangeInternalDevice() {
        if(this.target.device == this.clearSelection) {
            this.target.device = this.prompts['device'];
        }
        this.refresh();
    }
    onChangeInternalComponent() {
        if(this.target.component == this.clearSelection) {
            this.target.component = this.prompts['component'];
        }
        this.refresh();
    }
    
    onChangeInternalTagFacet(index) {
        // clear tag word when user changes tag facet. The dialog enters state where tag facet is selected
        // but tag word is not. This state is invalid and should be transient, it does not make sense
        // to call this.refresh() because query is yet incomplete
        this.target.tagData[index].tagWord = this.blankDropDownElement;
        // FIXME: this does not look right, there must be a way to update element in the browser without manipulating it directly in DOM
        angular.element('#tag-word-'+index).children().children("a.tag-word").html(this.target.tagData[index].tagWord);
        this.refresh();
    }

    //noinspection JSUnusedLocalSymbols
    onChangeInternalTagWord(index) {
        this.refresh();
    }

    tagOperation(index, operation) {
        this.target.tagData[index].tagOperation = operation;
        this.refresh();
    }

    setSortByEl(sortOrder) {
        this.target.sortByEl = sortOrder;
        this.refresh();
    }

    setSelector(element) {
        this.target.selector = element;
        this.refresh();
    }

    setAggregator(element) {
        this.target.aggregator = element;
        this.refresh();
    }

    setAlias() {
        this.refresh();
    }

    setFormat(element, elementDisplayStr) {
        this.target.format = element;
        this.target.formatDisplay = elementDisplayStr;
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

