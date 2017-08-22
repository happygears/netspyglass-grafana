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

    constructor($scope, $injector, templateSrv, $q, uiSegmentSrv, $timeout) {
        super($scope, $injector);

        this.prompts = {
            'category': 'select category',
            'variable': 'select variable',
            'device': 'select device',
            'component': 'select component',
            'groupByType': 'select type',
            'groupBy': 'select value',
            'orderBy': 'select value',
            'selectItem': 'select item'
        };

        this.scope = $scope;
        this.injector = $injector;

        this.templateSrv = templateSrv;
        this.$q = $q;
        this.uiSegmentSrv = uiSegmentSrv;
        this.$timeout = $timeout;

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

        this.target.format = this.panel.type === 'table' ? 'table' : 'time_series';
        this.target.formatDisplay = this.target.formatDisplay || 'Time Series';

        this.target.columns = this.target.columns || 'time,variable,device,component,metric';
        this.target.alias = this.target.alias || '';


        // _NEW_
        this.SQLBuilder = new SQLBuilderFactory();
        this.target.queryConfig = this.SQLBuilder.factory();
        this.target.customNsgqlQuery = '';

        this.queryConfigWhere = ['AND'];
        this.rowMode = false;

        this.category = this.target.category || this.prompts['category'];
        this.variable = this.target.variable || this.prompts['variable'];
        this.groupByFormats = [this.prompts['groupByType'],'time', 'column'];
        this.groupBy = {
            type: this.prompts['groupByType'],
            val: this.prompts['groupBy']
        };
        this.orderBy = this.target.orderBy || this.prompts.orderBy;

        this.tagSegments = [];
        this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
        this.removeTagFilterSegment = uiSegmentSrv.newSegment({fake: true, value: '-- remove tag filter --'});

        this.categories = [];
        this.getCategories();

        if( this.panel.type === 'graph' ) {
            this.selectData = ['time','metric'];
        }
        if( this.panel.type === 'table' ) {
            this.selectData = [];
            this.addItemToSelect();
        }
        this.selectList = [];
    }

    addItemToSelect(data) {
        if( typeof data === 'object' ) {
            this.selectData.push(data)
        } else {
            this.selectData.push({
                value: '',
                func: [],
                alias: []
            });
        }
    }

    /**
     * @deprecated
     */
    isCategorySelected() {
        return this.target.category !== this.prompts['category'] && this.target.category !== this.clearSelection;
    }

    /**
     * @deprecated
     */
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
    /**
     * @deprecated
     */
    tagDataAdd() {
        this.target.tagData[this.target.tagData.length] = {
            tagFacet : this.blankDropDownElement,
            tagWord : this.blankDropDownElement,
            tagOperation : '=='
        };
        this.refresh();
    }
    /**
     * @deprecated
     */
    tagDataRemove(index) {
        this.target.tagData.splice(index,1);
        this.refresh();
    }

    getCategories() {
        this.datasource.executeQuery(this.SQLBuilder.factory({
            select: ['category,name'],
            distinct: true,
            from: 'variables',
            where: ['AND', {
                category: ['<>', '']
            }],
            orderBy: ['category']
        }).compile(), 'json')
            .then( (data) => {
                let formattedList = _.groupBy(data[0].rows, 'category');

                console.log(formattedList);

                this.categories = formattedList;
            });
    }
    selectCat(category, variable) {
        this.target.category = category;
        this.variable = variable;
        this.target.variable = variable;
        this.target.queryConfig.from(variable);

        if( this.panel.type === 'graph' ) {
            this.target.queryConfig.select(this.selectData);
        }

        this.buildNsgQLString();
        this.refresh();
    }

    getSelectValue() {
        this.$q.all([
            this.datasource.executeQuery(this.SQLBuilder.factory({
                select: ['tagFacet'],
                distinct: true,
                from: this.variable,
                orderBy: ['tagFacet']
            }).compile(), 'list'),
            this.datasource.executeQuery(this.SQLBuilder.factory({
                select: ['category,name'],
                distinct: true,
                from: 'variables',
                where: ['AND', {
                    category: ['<>', '']
                }],
                orderBy: ['category']
            }).compile(), 'json')
        ]).then( (values) => {
            let facetsList = values[0],
                variables = _.groupBy(values[1][0].rows, 'category'),
                resultList = [];

            resultList.push({
                tags: facetsList.map( (facet) => {
                    return {name: facet}
                })
            });

            resultList.push({
                type: 'separator'
            });

            resultList.push({
                type: 'simple',
                name: 'time'
            });
            resultList.push({
                type: 'simple',
                name: 'metric'
            });

            resultList.push({
                type: 'separator'
            });

            resultList.push(variables);

            this.selectList = resultList;
        });
    }
    onSelectUpdated(value) {
        this.$timeout( () => {
            let selectedValues = this.selectData.map( (el) => {
                if( el.value ) {
                    return el.value;
                }
            }).filter(Boolean);

            this.target.queryConfig.select(selectedValues);

            this.buildNsgQLString();
            this.refresh();
        }, 0);
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

            console.log(segments);

            return segments;
        };
    }

    /**
     * @deprecated
     */
    testRemove() {
        this.target.variable = this.prompts['variable'];
        this.getVariables();
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

    /**
     * @deprecated
     */
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
        this.refresh();
    }

    /**
     * @deprecated
     */
    onChangeInternalVariable() {
        this.refresh();
    }

    /**
     * @deprecated
     */
    onChangeInternalDevice() {
        if(this.target.device == this.clearSelection) {
            this.target.device = this.prompts['device'];
        }
        this.refresh();
    }
    /**
     * @deprecated
     */
    onChangeInternalComponent() {
        if(this.target.component == this.clearSelection) {
            this.target.component = this.prompts['component'];
        }
        this.refresh();
    }

    /**
     * @deprecated
     */
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

    /**
     * @deprecated
     */
    //noinspection JSUnusedLocalSymbols
    onChangeInternalTagWord(index) {
        this.target.needToBuildQuery = true;
        this.refresh();
    }

    /**
     * @deprecated
     */
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
        this.buildNsgQLString({type: 'string'});
        this.refresh();
    }

    toggleEditorMode() {
        this.rowMode = !this.rowMode;
    }

    getCollapsedText() {
        return this.target.customNsgqlQuery;
    }

    onFromChange() {
        if( this.target.category !== this.category  && this.variable != this.prompts['variable']) {
            console.log(111);
            this.target.category = this.category;
            this.variable = this.prompts['variable'];
            this.onSelectChange();
            return;
        }

        this.target.category = this.category;
    }
    onSelectChange() {
        this.target.variable = this.variable;
        this.target.queryConfig.select(['time','metric']);
        this.target.queryConfig.from(this.variable);

        this.buildNsgQLString();
        this.refresh();
    }

    onOrderByChange() {
        this.target.queryConfig.clearOrderBy();

        if( this.orderBy != this.clearSelection ) {
            this.target.queryConfig.orderBy(this.orderBy);
        }

        this.buildNsgQLString();
        this.refresh();
    }
    onOrderByClear() {
        this.orderBy = null;
        this.target.queryConfig.clearOrderBy();

        this.buildNsgQLString();
        this.refresh();
    }
    getOrderByValues() {
        let list = [];

        // return this.datasource.executeQuery(query, 'list')
        //     .then(this.transformToSegments(this.groupBy.val, 'select group'));

        // if( this.panel.type === 'graph' ) {
        //     list = ['metric'];
        // }
        // if( this.panel.type === 'table' ) {
        //     list = this.selectData.map( (el) => {
        //         return el.value;
        //     });
        // }

        if( this.panel.type === 'graph' ) {
            list = [
                this.uiSegmentSrv.newSegment('metric')
            ];
        }
        if( this.panel.type === 'table' ) {
            list = this.selectData.map( (el) => {
                return this.uiSegmentSrv.newSegment(el.value);
            });
        }

        list.unshift(this.uiSegmentSrv.newSegment({fake: true, value: this.clearSelection, html: this.prompts.orderBy}));

        return this.$q.when(list);
    }

    onLimitChange() {
        if( this.limit ) {
            this.target.queryConfig.limit(this.limit);
        } else {
            this.target.queryConfig.clearLimit();
        }

        this.buildNsgQLString();
        this.refresh();
    }

    onGroupByTypeChange() {
        //TODO: fix this behavior
        this.groupBy.val = this.prompts['groupBy'];

        if( this.groupBy.type === 'select type' ) {
            this.target.queryConfig.clearGroupBy();
            this.buildNsgQLString();
            this.refresh();
        }
    }

    onGroupByChange() {
        if( this.groupBy.type === 'time' ) {
            this.target.queryConfig.groupBy(`time(${this.groupBy.val})`);
        }
        if( this.groupBy.type === 'column' ) {
            this.target.queryConfig.groupBy(this.groupBy.val);
        }

        this.buildNsgQLString();
        this.refresh();
    }

    getGroupByVariables() {
        if( this.groupBy.type === 'time' ) {
            let groupByTimeOptions = [
                this.uiSegmentSrv.newSegment('1s'),
                this.uiSegmentSrv.newSegment('1m'),
                this.uiSegmentSrv.newSegment('30m'),
                this.uiSegmentSrv.newSegment('1h'),
                this.uiSegmentSrv.newSegment('1d')
            ];
            return this.$q.when(groupByTimeOptions);
        }

        if( this.groupBy.type === 'column' ) {
            let query = this.SQLBuilder.factory({
                select: ['tagFacet'],
                distinct: true,
                from: this.variable,
                orderBy: ['tagFacet']
            }).compile();

            return this.datasource.executeQuery(query, 'list')
                .then(this.transformToSegments(this.groupBy.val, '-- select group --'));
        }
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
                distinct: true,
                from: this.variable,
                orderBy: ['tagFacet']
            }).compile();

            addTemplateVars = false;
        } else if (segment.type === 'value')  {
            let queryObj;

            queryObj = {
                select: [this.tagSegments[index-2].value],
                distinct: true,
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
                console.log(results);
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
                tagOperator = tags[tagIndex].operator;
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

        this.queryConfigWhere.push(this._buildTagsWhere('tags', this.target.tags));

        this.buildNsgQLString();
        this.refresh();
    }

    _buildTagsWhere(name, tagsList) {
        let result = [];

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

        if( result.length ) {
            result.unshift('AND');
        }

        return result;
    }

    buildNsgQLString(params = {}) {
        let str;

        if( params.type == 'string' ) {
            str = this.target.customNsgqlQuery;
        }

        if( params.type != 'string' ) {
            this.queryConfigWhere.push('$_timeFilter'); //GROUP BY time($__interval)
            this.target.queryConfig.where( this.queryConfigWhere );

            str = this.target.queryConfig.compile();
        }

        console.log('%cNsgQLString', 'color: blueviolet; font-weight: bold;', str);
        this.target.customNsgqlQuery = str;
    };
}

NetSpyGlassDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
