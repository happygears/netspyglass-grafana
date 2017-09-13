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

/**
 * @typedef {{ type: string, cssClass: string }} ISegment
 */
const orderBySortTypes = ['ASC','DESC'];

const targetDefaults = {
    columns: [{name: 'metric', visible: true}],
    category: QueryPrompts.category,
    variable: QueryPrompts.variable,
    orderBy:  {
        column: QueryPrompts.orderBy,
        sort: orderBySortTypes[0]
    },
    rawQuery: 0,
    limit: 100,
    tags: [],
    groupBy: {
        type: QueryPrompts.groupByType,
        value: QueryPrompts.groupBy
    }
};

export class NetSpyGlassQueryCtrl extends QueryCtrl {

    /**
     * @var {NetSpyGlassDatasource} datasource
     * @property refresh
     * @property panelCtrl
     */

    constructor($scope, $injector, uiSegmentSrv) {
        super(...arguments);
        this.$scope = $scope;
        this.$injector = $injector;
        this.prompts = QueryPrompts;
        this.uiSegmentSrv = uiSegmentSrv;
        this.options = {
            isGraph: this.panel.type === 'graph',
            isTable: this.panel.type === 'table',
            categories: [],
            segments: [],
            removeSegment: uiSegmentSrv.newSegment({fake: true, value: this.prompts.removeTag})
        };
    }

    execute() {
        this.errors = {};
        this.panelCtrl.refresh();
        // console.log(this);
    }

    init() {
        this.initTarget();
        this.options.segments = this.restoreTags();
        this.getCategories();
        this.loadColumns();
        
        this.panelCtrl.events.emitter.on('data-error', (errors) => {
            this.errors = _.cloneDeep(errors);
        });

        if (!this.options.isGraph) {
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
        _.defaultsDeep(
            this.target, 
            targetDefaults, 
            {format: this.options.isGraph ? 'time_series' : 'table'}
        );

        if (this.options.isGraph) {
            if (!_.find(this.target.columns, {name: 'time'})) {
                this.target.columns.push({name: 'time', visible: false});
            }
        }
    }

    setPanelSortFromOrderBy() {
        const index = _.findIndex(this.target.columns, (column) => {
            return column.name === this.target.orderBy.column || column.alias === this.target.orderBy.column;
        });

        this.panel.sort.col = index > -1 ? index : null;
        this.panel.sort.desc = this.target.orderBy.sort == orderBySortTypes[1];
    }

    setOrderByFromPanelSort(value) {
        if (value.col !== null) {
            this.target.orderBy.column = this.target.columns[value.col].alias || this.target.columns[value.col].name;
            this.target.orderBy.sort = value.desc ? orderBySortTypes[1] : orderBySortTypes[0];
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

        if (this.target.tags.length) {
            for (let tag of this.target.tags) {
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
        return this.datasource.getCategories();
    }

    /**
     * @param {string} $variable
     */
    onSelectCategory($variable) {
        this.target.variable = $variable;
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

    onChangeOrderBy() {
        this._updateOrderBy();
    }

    onClearOrderBy() {
        this.target.orderBy.column = this.prompts.orderBy;
        this._updateOrderBy();
    }

    onClearGroupBy() {
        this.target.groupBy.type = QueryPrompts.groupByType;
        this.target.groupBy.value = QueryPrompts.groupBy;
        this.execute();
    }

    onColumnRemove($column) {
        const index = this.target.columns.indexOf($column);

        if (index !== -1) {
            this.target.columns[index].willRemove = true;
            this.target.columns.splice(index, 1);
            this.execute();
            return {index};
        }

        return false;
    }

    onColumnChanged($column) {
        this.execute();
    }

    onColumnAdd() {
        this.target.columns.push({
            visible: true,
            name: this.prompts.column
        });
    }

    /**
     * @returns {Promise|boolean}
     */
    loadColumns() {
        if (this.target.variable) {
            return this.datasource
                .getColumns(this.target.variable)
                .then((columns) => (this.options.columns = columns));
        }

        return false;
    }

    toggleEditorMode() {
        this.target.rawQuery ^= 1;

        if (this.target.rawQuery) {
            this.target.nsgqlString = this.datasource.getSQLString(this.target);
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

        if (this.target.variable) {
            switch (segment.type) {
                case 'key':
                case 'plus-button':
                    promise = this.datasource
                        .getFacets(this.target.variable)
                        .then((facets) => ['component', 'device'].concat(facets));
                    break;

                case 'value':

                    promise = this.datasource.getSuggestions({
                        type: segments[index - 2].value,
                        variable: this.target.variable,
                        tags: this.target.tags,
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

        this.target.tags = tags;
        this.execute();
    }

    getOrderByOptions() {
        let list = [];

        if (this.options.isGraph) {
            list.push({text: 'metric', value: 'metric'});
        } else if (this.options.isTable) {
            this.target.columns.forEach((el) => {
                if(el.appliedFunctions.length && !el.alias) return;

                let val = el.alias || el.name;
                list.push({text: val, value: val});
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
        switch (this.target.groupBy.type) {
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
                return this.datasource.getFacets(this.target.variable).then( (data) => {
                    return data.map((el) => {
                        return {text: el, value: el}
                    })
                });
                break;
        }
    }
}

NetSpyGlassQueryCtrl.templateUrl = 'partials/query.editor.html';
