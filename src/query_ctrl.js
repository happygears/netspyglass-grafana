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

import {
    QueryCtrl
} from 'app/plugins/sdk';
import {
    QueryPrompts,
    GrafanaVariables
} from './dictionary';
import utils from './services/utils';


/**
 * @typedef {{ type: string, cssClass: string }} ISegment
 */
const orderBySortTypes = ['ASC', 'DESC'];

const targetDefaults = {
    type: 'nsgql',
    columns: [],
    variable: QueryPrompts.variable,
    orderBy: {
        column: {
            name: '',
            value: '',
            alias: ''
        },
        sort: orderBySortTypes[0],
        colName: QueryPrompts.orderBy,
        colValue: QueryPrompts.orderBy,
    },
    rawQuery: 0,
    limit: 100,
    tags: [],
    groupBy: {
        type: QueryPrompts.groupByType,
        value: QueryPrompts.groupBy
    },
    isSeparatedColumns: false,
    disableAdHoc: false,
    format: 'time_series'
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

        var optionsPluginParams = {
            isMultiColumnMode: true,
            categories: [],
            segments: [],
            removeSegment: uiSegmentSrv.newSegment({
                fake: true,
                value: this.prompts.removeTag,
            }),
            rawQueryString: "",
        };

        if (this.options) {
            this.options = Object.assign(this.options, optionsPluginParams);
        } else {
            this.options = Object.assign({}, optionsPluginParams);
        }

        // this.setOptionsBasedOnPanelType(this.panel.type);

        this.pluginVersion = this.datasource.meta.info.version;
    }

    execute() {
        this.scheduler.sheduleTask(() => {
            this.errors = {};
            this.panelCtrl.refresh();
        });
    }

    init() {
        this.initTarget();
        this.options.segments = this.restoreTags();
        this.getCategories().then(() => this.loadColumns());

        this.scheduler = utils.getScheduler();

        this.panelCtrl.events.emitter.on("data-error", (errors) => {
            this.errors = _.cloneDeep(errors);
            this.scheduler.stop();
        });

        this.panelCtrl.events.emitter.on("render", () => {
            this.scheduler.stop();
        });

        // this.$scope.$watch(
        //     () => this.panelCtrl,
        //     (newVal) => {
        //         console.log("panelCtrl", newVal);
        //     }
        // );

        // this.$scope.$watch("ctrl.panel.type", (newVal, oldVal) => {
        //     console.log("ctrl.panel.type", newVal, this.panel);
        //     // this.setOptionsBasedOnPanelType(newVal);
        //     // this.setStoreBasedOnPanelType();
        // });

        // this.$scope.$watch(
        //     "ctrl.panel.options.sortBy", // {displayName: string, desc: boolean}[]
        //     (newVal, oldVal) => {
        //         console.log(newVal);
        //         if (newVal && newVal.filter((el) => el.displayName).length) {
        //             this.setOrderByFromPanelSort(newVal);
        //             this.execute();
        //         } else {
        //             this.onClearOrderBy();
        //         }
        //     },
        //     true
        // );
    }

    // setOptionsBasedOnPanelType(type) {
    //     this.options.isGraph = type === "graph";
    //     this.options.isTable = type === "table";
    //     this.options.isSinglestat = type === "singlestat";
    //     this.options.isHeatmap = type === "heatmap";

    //     // fallback
    //     if (!type) {
    //         this.options.isGraph = true;
    //     }
    // }

    initTarget() {
        let defaults = _.merge({}, targetDefaults);

        // console.log("initTarget this.target", this.target);

        this.target._nsgTarget = this.target._nsgTarget || {};
        this.store = this.target._nsgTarget;
        this.store.refId = this.target.refId || "A";

        _.defaults(this.store, defaults);

        this.store.isMultiColumnMode = this.options.isMultiColumnMode;
        this.setStoreBasedOnPanelType();
    }

    setStoreBasedOnPanelType() {
        if (
            this.store.variable &&
            this.store.variable !== QueryPrompts.variable
        ) {
            this.setPanelDefaults();

            this.updateLegacyMetricColumn();
        }

        // if (this.options.isSinglestat) {
        //     this.store.limit = 1;
        // }
    }

    // setPanelDefaults(category) {
    //     this.setPanelDefaults();
    // }

    isCategorySupportGraph(value) {
        return value !== "devices" && value !== "alerts";
    }

    setPanelDefaults() {
        if (this.store.format === "time_series") {
            if (!_.find(this.store.columns, { name: "time" })) {
                this.store.columns.push({
                    name: "time",
                    visible: true,
                });
            }
            if (!_.find(this.store.columns, { name: "metric" })) {
                this.store.columns.push({
                    name: "metric",
                    visible: true,
                    appliedFunctions: [{ name: "tsavg" }],
                });
            }

            const groupBy = this.store.groupBy;

            if (
                !groupBy ||
                (groupBy.value === QueryPrompts.groupBy &&
                    groupBy.type === QueryPrompts.groupByType &&
                    !groupBy.touched)
            ) {
                this.store.groupBy = {};
                this.store.groupBy.type = "time";
                this.store.groupBy.value = "$_interval";
            }
        }
    }

    // if query has groupBy time, metric value should have ts function applyed
    updateLegacyMetricColumn() {
        if (
            this.store.format === "time_series" &&
            this.store.groupBy &&
            this.store.groupBy.type === "time"
        ) {
            const columnWithSimpleMetric = this.store.columns.find(
                (column) => column.name === "metric" && !column.appliedFunctions.length
            );
            if (columnWithSimpleMetric) {
                columnWithSimpleMetric.appliedFunctions.push({
                    name: "tsavg",
                });
            }
        }
    }

    setPanelSortFromOrderBy() {
        if (!this.panel.options) this.panel.option = {};

        this.panel.options.sortBy = [
            {
                displayName: this.store.orderBy.column.name || null,
                desc: this.store.orderBy.sort == orderBySortTypes[1],
            },
        ];
    }

    setOrderByFromPanelSort(sortBy) {
        const { displayName, desc } = sortBy[0];

        if (displayName !== null) {
            const column = this.store.columns.find(
                (el) => {
                    return utils.compileColumnName(el) === displayName;
                }
            );
            this.store.orderBy.column = {
                name: utils.compileColumnName(column),
                value: utils.compileColumnAlias(column),
                alias: column.alias,
            };
            this.store.orderBy.colName =
                this.store.orderBy.column.alias ||
                this.store.orderBy.column.name;
            this.store.orderBy.sort = desc
                ? orderBySortTypes[1]
                : orderBySortTypes[0];
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

                if (tag.operator === "ISNULL" || tag.operator === "NOTNULL") {
                    segments[segments.length - 1].cssClass =
                        "query-segment-key query-segment-key--hidden";
                }
            }
        }

        segments.push(uiSegmentSrv.newPlusButton());

        return segments;
    }

    getCategories() {
        return this.datasource.getCategories().then((categories) => {
            const predefined = [
                {
                    text: "Tables",
                    submenu: [
                        { text: "devices", value: "devices" },
                        { text: "alerts", value: "alerts" },
                    ],
                },
                { text: "---------", separator: true },
            ];

            categories = [...predefined, ...categories];

            this.options.categories = categories;

            return categories;
        });
    }

    /**
     * @param {string} $variable
     */
    onSelectCategory($variable) {
        this.store.variable = $variable;

        this.setPanelDefaults($variable);
        this.loadColumns();
        this.execute();
    }

    _updateOrderBy() {
        if (this.store.orderBy.column.name === "column") {
            this.store.orderBy.column.value = this.store.orderBy.colValue;
        }

        if (this.store.format === "table") {
            this.setPanelSortFromOrderBy();
        } else {
            this.execute();
        }
    }

    onChangeOrderBy($value) {
        if (typeof $value === "string") {
            this.store.orderBy.column = {
                name: $value,
                value: $value,
            };
        } else {
            this.store.orderBy.column = $value;
        }

        this.store.orderBy.colName =
            this.store.orderBy.column.alias || this.store.orderBy.column.name;
        this._updateOrderBy();
    }

    onChangeOrderByValue($value) {
        this.store.orderBy.colValue = $value;
        this._updateOrderBy();
    }

    onChangeOrderBySort() {
        this._updateOrderBy();
    }

    onClearOrderBy() {
        this.store.orderBy.column = {};
        this.store.orderBy.colName = this.prompts.orderBy;
        this.store.orderBy.colValue = this.prompts.orderBy;
        this._updateOrderBy();
    }

    onChangeGroupByValue($value) {
        if ($value) {
            this.store.groupBy.value = $value;
        }

        this.store.groupBy.touched = true;
        this.execute();
    }

    onClearGroupBy() {
        this.store.groupBy.type = QueryPrompts.groupByType;
        this.store.groupBy.value = QueryPrompts.groupBy;
        this.store.groupBy.touched = true;
        this.execute();
    }

    onColumnRemove($column) {
        const index = this.store.columns.indexOf($column);

        if (index !== -1) {
            this.store.columns[index].willRemove = true;
            this.store.columns.splice(index, 1);

            if (
                this.store.orderBy.column.name ===
                utils.compileColumnName($column)
            ) {
                this.onClearOrderBy();
            }

            this.execute();
            return {
                index,
            };
        }

        return false;
    }

    onColumnChanged($column, $prevColumnState) {
        if (
            this.isMultiColumnMode &&
            this.store.orderBy.column.name ===
                utils.compileColumnName($prevColumnState)
        ) {
            this.store.orderBy.column = {
                name: utils.compileColumnName($column),
                value: utils.compileColumnAlias($column),
                alias: $column.alias,
            };

            this.store.orderBy.colName =
                this.store.orderBy.column.alias ||
                this.store.orderBy.column.name;
        }

        this.execute();
    }

    onColumnAdd() {
        this.store.columns.push({
            visible: true,
            name: this.prompts.column,
        });
    }

    onDrop($event, $data, column) {
        $event.preventDefault();
        $event.stopPropagation();

        let dstIndex = this.store.columns.indexOf(column);
        let srcIndex = $data;

        if (srcIndex >= 0 && dstIndex >= 0 && srcIndex !== dstIndex) {
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
        if (
            this.store.variable &&
            this.store.variable !== QueryPrompts.column &&
            this.options.isMultiColumnMode
        ) {
            let found = -1;
            _.each(this.options.categories, (category) => {
                found = _.findIndex(category.submenu, {
                    value: this.store.variable,
                });
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

        if (this.options.rawQueryString != this.store.nsgqlString) {
            this.$rootScope.appEvent("confirm-modal", {
                title: "Confirm",
                text: "Are your sure? Your changes will be lost.",
                yesText: "Yes",
                icon: "fa-trash",
                onConfirm: () => {
                    this.store.rawQuery = 0;
                },
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
        const $q = this.$injector.get("$q");
        const uiSegmentSrv = this.uiSegmentSrv;
        const segments = this.options.segments;
        let promise = $q.resolve([]);

        if (this.store.variable) {
            switch (segment.type) {
                case "key":
                case "plus-button":
                    promise = this.datasource
                        .getFacets(this.store.variable)
                        .then((facets) => {
                            return [
                                ...["component", "device"],
                                ...facets,
                            ].filter(Boolean);
                        });
                    break;

                case "value":
                    promise = this.datasource.getSuggestions({
                        type: segments[index - 2].value,
                        variable: this.store.variable,
                        // tags: this._filterPreviousWhereTags(index),
                        scopedVars: this.panel.scopedVars,
                    });
                    break;

                case "condition":
                    return $q.resolve([
                        this.uiSegmentSrv.newCondition("AND"),
                        this.uiSegmentSrv.newCondition("OR"),
                    ]);
                    break;

                case "operator":
                    return $q.resolve(
                        this.uiSegmentSrv.newOperators([
                            "=",
                            "!=",
                            "<>",
                            "<",
                            ">",
                            "REGEXP",
                            "NOT REGEXP",
                            "ISNULL",
                            "NOTNULL",
                        ])
                    );
                    break;
            }
        }

        return promise
            .then((list) =>
                list.map((item) =>
                    uiSegmentSrv.newSegment({
                        value: `${item}`,
                    })
                )
            )
            .then((results) => {
                if (segment.type === "key") {
                    results.splice(
                        0,
                        0,
                        angular.copy(this.options.removeSegment)
                    );
                }
                return results;
            });
    }

    /**
     * @param {Number} currentIndex - index of current Segment
     * @returns {Array} - returns array of tag objects that placed before current tag triplet
     */
    _filterPreviousWhereTags(currentIndex) {
        return this.store.tags.filter(
            (el, index) => index < currentIndex / 3 - 1
        );
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
                if (segments[segments.length - 1].type !== "plus-button") {
                    segments.push(segmentSrv.newPlusButton());
                }
            }
        } else {
            if (segment.type === "plus-button") {
                if (index > 2) {
                    segments.splice(index, 0, segmentSrv.newCondition("AND"));
                }

                segments.push(segmentSrv.newOperator("="));
                segments.push(
                    segmentSrv.newFake(
                        this.prompts.whereValue,
                        "value",
                        "query-segment-value"
                    )
                );
                segment.type = "key";
                segment.cssClass = "query-segment-key";
            }

            if (
                segment.type === "key" &&
                segments[index + 2].type === "value"
            ) {
                segments.splice(
                    index + 2,
                    1,
                    segmentSrv.newFake(
                        this.prompts.whereValue,
                        "value",
                        "query-segment-value"
                    )
                );
            }

            if (segment.type === "operator") {
                if (segment.value === "ISNULL" || segment.value === "NOTNULL") {
                    segments[index + 1].cssClass =
                        "query-segment-key query-segment-key--hidden";
                    segments.push(segmentSrv.newPlusButton());
                } else {
                    segments[index + 1].cssClass = "query-segment-key";
                }
            }

            if (index + 1 === segments.length) {
                segments.push(segmentSrv.newPlusButton());
            }
        }

        this.rebuildTargetTagConditions();
    }

    rebuildTargetTagConditions() {
        const segments = this.options.segments;
        const tags = [];
        let tagIndex = 0;
        let tagOperator = "";

        segments.forEach((segment, index) => {
            switch (segment.type) {
                case "key":
                    if (tags.length === 0) {
                        tags.push({});
                    }
                    tags[tagIndex].key = segment.value;
                    break;
                case "value":
                    if ((tagOperator = tags[tagIndex].operator)) {
                        segments[index - 1] =
                            this.uiSegmentSrv.newOperator(tagOperator);
                        tags[tagIndex].operator = tagOperator;
                    }
                    tags[tagIndex].value = segment.value;
                    break;
                case "condition":
                    tags.push({
                        condition: segment.value,
                    });
                    tagIndex += 1;
                    break;
                case "operator":
                    tags[tagIndex].operator = segment.value;
                    break;
            }
        });

        this.store.tags = tags;
        this.execute();
    }

    getOrderByOptions() {
        let list = [];

        if (this.store.format === "table") {
            this.store.columns.forEach((column) => {
                if (column.name == QueryPrompts.column) return;

                list.push({
                    text: column.alias || utils.compileColumnName(column),
                    value: {
                        name: utils.compileColumnName(column),
                        value: utils.compileColumnAlias(column),
                        alias: column.alias,
                    },
                });
            });
        } else {
            return this.datasource.getCombinedList(this.store.variable);
        }

        return this.$injector.get("$q").resolve(list);
    }

    getOrderBySortOptions() {
        return this.$injector.get("$q").resolve([
            {
                text: orderBySortTypes[0],
                value: orderBySortTypes[0],
            },
            {
                text: orderBySortTypes[1],
                value: orderBySortTypes[1],
            },
        ]);
    }

    getOrderByColumns() {
        return this.datasource.getCombinedList(this.store.variable);
    }

    getLimitOptions() {
        return this.$injector.get("$q").resolve([
            {
                text: "None",
                value: "",
            },
            {
                text: "1",
                value: 1,
            },
            {
                text: "5",
                value: 5,
            },
            {
                text: "10",
                value: 10,
            },
            {
                text: "50",
                value: 50,
            },
            {
                text: "100",
                value: 100,
            },
        ]);
    }

    getGroupByTypes() {
        return this.$injector.get("$q").resolve([
            {
                text: "time",
                value: "time",
            },
            {
                text: "column",
                value: "column",
            },
        ]);
    }

    getGroupByVariables() {
        switch (this.store.groupBy.type) {
            case "time":
                return this.$injector.get("$q").resolve([
                    {
                        text: GrafanaVariables.interval,
                        value: GrafanaVariables.interval,
                    },
                    {
                        text: "1s",
                        value: "1s",
                    },
                    {
                        text: "1m",
                        value: "1m",
                    },
                    {
                        text: "1h",
                        value: "1h",
                    },
                    {
                        text: "1d",
                        value: "1d",
                    },
                ]);
                break;
            case "column":
                return this.datasource.getCombinedList(this.store.variable);
                break;
        }
    }

    getCollapsedText() {
        return "This target is collapsed. Click to the row for open it.";
    }

    toggleColumnsView() {
        this.store.isSeparatedColumns = !this.store.isSeparatedColumns;
    }

    getFormatOptions() {
        return this.$injector.get("$q").resolve([
            {
                text: "time series",
                value: "time_series",
            },
            {
                text: "table",
                value: "table",
            },
        ]);
    }

    onChangeFormat() {
        this.setPanelDefaults();
        this.execute();
    }
}

NetSpyGlassQueryCtrl.templateUrl = 'partials/query.editor.html';
