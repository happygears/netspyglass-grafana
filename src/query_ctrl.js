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
import {QueryPrompts} from './dictionary';
import './css/query-editor.css!'

/**
 * @typedef {{ type: string, cssClass: string }} ISegment
 */

const targetDefaults = {
    columns: [],
    category: QueryPrompts.category,
    variable: QueryPrompts.variable,
    rawQuery: 0,
    limit: 100
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
            categories: [],

            segments: [
                uiSegmentSrv.newPlusButton()
            ],

            removeSegment: uiSegmentSrv.newSegment({fake: true, value: '-- remove tag filter --'})
        };
    }

    execute() {
        this.panelCtrl.refresh();
    }

    init() {
        this.initTarget();
        this.datasource
            .getCategories()
            .then((categories) => {
                this.options.categories = categories;
            });
    }

    initTarget() {
        _.defaultsDeep(
            this.target, 
            targetDefaults, 
            {format: this.panel.type === 'table' ? 'table' : 'time_series'}
        );
    }

    /**
     * @param {string} category
     * @param {string} variable
     */
    selectCategory(category, variable) {
        this.target.category = category;
        this.target.variable = variable;
        this.execute();
    }

    toggleEditorMode() {
        this.target.rawQuery ^= 1;
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

        this.rebuildTargetTagConditions();

        return promise.then((list) => list.map((item) => uiSegmentSrv.newSegment({value: `${item}`})));
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
    }

    rebuildTargetTagConditions() {
        const segments = this.options.segments;
        const tags = [];
        let tagIndex = 0;
        let tagOperator = '';

        segments.forEach((segment, index) => {
            if (segment.type === 'key') {
                if (tags.length === 0) {
                    tags.push({});
                }
                tags[tagIndex].key = segment.value;
            } else if (segment.type === 'value') {
                if (tagOperator = tags[tagIndex].operator) {
                    segments[index - 1] = this.uiSegmentSrv.newOperator(tagOperator);
                    tags[tagIndex].operator = tagOperator;
                }
                tags[tagIndex].value = segment.value;
            } else if (segment.type === 'condition') {
                tags.push({condition: segment.value});
                tagIndex += 1;
            } else if (segment.type === 'operator') {
                tags[tagIndex].operator = segment.value;
            }
        });

        this.target.tags = tags;
        this.refresh();        
    }
}

NetSpyGlassQueryCtrl.templateUrl = 'partials/query.editor.html';
