'use strict';

System.register(['app/plugins/sdk', './dictionary', './services/utils'], function (_export, _context) {
    "use strict";

    var QueryCtrl, QueryPrompts, GrafanaVariables, utils, _createClass, orderBySortTypes, targetDefaults, NetSpyGlassQueryCtrl;

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_appPluginsSdk) {
            QueryCtrl = _appPluginsSdk.QueryCtrl;
        }, function (_dictionary) {
            QueryPrompts = _dictionary.QueryPrompts;
            GrafanaVariables = _dictionary.GrafanaVariables;
        }, function (_servicesUtils) {
            utils = _servicesUtils.default;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            orderBySortTypes = ['ASC', 'DESC'];
            targetDefaults = {
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
                    colValue: QueryPrompts.orderBy
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

            _export('NetSpyGlassQueryCtrl', NetSpyGlassQueryCtrl = function (_QueryCtrl) {
                _inherits(NetSpyGlassQueryCtrl, _QueryCtrl);

                /**
                 * @var {NetSpyGlassDatasource} datasource
                 * @property refresh
                 * @property panelCtrl
                 */

                function NetSpyGlassQueryCtrl($scope, $injector, $rootScope, uiSegmentSrv) {
                    _classCallCheck(this, NetSpyGlassQueryCtrl);

                    var _this = _possibleConstructorReturn(this, (NetSpyGlassQueryCtrl.__proto__ || Object.getPrototypeOf(NetSpyGlassQueryCtrl)).apply(this, arguments));

                    _this.$scope = $scope;
                    _this.$rootScope = $rootScope;
                    _this.$injector = $injector;
                    _this.prompts = QueryPrompts;
                    _this.uiSegmentSrv = uiSegmentSrv;

                    console.log($scope);

                    var optionsPluginParams = {
                        isMultiColumnMode: true,
                        categories: [],
                        segments: [],
                        removeSegment: uiSegmentSrv.newSegment({
                            fake: true,
                            value: _this.prompts.removeTag
                        }),
                        rawQueryString: ""
                    };

                    if (_this.options) {
                        _this.options = Object.assign(_this.options, optionsPluginParams);
                    } else {
                        _this.options = Object.assign({}, optionsPluginParams);
                    }

                    // this.setOptionsBasedOnPanelType(this.panel.type);

                    _this.pluginVersion = _this.datasource.meta.info.version;
                    return _this;
                }

                _createClass(NetSpyGlassQueryCtrl, [{
                    key: 'execute',
                    value: function execute() {
                        var _this2 = this;

                        this.scheduler.sheduleTask(function () {
                            _this2.errors = {};
                            _this2.panelCtrl.refresh();
                        });
                    }
                }, {
                    key: 'init',
                    value: function init() {
                        var _this3 = this;

                        this.initTarget();
                        this.options.segments = this.restoreTags();
                        this.getCategories().then(function () {
                            return _this3.loadColumns();
                        });

                        this.scheduler = utils.getScheduler();

                        this.panelCtrl.events.emitter.on("data-error", function (errors) {
                            _this3.errors = _.cloneDeep(errors);
                            _this3.scheduler.stop();
                        });

                        this.panelCtrl.events.emitter.on("render", function () {
                            _this3.scheduler.stop();
                        });

                        this.$scope.$watch(function () {
                            return _this3.panelCtrl;
                        }, function (newVal) {
                            console.log("panelCtrl", newVal);
                        });

                        // this.$scope.$watch("ctrl.panel.type", (newVal, oldVal) => {
                        //     console.log("ctrl.panel.type", newVal, this.panel);
                        //     // this.setOptionsBasedOnPanelType(newVal);
                        //     // this.setStoreBasedOnPanelType();
                        // });

                        this.$scope.$watch("ctrl.panel.options.sortBy", // {displayName: string, desc: boolean}[]
                        function (newVal, oldVal) {
                            if (newVal && newVal.filter(function (el) {
                                return el.displayName;
                            }).length) {
                                _this3.setOrderByFromPanelSort(newVal);
                                _this3.execute();
                            } else {
                                _this3.onClearOrderBy();
                            }
                        }, true);
                    }
                }, {
                    key: 'initTarget',
                    value: function initTarget() {
                        var defaults = _.merge({}, targetDefaults);

                        console.log("initTarget this.target", this.target);

                        this.target._nsgTarget = this.target._nsgTarget || {};
                        this.store = this.target._nsgTarget;
                        this.store.refId = this.target.refId || "A";

                        _.defaults(this.store, defaults);

                        this.store.isMultiColumnMode = this.options.isMultiColumnMode;
                        this.setStoreBasedOnPanelType();
                    }
                }, {
                    key: 'setStoreBasedOnPanelType',
                    value: function setStoreBasedOnPanelType() {
                        if (this.store.variable && this.store.variable !== QueryPrompts.variable) {
                            this.setPanelDefaults();

                            this.updateLegacyMetricColumn();
                        }

                        // if (this.options.isSinglestat) {
                        //     this.store.limit = 1;
                        // }
                    }
                }, {
                    key: 'isCategorySupportGraph',
                    value: function isCategorySupportGraph(value) {
                        return value !== "devices" && value !== "alerts";
                    }
                }, {
                    key: 'setPanelDefaults',
                    value: function setPanelDefaults() {
                        console.log("set panel defaults", this.store);

                        if (this.store.format === "time_series") {
                            if (!_.find(this.store.columns, { name: "time" })) {
                                this.store.columns.push({
                                    name: "time",
                                    visible: true
                                });
                            }
                            if (!_.find(this.store.columns, { name: "metric" })) {
                                this.store.columns.push({
                                    name: "metric",
                                    visible: true,
                                    appliedFunctions: [{ name: "tsavg" }]
                                });
                            }

                            var groupBy = this.store.groupBy;

                            if (!groupBy || groupBy.value === QueryPrompts.groupBy && groupBy.type === QueryPrompts.groupByType && !groupBy.touched) {
                                this.store.groupBy = {};
                                this.store.groupBy.type = "time";
                                this.store.groupBy.value = "$_interval";
                            }
                        }
                    }
                }, {
                    key: 'updateLegacyMetricColumn',
                    value: function updateLegacyMetricColumn() {
                        if (this.store.format === "time_series" && this.store.groupBy && this.store.groupBy.type === "time") {
                            var columnWithSimpleMetric = this.store.columns.find(function (column) {
                                return column.name === "metric" && !column.appliedFunctions.length;
                            });
                            if (columnWithSimpleMetric) {
                                columnWithSimpleMetric.appliedFunctions.push({
                                    name: "tsavg"
                                });
                            }
                        }
                    }
                }, {
                    key: 'setPanelSortFromOrderBy',
                    value: function setPanelSortFromOrderBy() {
                        if (!this.panel.options) this.panel.option = {};

                        this.panel.options.sortBy = [{
                            displayName: this.store.orderBy.column.name || null,
                            desc: this.store.orderBy.sort == orderBySortTypes[1]
                        }];
                    }
                }, {
                    key: 'setOrderByFromPanelSort',
                    value: function setOrderByFromPanelSort(sortBy) {
                        var _sortBy$ = sortBy[0],
                            displayName = _sortBy$.displayName,
                            desc = _sortBy$.desc;


                        // console.log(displayName, this.store.columns);

                        if (displayName !== null) {
                            var column = this.store.columns.find(function (el) {
                                return utils.compileColumnName(el) === displayName;
                            });
                            // console.log(column);
                            this.store.orderBy.column = {
                                name: utils.compileColumnName(column),
                                value: utils.compileColumnAlias(column),
                                alias: column.alias
                            };
                            this.store.orderBy.colName = this.store.orderBy.column.alias || this.store.orderBy.column.name;
                            this.store.orderBy.sort = desc ? orderBySortTypes[1] : orderBySortTypes[0];
                        } else {
                            this.onClearOrderBy();
                        }
                    }
                }, {
                    key: 'restoreTags',
                    value: function restoreTags() {
                        var uiSegmentSrv = this.uiSegmentSrv;
                        var segments = [];

                        if (this.store.tags.length) {
                            var _iteratorNormalCompletion = true;
                            var _didIteratorError = false;
                            var _iteratorError = undefined;

                            try {
                                for (var _iterator = this.store.tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                    var tag = _step.value;

                                    if (tag.condition) {
                                        segments.push(uiSegmentSrv.newCondition(tag.condition));
                                    }

                                    segments.push(uiSegmentSrv.newKey(tag.key));
                                    segments.push(uiSegmentSrv.newOperator(tag.operator));
                                    segments.push(uiSegmentSrv.newKeyValue(tag.value));

                                    if (tag.operator === "ISNULL" || tag.operator === "NOTNULL") {
                                        segments[segments.length - 1].cssClass = "query-segment-key query-segment-key--hidden";
                                    }
                                }
                            } catch (err) {
                                _didIteratorError = true;
                                _iteratorError = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion && _iterator.return) {
                                        _iterator.return();
                                    }
                                } finally {
                                    if (_didIteratorError) {
                                        throw _iteratorError;
                                    }
                                }
                            }
                        }

                        segments.push(uiSegmentSrv.newPlusButton());

                        return segments;
                    }
                }, {
                    key: 'getCategories',
                    value: function getCategories() {
                        var _this4 = this;

                        return this.datasource.getCategories().then(function (categories) {
                            var predefined = [{
                                text: "Tables",
                                submenu: [{ text: "devices", value: "devices" }, { text: "alerts", value: "alerts" }]
                            }, { text: "---------", separator: true }];

                            categories = [].concat(predefined, _toConsumableArray(categories));

                            _this4.options.categories = categories;

                            return categories;
                        });
                    }
                }, {
                    key: 'onSelectCategory',
                    value: function onSelectCategory($variable) {
                        this.store.variable = $variable;

                        this.setPanelDefaults($variable);
                        this.loadColumns();
                        this.execute();
                    }
                }, {
                    key: '_updateOrderBy',
                    value: function _updateOrderBy() {
                        if (this.store.orderBy.column.name === "column") {
                            this.store.orderBy.column.value = this.store.orderBy.colValue;
                        }

                        if (this.store.format === "table") {
                            this.setPanelSortFromOrderBy();
                        } else {
                            this.execute();
                        }
                    }
                }, {
                    key: 'onChangeOrderBy',
                    value: function onChangeOrderBy($value) {
                        console.log($value);
                        if (typeof $value === "string") {
                            this.store.orderBy.column = {
                                name: $value,
                                value: $value
                            };
                        } else {
                            this.store.orderBy.column = $value;
                        }

                        this.store.orderBy.colName = this.store.orderBy.column.alias || this.store.orderBy.column.name;
                        this._updateOrderBy();
                    }
                }, {
                    key: 'onChangeOrderByValue',
                    value: function onChangeOrderByValue($value) {
                        this.store.orderBy.colValue = $value;
                        this._updateOrderBy();
                    }
                }, {
                    key: 'onChangeOrderBySort',
                    value: function onChangeOrderBySort() {
                        this._updateOrderBy();
                    }
                }, {
                    key: 'onClearOrderBy',
                    value: function onClearOrderBy() {
                        this.store.orderBy.column = {};
                        this.store.orderBy.colName = this.prompts.orderBy;
                        this.store.orderBy.colValue = this.prompts.orderBy;
                        this._updateOrderBy();
                    }
                }, {
                    key: 'onChangeGroupByValue',
                    value: function onChangeGroupByValue($value) {
                        if ($value) {
                            this.store.groupBy.value = $value;
                        }

                        this.store.groupBy.touched = true;
                        this.execute();
                    }
                }, {
                    key: 'onClearGroupBy',
                    value: function onClearGroupBy() {
                        this.store.groupBy.type = QueryPrompts.groupByType;
                        this.store.groupBy.value = QueryPrompts.groupBy;
                        this.store.groupBy.touched = true;
                        this.execute();
                    }
                }, {
                    key: 'onColumnRemove',
                    value: function onColumnRemove($column) {
                        var index = this.store.columns.indexOf($column);

                        if (index !== -1) {
                            this.store.columns[index].willRemove = true;
                            this.store.columns.splice(index, 1);

                            if (this.store.orderBy.column.name === utils.compileColumnName($column)) {
                                this.onClearOrderBy();
                            }

                            this.execute();
                            return {
                                index: index
                            };
                        }

                        return false;
                    }
                }, {
                    key: 'onColumnChanged',
                    value: function onColumnChanged($column, $prevColumnState) {
                        if (this.isMultiColumnMode && this.store.orderBy.column.name === utils.compileColumnName($prevColumnState)) {
                            this.store.orderBy.column = {
                                name: utils.compileColumnName($column),
                                value: utils.compileColumnAlias($column),
                                alias: $column.alias
                            };

                            this.store.orderBy.colName = this.store.orderBy.column.alias || this.store.orderBy.column.name;
                        }

                        this.execute();
                    }
                }, {
                    key: 'onColumnAdd',
                    value: function onColumnAdd() {
                        this.store.columns.push({
                            visible: true,
                            name: this.prompts.column
                        });
                    }
                }, {
                    key: 'onDrop',
                    value: function onDrop($event, $data, column) {
                        $event.preventDefault();
                        $event.stopPropagation();

                        var dstIndex = this.store.columns.indexOf(column);
                        var srcIndex = $data;

                        if (srcIndex >= 0 && dstIndex >= 0 && srcIndex !== dstIndex) {
                            var srcColumn = angular.copy(this.store.columns[srcIndex]);
                            this.store.columns.splice(srcIndex, 1);
                            this.store.columns.splice(dstIndex, 0, srcColumn);
                            this.setPanelSortFromOrderBy();
                            this.execute();
                        }
                    }
                }, {
                    key: 'loadColumns',
                    value: function loadColumns() {
                        var _this5 = this;

                        if (this.store.variable && this.store.variable !== QueryPrompts.column && this.options.isMultiColumnMode) {
                            var found = -1;
                            _.each(this.options.categories, function (category) {
                                found = _.findIndex(category.submenu, {
                                    value: _this5.store.variable
                                });
                                if (~found) {
                                    return false;
                                }
                            });

                            if (~found) {
                                return this.datasource.getColumns(this.store.variable).then(function (columns) {
                                    _this5.options.columns = columns;
                                });
                            }
                        }

                        return false;
                    }
                }, {
                    key: 'toggleEditorMode',
                    value: function toggleEditorMode() {
                        var _this6 = this;

                        if (!this.store.rawQuery) {
                            var query = this.datasource.getSQLString(this.store);

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
                                onConfirm: function onConfirm() {
                                    _this6.store.rawQuery = 0;
                                }
                            });
                        } else {
                            this.store.rawQuery = 0;
                        }
                    }
                }, {
                    key: 'getTagsOrValues',
                    value: function getTagsOrValues(segment, index) {
                        var _this7 = this;

                        var $q = this.$injector.get("$q");
                        var uiSegmentSrv = this.uiSegmentSrv;
                        var segments = this.options.segments;
                        var promise = $q.resolve([]);

                        if (this.store.variable) {
                            switch (segment.type) {
                                case "key":
                                case "plus-button":
                                    promise = this.datasource.getFacets(this.store.variable).then(function (facets) {
                                        return ["component", "device"].concat(_toConsumableArray(facets)).filter(Boolean);
                                    });
                                    break;

                                case "value":
                                    promise = this.datasource.getSuggestions({
                                        type: segments[index - 2].value,
                                        variable: this.store.variable,
                                        // tags: this._filterPreviousWhereTags(index),
                                        scopedVars: this.panel.scopedVars
                                    });
                                    break;

                                case "condition":
                                    return $q.resolve([this.uiSegmentSrv.newCondition("AND"), this.uiSegmentSrv.newCondition("OR")]);
                                    break;

                                case "operator":
                                    return $q.resolve(this.uiSegmentSrv.newOperators(["=", "!=", "<>", "<", ">", "REGEXP", "NOT REGEXP", "ISNULL", "NOTNULL"]));
                                    break;
                            }
                        }

                        return promise.then(function (list) {
                            return list.map(function (item) {
                                return uiSegmentSrv.newSegment({
                                    value: '' + item
                                });
                            });
                        }).then(function (results) {
                            if (segment.type === "key") {
                                results.splice(0, 0, angular.copy(_this7.options.removeSegment));
                            }
                            return results;
                        });
                    }
                }, {
                    key: '_filterPreviousWhereTags',
                    value: function _filterPreviousWhereTags(currentIndex) {
                        return this.store.tags.filter(function (el, index) {
                            return index < currentIndex / 3 - 1;
                        });
                    }
                }, {
                    key: 'tagSegmentUpdated',
                    value: function tagSegmentUpdated(segment, index) {
                        var segmentSrv = this.uiSegmentSrv;
                        var segments = this.options.segments;
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
                                segments.push(segmentSrv.newFake(this.prompts.whereValue, "value", "query-segment-value"));
                                segment.type = "key";
                                segment.cssClass = "query-segment-key";
                            }

                            if (segment.type === "key" && segments[index + 2].type === "value") {
                                segments.splice(index + 2, 1, segmentSrv.newFake(this.prompts.whereValue, "value", "query-segment-value"));
                            }

                            if (segment.type === "operator") {
                                if (segment.value === "ISNULL" || segment.value === "NOTNULL") {
                                    segments[index + 1].cssClass = "query-segment-key query-segment-key--hidden";
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
                }, {
                    key: 'rebuildTargetTagConditions',
                    value: function rebuildTargetTagConditions() {
                        var _this8 = this;

                        var segments = this.options.segments;
                        var tags = [];
                        var tagIndex = 0;
                        var tagOperator = "";

                        segments.forEach(function (segment, index) {
                            switch (segment.type) {
                                case "key":
                                    if (tags.length === 0) {
                                        tags.push({});
                                    }
                                    tags[tagIndex].key = segment.value;
                                    break;
                                case "value":
                                    if (tagOperator = tags[tagIndex].operator) {
                                        segments[index - 1] = _this8.uiSegmentSrv.newOperator(tagOperator);
                                        tags[tagIndex].operator = tagOperator;
                                    }
                                    tags[tagIndex].value = segment.value;
                                    break;
                                case "condition":
                                    tags.push({
                                        condition: segment.value
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
                }, {
                    key: 'getOrderByOptions',
                    value: function getOrderByOptions() {
                        var list = [];

                        if (this.store.format === "table") {
                            this.store.columns.forEach(function (column) {
                                if (column.name == QueryPrompts.column) return;

                                list.push({
                                    text: column.alias || utils.compileColumnName(column),
                                    value: {
                                        name: utils.compileColumnName(column),
                                        value: utils.compileColumnAlias(column),
                                        alias: column.alias
                                    }
                                });
                            });
                        } else {
                            return this.datasource.getCombinedList(this.store.variable);
                        }

                        return this.$injector.get("$q").resolve(list);
                    }
                }, {
                    key: 'getOrderBySortOptions',
                    value: function getOrderBySortOptions() {
                        return this.$injector.get("$q").resolve([{
                            text: orderBySortTypes[0],
                            value: orderBySortTypes[0]
                        }, {
                            text: orderBySortTypes[1],
                            value: orderBySortTypes[1]
                        }]);
                    }
                }, {
                    key: 'getOrderByColumns',
                    value: function getOrderByColumns() {
                        return this.datasource.getCombinedList(this.store.variable);
                    }
                }, {
                    key: 'getLimitOptions',
                    value: function getLimitOptions() {
                        return this.$injector.get("$q").resolve([{
                            text: "None",
                            value: ""
                        }, {
                            text: "1",
                            value: 1
                        }, {
                            text: "5",
                            value: 5
                        }, {
                            text: "10",
                            value: 10
                        }, {
                            text: "50",
                            value: 50
                        }, {
                            text: "100",
                            value: 100
                        }]);
                    }
                }, {
                    key: 'getGroupByTypes',
                    value: function getGroupByTypes() {
                        return this.$injector.get("$q").resolve([{
                            text: "time",
                            value: "time"
                        }, {
                            text: "column",
                            value: "column"
                        }]);
                    }
                }, {
                    key: 'getGroupByVariables',
                    value: function getGroupByVariables() {
                        switch (this.store.groupBy.type) {
                            case "time":
                                return this.$injector.get("$q").resolve([{
                                    text: GrafanaVariables.interval,
                                    value: GrafanaVariables.interval
                                }, {
                                    text: "1s",
                                    value: "1s"
                                }, {
                                    text: "1m",
                                    value: "1m"
                                }, {
                                    text: "1h",
                                    value: "1h"
                                }, {
                                    text: "1d",
                                    value: "1d"
                                }]);
                                break;
                            case "column":
                                return this.datasource.getCombinedList(this.store.variable);
                                break;
                        }
                    }
                }, {
                    key: 'getCollapsedText',
                    value: function getCollapsedText() {
                        return "This target is collapsed. Click to the row for open it.";
                    }
                }, {
                    key: 'toggleColumnsView',
                    value: function toggleColumnsView() {
                        this.store.isSeparatedColumns = !this.store.isSeparatedColumns;
                    }
                }, {
                    key: 'getFormatOptions',
                    value: function getFormatOptions() {
                        return this.$injector.get("$q").resolve([{
                            text: "time series",
                            value: "time_series"
                        }, {
                            text: "table",
                            value: "table"
                        }]);
                    }
                }, {
                    key: 'onChangeFormat',
                    value: function onChangeFormat() {
                        this.setPanelDefaults();
                        this.execute();
                    }
                }]);

                return NetSpyGlassQueryCtrl;
            }(QueryCtrl));

            _export('NetSpyGlassQueryCtrl', NetSpyGlassQueryCtrl);

            NetSpyGlassQueryCtrl.templateUrl = 'partials/query.editor.html';
        }
    };
});
