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
import SQLBuilderFactory from './hg-sql-builder';
import _ from "lodash";

export class NetSpyGlassDatasourceQueryCtrl extends QueryCtrl {

    constructor($scope, $injector, templateSrv, $q, uiSegmentSrv) {
        super($scope, $injector);

        this.prompts = {
            'category': 'select category',
            'variable': 'select variable',
            'device': 'select device',
            'component': 'select component'
        };

        this.scope = $scope;
        this.injector = $injector;

        this.templateSrv = templateSrv;
        this.$q = $q;
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


        // _NEW_
        this.SQLBuilder = new SQLBuilderFactory();
        this.target.queryConfig = this.SQLBuilder.factory();

        console.log(this.SQLBuilder);
        console.log(SQLBuilderFactory.factory);

        //TODO: need to find better way
        this.target.needToBuildQuery = true;
        this.target.customNsgqlQuery = "SELECT time,metric FROM cpuUtil WHERE time BETWEEN 'now-6h' AND 'now'";

        this.rowMode = false;

        this.category = this.target.category || this.prompts['category'];
        this.variable = this.target.variable || this.prompts['variable'];

        this.tagSegments = [];
        this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
        this.removeTagFilterSegment = uiSegmentSrv.newSegment({fake: true, value: '-- remove tag filter --'});
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
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    tagDataRemove(index) {
        this.target.tagData.splice(index,1);
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    getCategories() {
        let query = this.SQLBuilder.factory({
            select: ['category'],
            distinct: true,
            from: 'variables',
            where: ['AND', {
                category: ['<>', '']
            }],
            orderBy: ['category']
        }).compile();

        return this.datasource.executeQuery(this.SQLBuilder.factory({
            select: ['category,name'],
            distinct: true,
            from: 'variables',
            where: ['AND', {
                category: ['<>', '']
            }],
            orderBy: ['category']
        }).compile(), 'json')
            .then( (data) => {
                console.log('category,name',data);
                // this.transformToSegments(this.target.category, this.prompts['category'])

                return [
                    this.uiSegmentSrv.newSegment({ value: 'test1', expandable: true }),
                    this.uiSegmentSrv.newSegment({ value: 'test2', expandable: false }),
                    this.uiSegmentSrv.newSegment({ value: 'test3', expandable: false }),
                ]
            });


        // return this.datasource.executeQuery(query, 'list')
        //     .then(this.transformToSegments(this.target.category, this.prompts['category']));
        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
    }

    transformToSegments(currentValue, prompt) {
        console.log('transformToSegments called:  currentValue=' + currentValue + ' prompt=' + prompt);
        return (results) => {
            var segments = _.map(results, segment => {
                //TODO: really we need to ckeck segment.text if all request types will be 'list'
                if( segment.text ) {
                    return this.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
                } else {
                    return this.uiSegmentSrv.newSegment({ value: segment });
                }
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
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    getVariables() {
        let query = this.SQLBuilder.factory({
            select: ['name'],
            distinct: true,
            from: 'variables',
            where: ['AND', {
                category: ['=', this.target.category]
            }],
            orderBy: ['name']
        }).compile();

        return this.datasource.executeQuery(query, 'list')
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
        // TODO: clear variable name when category changes. Only variable name field in the same target should change,
        // variable name fields in other targets should not change
        // FIXME: this does not look right, there must be a way to update element in the browser without manipulating it directly in DOM
        // angular.element('#variable-field').children().children('a').html(this.target.variable);
        // call refresh to force graph reload (which should turn blank since we dont have enough data
        // to build valid query)
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    onChangeInternalVariable() {
        console.log('Variable has changed to ' + this.target.variable);
        console.log(this);
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    onChangeInternalDevice() {
        if(this.target.device == this.clearSelection) {
            this.target.device = this.prompts['device'];
        }
        this.target.needToBuildQuery = true;
        this.refresh();
    }
    onChangeInternalComponent() {
        if(this.target.component == this.clearSelection) {
            this.target.component = this.prompts['component'];
        }
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    onChangeInternalTagFacet(index) {
        // clear tag word when user changes tag facet. The dialog enters state where tag facet is selected
        // but tag word is not. This state is invalid and should be transient, it does not make sense
        // to call this.refresh() because query is yet incomplete
        this.target.tagData[index].tagWord = this.blankDropDownElement;
        // TODO: clear field "tag word" when "tag facet" changes. Only associated tag word should change,
        // tag word fields in another tag matches in the same target or other targets should not change.
        // FIXME: this does not look right, there must be a way to update element in the browser without manipulating it directly in DOM
        // angular.element('#tag-word-'+index).children().children("a.tag-word").html(this.target.tagData[index].tagWord);
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    //noinspection JSUnusedLocalSymbols
    onChangeInternalTagWord(index) {
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    tagOperation(index, operation) {
        this.target.tagData[index].tagOperation = operation;
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    setSortByEl(sortOrder) {
        this.target.sortByEl = sortOrder;
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    setSelector(element) {
        this.target.selector = element;
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    setAggregator(element) {
        this.target.aggregator = element;
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    setAlias() {
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    setFormat(element, elementDisplayStr) {
        this.target.format = element;
        this.target.formatDisplay = elementDisplayStr;
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    setColumns() {
        // console.log(this.target.columns);
        this.target.needToBuildQuery = true;
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



    //////////////////////////////////////////////////
    //////////////////////////////////////////////////
    //////////////////_NEW_/////////////////////


    onChangeNsgQl() {
        console.log('onChangeNsgQl');

        console.log(this.target);

        // let nsgql = this.SQLBuilderFactory.factory({
        //     select: ['id', 'name', 'owner', 'shared'],
        //     from: 'maps',
        //     where: [
        //         'AND',
        //         {
        //             id: ['=', id]
        //         }
        //     ]
        // }).compile();

        this.target.nsgqlQuery = [{
            "nsgql": this.target.customNsgqlQuery,
            "format": "time_series"
        }];
        this.target.needToBuildQuery = false;
        this.refresh();
    }


    toggleEditorMode() {
        console.log(11);

        this.rowMode = !this.rowMode;
    }

    getCollapsedText() {
        return this.target.customNsgqlQuery;
    }

    onFromChange() {
        console.log('%conFromChanges', 'color: blue; font-weight: bold;', this.category);

        if( this.target.category !== this.category  && this.variable != this.prompts['variable']) {
            console.log(111);
            this.target.category = this.category;
            this.variable = this.prompts['variable'];
            this.onSelectChange();
            return;
        }

        this.target.category = this.category;

        console.log('%cqueryConfig', 'color: red; font-weight: bold;', this.target.queryConfig);
        // console.log('%cquery', 'color: red; font-weight: bold;', this.target.queryConfig.compile());
        console.log(this.category);
        this.target.queryConfig.from(this.category);
    }
    onSelectChange() {
        console.log('%conSelectChange', 'color: blue; font-weight: bold;', this.variable);

        this.target.variable = this.variable;
        this.target.queryConfig.select([this.variable]);
        this.target.queryConfig.setDistinct(true);
        // this.panelCtrl.refresh();
        console.log('%cqueryConfig', 'color: red; font-weight: bold;', this.target.queryConfig);
        console.log('%cquery', 'color: red; font-weight: bold;', this.target.queryConfig.compile());
        this.refresh();
    }



    getTagsOrValues(segment, index) {
        console.log(segment, index);
        let format = 'list';

        if (segment.type === 'condition') {
            return this.$q.when([this.uiSegmentSrv.newSegment('AND'), this.uiSegmentSrv.newSegment('OR')]);
        }
        if (segment.type === 'operator') {
            var nextValue = this.tagSegments[index+1].value;
            return this.$q.when(this.uiSegmentSrv.newOperators(['=', '!=', '<>', '<', '>','REGEXP','NOT REGEXP']));
        }

        let nsgql, addTemplateVars;
        if (segment.type === 'key' || segment.type === 'plus-button') {
            nsgql = this.SQLBuilder.factory({
                select: ['tagFacet'],
                from: 'devices',
                orderBy: ['tagFacet']
            }).compile();

            addTemplateVars = false;
        } else if (segment.type === 'value')  {
            let queryObj;

            queryObj = {
                select: [this.tagSegments[index-2].value],
                from: 'devices',
                where: {},
                orderBy: [this.tagSegments[index-2].value]
            };
            queryObj.where[this.tagSegments[index-2].value] = ['NOTNULL'];

            nsgql = this.SQLBuilder.factory(queryObj).compile();

            addTemplateVars = true;
        }

        return this.datasource.executeQuery(nsgql, format)
            .then(this.transformToWhereSegments(addTemplateVars))
            .then(results => {
                if (segment.type === 'key') {
                    results.splice(0, 0, angular.copy(this.removeTagFilterSegment));
                }
                return results;
            });
    }

    transformToWhereSegments(addTemplateVars) {
        return (results) => {
            console.log(results);
            var segments = _.map(results, segment => {
                return this.uiSegmentSrv.newSegment({ value: `${segment}` });
            });

            if (addTemplateVars) {
                for (let variable of this.templateSrv.variables) {
                    segments.unshift(this.uiSegmentSrv.newSegment({ type: 'template', value: '/^$' + variable.name + '$/', expandable: true }));
                }
            }

            return segments;
        };
    }

    tagSegmentUpdated(segment, index) {
        this.tagSegments[index] = segment;

        // handle remove tag condition
        console.log(this.removeTagFilterSegment.value);
        console.log(segment);
        if (segment.value === this.removeTagFilterSegment.value) {
            this.tagSegments.splice(index, 3);
            if (this.tagSegments.length === 0) {
                this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
            } else if (this.tagSegments.length > 2) {
                this.tagSegments.splice(Math.max(index-1, 0), 1);
                if (this.tagSegments[this.tagSegments.length-1].type !== 'plus-button') {
                    this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
                }
            }
        } else {
            if (segment.type === 'plus-button') {
                if (index > 2) {
                    this.tagSegments.splice(index, 0, this.uiSegmentSrv.newCondition('AND'));
                }
                this.tagSegments.push(this.uiSegmentSrv.newOperator('='));
                this.tagSegments.push(this.uiSegmentSrv.newFake('select tag value', 'value', 'query-segment-value'));
                segment.type = 'key';
                segment.cssClass = 'query-segment-key';
            }

            if ((index+1) === this.tagSegments.length) {
                this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
            }
        }

        this.rebuildTargetTagConditions();
    }

    rebuildTargetTagConditions() {
        var tags = [];
        var tagIndex = 0;
        var tagOperator = "";

        console.log(this.tagSegments);

        _.each(this.tagSegments, (segment2, index) => {
            if (segment2.type === 'key') {
                if (tags.length === 0) {
                    tags.push({});
                }
                tags[tagIndex].key = segment2.value;
            } else if (segment2.type === 'value') {
                tagOperator = this.getTagValueOperator(segment2.value, tags[tagIndex].operator);
                if (tagOperator) {
                    this.tagSegments[index-1] = this.uiSegmentSrv.newOperator(tagOperator);
                    tags[tagIndex].operator = tagOperator;
                }
                tags[tagIndex].value = segment2.value;
            } else if (segment2.type === 'condition') {
                tags.push({ condition: segment2.value });
                tagIndex += 1;
            } else if (segment2.type === 'operator') {
                tags[tagIndex].operator = segment2.value;
            }
        });

        this.target.tags = tags;
        console.log(this.target.tags);

        this.target.queryConfig.where( this._buildTagsWhere('tags', this.target.tags) );


        console.log('%cqueryConfig', 'color: red; font-weight: bold;', this.target.queryConfig);
        console.log('%cquery', 'color: red; font-weight: bold;', this.target.queryConfig.compile());
        // this.refresh();
    }

    _buildTagsWhere(name, tagsList) {
        let result = ['AND'];

        if(tagsList.length) {
            tagsList.forEach( (tag, i) => {
                let obj = {};
                obj[tag.key] = [tag.operator, tag.value];

                if(tag.condition) {
                    result.push(tag.condition);
                }
                result.push(obj);
            })
        }

        return result;
    }
}

NetSpyGlassDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
