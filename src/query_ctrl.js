/*
 * Copyright (c) 2017.  Happy Gears, Inc
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
import {QueryPrompts, GrafanaVariables} from './dictionary';
import utils from './services/utils';

/**
 * @typedef {{ type: string, cssClass: string }} ISegment
 */
const orderBySortTypes = ['ASC', 'DESC'];

const targetDefaults = {
    type: 'nsgql',
    columns: [{name: 'metric', visible: true}],
    variable: QueryPrompts.variable,
    orderBy: {
        column: {
            name: '',
            value: '',
            alias: ''
        },
        sort: orderBySortTypes[0],
        colName: QueryPrompts.orderBy
    },
    rawQuery: 0,
    limit: 100,
    tags: [],
    groupBy: {
        type: QueryPrompts.groupByType,
        value: QueryPrompts.groupBy
    }
};

//http://angular-dragdrop.github.io/angular-dragdrop/

export class NetSpyGlassQueryCtrl extends QueryCtrl {

    /**
     * @var {NetSpyGlassDatasource} datasource
     * @property refresh
     * @property panelCtrl
     */

    constructor($scope, $injector, $rootScope, uiSegmentSrv) {
        super(...arguments);
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$injector = $injector;
        this.prompts = QueryPrompts;
        this.uiSegmentSrv = uiSegmentSrv;

        this.options = {
            isGraph: this.panel.type === 'graph',
            isTable: this.panel.type === 'table',
            isSinglestat: this.panel.type === 'singlestat',
            categories: [],
            segments: [],
            removeSegment: uiSegmentSrv.newSegment({fake: true, value: this.prompts.removeTag}),
            rawQueryString: '',
        };
    }

    execute() {
        this.errors = {};
        this.store.loading = true;
        this.panelCtrl.refresh();
    }

    init() {
        this.initTarget();
        this.options.segments = this.restoreTags();
        this.getCategories()
            .then(() => this.loadColumns());

        this.panelCtrl.events.emitter.on('data-error', (errors) => {
            this.errors = _.cloneDeep(errors);
        });
        
        this.panelCtrl.events.emitter.on('render', () => {
            this.store.loading = false;
        });

        if (this.options.isTable) {
            this.setPanelSortFromOrderBy();
            this.$scope.$watch('ctrl.panel.sort', (newVal, oldVal) => {
                if (newVal.col !== oldVal.col || newVal.desc !== oldVal.desc) {
                    this.setOrderByFromPanelSort(newVal);
                    this.execute();
                }
            }, true);
        }
    }

    initTarget() {
        this.target._nsgTarget = this.target._nsgTarget || {};
        this.store = this.target._nsgTarget;
        this.store.refId = this.target.refId; 
        
        _.defaultsDeep(
            this.store,
            targetDefaults
        );

        this.store.format = (this.options.isGraph || this.options.isSinglestat) ? 'time_series' : 'table';
        this.store.isTablePanel = this.options.isTable;

        if (this.options.isGraph || this.options.isSinglestat) {
            if (!_.find(this.store.columns, {name: 'time'})) {
                this.store.columns.push({name: 'time', visible: false});
            }
        }

        if (this.options.isSinglestat) {
            this.store.limit = 1;
        }
    }

    setPanelSortFromOrderBy() {
        const index = _.findIndex(this.store.columns, (column) => {
            return utils.compileColumnName(column) === this.store.orderBy.column.name;
        });

        this.panel.sort.col = index > -1 ? index : null;
        this.panel.sort.desc = this.store.orderBy.sort == orderBySortTypes[1];
    }

    setOrderByFromPanelSort(value) {
        if (value.col !== null) {
            this.store.orderBy.column = {
                name: utils.compileColumnName(this.store.columns[value.col]),
                value: utils.compileColumnAlias(this.store.columns[value.col]),
                alias: this.store.columns[value.col].alias
            };
            this.store.orderBy.colName = this.store.orderBy.column.alias || this.store.orderBy.column.name;
            this.store.orderBy.sort = value.desc ? orderBySortTypes[1] : orderBySortTypes[0];
        } else {
            this.onClearOrderBy();
        }
    }

    /**
     * @returns {array}
     */
    restoreTags() {
        const uiSegmentSrv = this.uiSegmentSrv;
        let segments = [];

        if (this.store.tags.length) {
            for (let tag of this.store.tags) {
                if (tag.condition) {
                    segments.push(uiSegmentSrv.newCondition(tag.condition));
                }

                segments.push(uiSegmentSrv.newKey(tag.key));
                segments.push(uiSegmentSrv.newOperator(tag.operator));
                segments.push(uiSegmentSrv.newKeyValue(tag.value));
            }
        }

        segments.push(uiSegmentSrv.newPlusButton());

        return segments;
    }

    getCategories() {
        return this.datasource
            .getCategories()
            .then((categories) => {
                this.options.categories = categories;
                return categories;
            });
    }

    /**
     * @param {string} $variable
     */
    onSelectCategory($variable) {
        this.store.variable = $variable;
        this.loadColumns();
        this.execute();
    }

    _updateOrderBy() {
        if (this.options.isGraph) {
            this.execute();
        } else {
            this.setPanelSortFromOrderBy();
        }
    }

    onChangeOrderBy($value) {
        this.store.orderBy.column = $value;
        this.store.orderBy.colName = this.store.orderBy.column.alias || this.store.orderBy.column.name;

        this._updateOrderBy();
    }

    onChangeOrderBySort() {
        this._updateOrderBy();
    }

    onClearOrderBy() {
        this.store.orderBy.column = {};
        this.store.orderBy.colName = this.prompts.orderBy;
        this._updateOrderBy();
    }

    onClearGroupBy() {
        this.store.groupBy.type = QueryPrompts.groupByType;
        this.store.groupBy.value = QueryPrompts.groupBy;
        this.execute();
    }

    onColumnRemove($column) {
        const index = this.store.columns.indexOf($column);

        if (index !== -1) {
            this.store.columns[index].willRemove = true;
            this.store.columns.splice(index, 1);

            if (this.store.orderBy.column.name === utils.compileColumnName($column)) {
                this.onClearOrderBy();
            }

            this.execute();
            return {index};
        }

        return false;
    }

    onColumnChanged($column, $prevColumnState) {
        if (this.store.orderBy.column.name === utils.compileColumnName($prevColumnState)) {
            this.store.orderBy.column = {
                name: utils.compileColumnName($column),
                value: utils.compileColumnAlias($column),
                alias: $column.alias
            };
            this.store.orderBy.colName = this.store.orderBy.column.alias || this.store.orderBy.column.name;
        }
        this.execute();
    }

    onColumnAdd() {
        this.store.columns.push({
            visible: true,
            name: this.prompts.column
        });
    }

    onDrop($event, $data, column) {
        $event.preventDefault();
        $event.stopPropagation();
        
        let dstIndex = this.store.columns.indexOf(column);
        let srcIndex = $data;
        
        if (srcIndex >= 0  && dstIndex >= 0 && srcIndex !== dstIndex) {
            const srcColumn = angular.copy(this.store.columns[srcIndex]);
            this.store.columns.splice(srcIndex, 1);
            this.store.columns.splice(dstIndex, 0, srcColumn);
            this.setPanelSortFromOrderBy();
            this.execute();
        }
    }

    /**
     * @returns {Promise|boolean}
     */
    loadColumns() {
        if (this.store.variable && this.store.variable !== QueryPrompts.column && this.options.isTable) {
            let found = -1;    
            _.each(this.options.categories, (category) => {
                found = _.findIndex(category.submenu, {value: this.store.variable });
                if (~found) {
                    return false;
                }
            });

            if (~found) {
                return this.datasource
                    .getColumns(this.store.variable)
                    .then((columns) => {
                        this.options.columns = columns;
                    });
            }
        }

        return false;
    }

    toggleEditorMode() {
        if (!this.store.rawQuery) {
            const query = this.datasource.getSQLString(this.store);

            this.options.rawQueryString = query;
            this.store.nsgqlString = query;

            this.store.rawQuery = 1;
            return;
        }

        if( this.options.rawQueryString != this.store.nsgqlString ) {
            this.$rootScope.appEvent('confirm-modal', {
                title: 'Confirm',
                text: 'Are your sure? Your changes will be lost.',
                yesText: "Yes",
                icon: "fa-trash",
                onConfirm: () => {
                    this.store.rawQuery = 0;
                }
            });
        } else {
            this.store.rawQuery = 0;
        }
    }

    /**
     * @param {ISegment} segment
     * @param {number} index
     * @returns {Promise}
     */
    getTagsOrValues(segment, index) {
        const $q = this.$injector.get('$q');
        const uiSegmentSrv = this.uiSegmentSrv;
        const segments = this.options.segments;
        let promise = $q.resolve([]);

        if (this.store.variable) {
            switch (segment.type) {
                case 'key':
                case 'plus-button':
                    promise = this.datasource
                        .getFacets(this.store.variable)
                        .then((facets) => ['component', 'device'].concat(facets));
                    break;

                case 'value':
                    promise = this.datasource.getSuggestions({
                        type: segments[index - 2].value,
                        variable: this.store.variable,
                        tags: this._filterPreviousWhereTags(index),
                    });
                    break;

                case 'condition':
                    return $q.resolve([
                        this.uiSegmentSrv.newCondition('AND'),
                        this.uiSegmentSrv.newCondition('OR')
                    ]);
                    break;

                case 'operator':
                    return $q.resolve(this.uiSegmentSrv.newOperators([
                        '=', '!=', '<>', '<', '>', 'REGEXP', 'NOT REGEXP'
                    ]));
                    break;
            }
        }

        return promise
            .then((list) => list.map((item) => uiSegmentSrv.newSegment({value: `${item}`})))
            .then(results => {
                if (segment.type === 'key') {
                    results.splice(0, 0, angular.copy(this.options.removeSegment));
                }
                return results;
            });
    }

    /**
     * @param {Number} currentIndex - index of current Segment
     * @returns {Array} - returns array of tag objects that placed before current tag triplet
     */
    _filterPreviousWhereTags(currentIndex) {
        return this.store.tags.filter((el, index) => index < currentIndex/3 - 1)
    }

    /**
     * @param {ISegment} segment
     * @param {number} index
     */
    tagSegmentUpdated(segment, index) {
        const segmentSrv = this.uiSegmentSrv;
        const segments = this.options.segments;
        segments[index] = segment;

        // handle remove tag condition

        if (segment.value === this.options.removeSegment.value) {
            segments.splice(index, 3);
            if (segments.length === 0) {
                segments.push(segmentSrv.newPlusButton());
            } else if (segments.length > 2) {
                segments.splice(Math.max(index - 1, 0), 1);
                if (segments[segments.length - 1].type !== 'plus-button') {
                    segments.push(segmentSrv.newPlusButton());
                }
            }
        } else {
            if (segment.type === 'plus-button') {
                if (index > 2) {
                    segments.splice(index, 0, segmentSrv.newCondition('AND'));
                }

                segments.push(segmentSrv.newOperator('='));
                segments.push(segmentSrv.newFake(this.prompts.whereValue, 'value', 'query-segment-value'));
                segment.type = 'key';
                segment.cssClass = 'query-segment-key';
            }

            if (segment.type === 'key' && segments[index+2].type === 'value') {
                segments.splice(index+2, 1, segmentSrv.newFake(this.prompts.whereValue, 'value', 'query-segment-value'));
            }

            if ((index + 1) === segments.length) {
                segments.push(segmentSrv.newPlusButton());
            }
        }

        this.rebuildTargetTagConditions();
    }

    rebuildTargetTagConditions() {
        const segments = this.options.segments;
        const tags = [];
        let tagIndex = 0;
        let tagOperator = '';

        segments.forEach((segment, index) => {
            switch (segment.type) {
                case 'key':
                    if (tags.length === 0) {
                        tags.push({});
                    }
                    tags[tagIndex].key = segment.value;
                    break;
                case 'value':
                    if (tagOperator = tags[tagIndex].operator) {
                        segments[index - 1] = this.uiSegmentSrv.newOperator(tagOperator);
                        tags[tagIndex].operator = tagOperator;
                    }
                    tags[tagIndex].value = segment.value;
                    break;
                case 'condition':
                    tags.push({condition: segment.value});
                    tagIndex += 1;
                    break;
                case 'operator':
                    tags[tagIndex].operator = segment.value;
                    break;
            }
        });

        this.store.tags = tags;
        this.execute();
    }


    // getFooOptions() {
    //     let list = [];
        
    //     list.push({text: 'metric1', value: 'metric1'});
    //     list.push({text: 'metric2', value: 'metric2'});
    //     list.push({text: `sdadad`, value: `sdadad'`});
        
    //     return this.$injector
    //         .get('$q')
    //         .resolve(list);
    // }

    // onChangeFoo() {
    //     console.log(this.store.foo);
    // }

    getOrderByOptions() {
        let list = [];

        if (this.options.isGraph) {
            list.push({text: 'metric', value: 'metric'});
        } else if (this.options.isTable) {
            this.store.columns.forEach((column) => {
                list.push({
                    text: column.alias || utils.compileColumnName(column),
                    value: {
                        name: utils.compileColumnName(column),
                        value: utils.compileColumnAlias(column),
                        alias: column.alias
                    }
                })
            });
        }

        return this.$injector
            .get('$q')
            .resolve(list);
    }

    getOrderBySortOptions() {
        return this.$injector
            .get('$q')
            .resolve([
                {text: orderBySortTypes[0], value: orderBySortTypes[0]},
                {text: orderBySortTypes[1], value: orderBySortTypes[1]}
            ]);
    }

    getLimitOptions() {
        return this.$injector.get('$q').resolve([
            {text: 'None', 'value': ''},
            {text: '1', 'value': 1},
            {text: '5', 'value': 5},
            {text: '10', 'value': 10},
            {text: '50', 'value': 50},
            {text: '100', 'value': 100}
        ]);
    }

    getGroupByTypes() {
        return this.$injector.get('$q').resolve([
            {text: 'time', value: 'time'},
            {text: 'column', value: 'column'}
        ])
    }

    getGroupByVariables() {
        switch (this.store.groupBy.type) {
            case 'time':
                return this.$injector.get('$q').resolve([
                    {text: GrafanaVariables.interval, value: GrafanaVariables.interval},
                    {text: '1s', value: '1s'},
                    {text: '1m', value: '1m'},
                    {text: '1h', value: '1h'},
                    {text: '1d', value: '1d'},
                ]);
                break;
            case 'column':
                const list = [{text: 'device', value: 'device'}];
                return this.datasource.getFacets(this.store.variable).then((data) => {
                    data.forEach((el) => {
                        list.push({text: el, value: el})
                    });

                    return list;
                });
                break;
        }
    }

    getCollapsedText() {
        return 'This target is collapsed. Click to the row for open it.';
    }
}

NetSpyGlassQueryCtrl.templateUrl = 'partials/query.editor.html';
