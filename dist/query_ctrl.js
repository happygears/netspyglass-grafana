'use strict';

System.register(['app/plugins/sdk', './dictionary', './services/utils'], function (_export, _context) {
    "use strict";

    var QueryCtrl, QueryPrompts, GrafanaVariables, utils, _createClass, orderBySortTypes, targetDefaults, NetSpyGlassQueryCtrl;

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
                columns: [{ name: 'metric', visible: true }],
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

                    _this.options = {
                        isGraph: _this.panel.type === 'graph',
                        isTable: _this.panel.type === 'table',
                        isSinglestat: _this.panel.type === 'singlestat',
                        categories: [],
                        segments: [],
                        removeSegment: uiSegmentSrv.newSegment({ fake: true, value: _this.prompts.removeTag }),
                        rawQueryString: ''
                    };

                    _this.pluginVersion = _this.datasource.meta.info.version;
                    return _this;
                }

                _createClass(NetSpyGlassQueryCtrl, [{
                    key: 'execute',
                    value: function execute() {
                        this.errors = {};
                        this.store.loading = true;
                        this.panelCtrl.refresh();
                    }
                }, {
                    key: 'init',
                    value: function init() {
                        var _this2 = this;

                        this.initTarget();
                        this.options.segments = this.restoreTags();
                        this.getCategories().then(function () {
                            return _this2.loadColumns();
                        });

                        this.panelCtrl.events.emitter.on('data-error', function (errors) {
                            _this2.errors = _.cloneDeep(errors);
                        });

                        this.panelCtrl.events.emitter.on('render', function () {
                            _this2.store.loading = false;
                        });

                        if (this.options.isTable) {
                            this.setPanelSortFromOrderBy();
                            this.$scope.$watch('ctrl.panel.sort', function (newVal, oldVal) {
                                if (newVal.col !== oldVal.col || newVal.desc !== oldVal.desc) {
                                    _this2.setOrderByFromPanelSort(newVal);
                                    _this2.execute();
                                }
                            }, true);
                        }
                    }
                }, {
                    key: 'initTarget',
                    value: function initTarget() {
                        this.target._nsgTarget = this.target._nsgTarget || {};
                        this.store = this.target._nsgTarget;
                        this.store.refId = this.target.refId;

                        _.defaultsDeep(this.store, targetDefaults);

                        this.store.format = this.options.isGraph || this.options.isSinglestat ? 'time_series' : 'table';
                        this.store.isTablePanel = this.options.isTable;

                        if (this.options.isGraph || this.options.isSinglestat) {
                            if (!_.find(this.store.columns, { name: 'time' })) {
                                this.store.columns.push({ name: 'time', visible: false });
                            }
                        }

                        if (this.options.isSinglestat) {
                            this.store.limit = 1;
                        }
                    }
                }, {
                    key: 'setPanelSortFromOrderBy',
                    value: function setPanelSortFromOrderBy() {
                        var _this3 = this;

                        var index = _.findIndex(this.store.columns, function (column) {
                            return utils.compileColumnName(column) === _this3.store.orderBy.column.name;
                        });

                        this.panel.sort.col = index > -1 ? index : null;
                        this.panel.sort.desc = this.store.orderBy.sort == orderBySortTypes[1];
                    }
                }, {
                    key: 'setOrderByFromPanelSort',
                    value: function setOrderByFromPanelSort(value) {
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
                            _this4.options.categories = categories;
                            return categories;
                        });
                    }
                }, {
                    key: 'onSelectCategory',
                    value: function onSelectCategory($variable) {
                        this.store.variable = $variable;
                        this.loadColumns();
                        this.execute();
                    }
                }, {
                    key: '_updateOrderBy',
                    value: function _updateOrderBy() {
                        if (this.options.isGraph) {
                            this.execute();
                        } else {
                            this.setPanelSortFromOrderBy();
                        }
                    }
                }, {
                    key: 'onChangeOrderBy',
                    value: function onChangeOrderBy($value) {
                        this.store.orderBy.column = $value;
                        this.store.orderBy.colName = this.store.orderBy.column.alias || this.store.orderBy.column.name;

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
                        this._updateOrderBy();
                    }
                }, {
                    key: 'onClearGroupBy',
                    value: function onClearGroupBy() {
                        this.store.groupBy.type = QueryPrompts.groupByType;
                        this.store.groupBy.value = QueryPrompts.groupBy;
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
                            return { index: index };
                        }

                        return false;
                    }
                }, {
                    key: 'onColumnChanged',
                    value: function onColumnChanged($column, $prevColumnState) {
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

                        if (this.store.variable && this.store.variable !== QueryPrompts.column && this.options.isTable) {
                            var found = -1;
                            _.each(this.options.categories, function (category) {
                                found = _.findIndex(category.submenu, { value: _this5.store.variable });
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
                            this.$rootScope.appEvent('confirm-modal', {
                                title: 'Confirm',
                                text: 'Are your sure? Your changes will be lost.',
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

                        var $q = this.$injector.get('$q');
                        var uiSegmentSrv = this.uiSegmentSrv;
                        var segments = this.options.segments;
                        var promise = $q.resolve([]);

                        if (this.store.variable) {
                            switch (segment.type) {
                                case 'key':
                                case 'plus-button':
                                    promise = this.datasource.getFacets(this.store.variable).then(function (facets) {
                                        return ['component', 'device'].concat(facets);
                                    });
                                    break;

                                case 'value':
                                    promise = this.datasource.getSuggestions({
                                        type: segments[index - 2].value,
                                        variable: this.store.variable,
                                        tags: this._filterPreviousWhereTags(index)
                                    });
                                    break;

                                case 'condition':
                                    return $q.resolve([this.uiSegmentSrv.newCondition('AND'), this.uiSegmentSrv.newCondition('OR')]);
                                    break;

                                case 'operator':
                                    return $q.resolve(this.uiSegmentSrv.newOperators(['=', '!=', '<>', '<', '>', 'REGEXP', 'NOT REGEXP']));
                                    break;
                            }
                        }

                        return promise.then(function (list) {
                            return list.map(function (item) {
                                return uiSegmentSrv.newSegment({ value: '' + item });
                            });
                        }).then(function (results) {
                            if (segment.type === 'key') {
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

                            if (segment.type === 'key' && segments[index + 2].type === 'value') {
                                segments.splice(index + 2, 1, segmentSrv.newFake(this.prompts.whereValue, 'value', 'query-segment-value'));
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
                        var tagOperator = '';

                        segments.forEach(function (segment, index) {
                            switch (segment.type) {
                                case 'key':
                                    if (tags.length === 0) {
                                        tags.push({});
                                    }
                                    tags[tagIndex].key = segment.value;
                                    break;
                                case 'value':
                                    if (tagOperator = tags[tagIndex].operator) {
                                        segments[index - 1] = _this8.uiSegmentSrv.newOperator(tagOperator);
                                        tags[tagIndex].operator = tagOperator;
                                    }
                                    tags[tagIndex].value = segment.value;
                                    break;
                                case 'condition':
                                    tags.push({ condition: segment.value });
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
                }, {
                    key: 'getOrderByOptions',
                    value: function getOrderByOptions() {
                        var list = [];

                        if (this.options.isGraph) {
                            list.push({ text: 'metric', value: 'metric' });
                        } else if (this.options.isTable) {
                            this.store.columns.forEach(function (column) {
                                list.push({
                                    text: column.alias || utils.compileColumnName(column),
                                    value: {
                                        name: utils.compileColumnName(column),
                                        value: utils.compileColumnAlias(column),
                                        alias: column.alias
                                    }
                                });
                            });
                        }

                        return this.$injector.get('$q').resolve(list);
                    }
                }, {
                    key: 'getOrderBySortOptions',
                    value: function getOrderBySortOptions() {
                        return this.$injector.get('$q').resolve([{ text: orderBySortTypes[0], value: orderBySortTypes[0] }, { text: orderBySortTypes[1], value: orderBySortTypes[1] }]);
                    }
                }, {
                    key: 'getLimitOptions',
                    value: function getLimitOptions() {
                        return this.$injector.get('$q').resolve([{ text: 'None', 'value': '' }, { text: '1', 'value': 1 }, { text: '5', 'value': 5 }, { text: '10', 'value': 10 }, { text: '50', 'value': 50 }, { text: '100', 'value': 100 }]);
                    }
                }, {
                    key: 'getGroupByTypes',
                    value: function getGroupByTypes() {
                        return this.$injector.get('$q').resolve([{ text: 'time', value: 'time' }, { text: 'column', value: 'column' }]);
                    }
                }, {
                    key: 'getGroupByVariables',
                    value: function getGroupByVariables() {
                        switch (this.store.groupBy.type) {
                            case 'time':
                                return this.$injector.get('$q').resolve([{ text: GrafanaVariables.interval, value: GrafanaVariables.interval }, { text: '1s', value: '1s' }, { text: '1m', value: '1m' }, { text: '1h', value: '1h' }, { text: '1d', value: '1d' }]);
                                break;
                            case 'column':
                                var list = [{ text: 'device', value: 'device' }];
                                return this.datasource.getFacets(this.store.variable).then(function (data) {
                                    data.forEach(function (el) {
                                        list.push({ text: el, value: el });
                                    });

                                    return list;
                                });
                                break;
                        }
                    }
                }, {
                    key: 'getCollapsedText',
                    value: function getCollapsedText() {
                        return 'This target is collapsed. Click to the row for open it.';
                    }
                }]);

                return NetSpyGlassQueryCtrl;
            }(QueryCtrl));

            _export('NetSpyGlassQueryCtrl', NetSpyGlassQueryCtrl);

            NetSpyGlassQueryCtrl.templateUrl = 'partials/query.editor.html';
        }
    };
});
