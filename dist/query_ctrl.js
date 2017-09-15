'use strict';

System.register(['app/plugins/sdk', './dictionary'], function (_export, _context) {
    "use strict";

    var QueryCtrl, QueryPrompts, GrafanaVariables, _createClass, orderBySortTypes, targetDefaults, NetSpyGlassQueryCtrl;

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
                columns: [{ name: 'metric', visible: true }],
                category: QueryPrompts.category,
                variable: QueryPrompts.variable,
                orderBy: {
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

            _export('NetSpyGlassQueryCtrl', NetSpyGlassQueryCtrl = function (_QueryCtrl) {
                _inherits(NetSpyGlassQueryCtrl, _QueryCtrl);

                /**
                 * @var {NetSpyGlassDatasource} datasource
                 * @property refresh
                 * @property panelCtrl
                 */

                function NetSpyGlassQueryCtrl($scope, $injector, uiSegmentSrv) {
                    _classCallCheck(this, NetSpyGlassQueryCtrl);

                    var _this = _possibleConstructorReturn(this, (NetSpyGlassQueryCtrl.__proto__ || Object.getPrototypeOf(NetSpyGlassQueryCtrl)).apply(this, arguments));

                    _this.$scope = $scope;
                    _this.$injector = $injector;
                    _this.prompts = QueryPrompts;
                    _this.uiSegmentSrv = uiSegmentSrv;
                    _this.options = {
                        isGraph: _this.panel.type === 'graph',
                        isTable: _this.panel.type === 'table',
                        categories: [],
                        segments: [],
                        removeSegment: uiSegmentSrv.newSegment({ fake: true, value: _this.prompts.removeTag })
                    };
                    return _this;
                }

                _createClass(NetSpyGlassQueryCtrl, [{
                    key: 'execute',
                    value: function execute() {
                        this.errors = {};
                        this.panelCtrl.refresh();
                    }
                }, {
                    key: 'init',
                    value: function init() {
                        var _this2 = this;

                        this.initTarget();
                        this.options.segments = this.restoreTags();
                        this.getCategories();
                        this.loadColumns();

                        this.panelCtrl.events.emitter.on('data-error', function (errors) {
                            _this2.errors = _.cloneDeep(errors);
                        });

                        if (!this.options.isGraph) {
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
                        _.defaultsDeep(this.target, targetDefaults, { format: this.options.isGraph ? 'time_series' : 'table' });

                        if (this.options.isGraph) {
                            if (!_.find(this.target.columns, { name: 'time' })) {
                                this.target.columns.push({ name: 'time', visible: false });
                            }
                        }
                    }
                }, {
                    key: 'setPanelSortFromOrderBy',
                    value: function setPanelSortFromOrderBy() {
                        var _this3 = this;

                        var index = _.findIndex(this.target.columns, function (column) {
                            return column.name === _this3.target.orderBy.column || column.alias === _this3.target.orderBy.column;
                        });

                        this.panel.sort.col = index > -1 ? index : null;
                        this.panel.sort.desc = this.target.orderBy.sort == orderBySortTypes[1];
                    }
                }, {
                    key: 'setOrderByFromPanelSort',
                    value: function setOrderByFromPanelSort(value) {
                        if (value.col !== null) {
                            this.target.orderBy.column = this.target.columns[value.col].alias || this.target.columns[value.col].name;
                            this.target.orderBy.sort = value.desc ? orderBySortTypes[1] : orderBySortTypes[0];
                        } else {
                            this.onClearOrderBy();
                        }
                    }
                }, {
                    key: 'restoreTags',
                    value: function restoreTags() {
                        var uiSegmentSrv = this.uiSegmentSrv;
                        var segments = [];

                        if (this.target.tags.length) {
                            var _iteratorNormalCompletion = true;
                            var _didIteratorError = false;
                            var _iteratorError = undefined;

                            try {
                                for (var _iterator = this.target.tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
                        return this.datasource.getCategories();
                    }
                }, {
                    key: 'onSelectCategory',
                    value: function onSelectCategory($variable) {
                        this.target.variable = $variable;
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
                    value: function onChangeOrderBy() {
                        this._updateOrderBy();
                    }
                }, {
                    key: 'onClearOrderBy',
                    value: function onClearOrderBy() {
                        this.target.orderBy.column = this.prompts.orderBy;
                        this._updateOrderBy();
                    }
                }, {
                    key: 'onClearGroupBy',
                    value: function onClearGroupBy() {
                        this.target.groupBy.type = QueryPrompts.groupByType;
                        this.target.groupBy.value = QueryPrompts.groupBy;
                        this.execute();
                    }
                }, {
                    key: 'onColumnRemove',
                    value: function onColumnRemove($column) {
                        var index = this.target.columns.indexOf($column);

                        if (index !== -1) {
                            this.target.columns[index].willRemove = true;
                            this.target.columns.splice(index, 1);
                            this.execute();
                            return { index: index };
                        }

                        return false;
                    }
                }, {
                    key: 'onColumnChanged',
                    value: function onColumnChanged($column) {
                        this.execute();
                    }
                }, {
                    key: 'onColumnAdd',
                    value: function onColumnAdd() {
                        this.target.columns.push({
                            visible: true,
                            name: this.prompts.column
                        });
                    }
                }, {
                    key: 'loadColumns',
                    value: function loadColumns() {
                        var _this4 = this;

                        if (this.target.variable) {
                            return this.datasource.getColumns(this.target.variable).then(function (columns) {
                                return _this4.options.columns = columns;
                            });
                        }

                        return false;
                    }
                }, {
                    key: 'toggleEditorMode',
                    value: function toggleEditorMode() {
                        this.target.rawQuery ^= 1;

                        if (this.target.rawQuery) {
                            this.target.nsgqlString = this.datasource.getSQLString(this.target);
                        }
                    }
                }, {
                    key: 'getTagsOrValues',
                    value: function getTagsOrValues(segment, index) {
                        var _this5 = this;

                        var $q = this.$injector.get('$q');
                        var uiSegmentSrv = this.uiSegmentSrv;
                        var segments = this.options.segments;
                        var promise = $q.resolve([]);

                        if (this.target.variable) {
                            switch (segment.type) {
                                case 'key':
                                case 'plus-button':
                                    promise = this.datasource.getFacets(this.target.variable).then(function (facets) {
                                        return ['component', 'device'].concat(facets);
                                    });
                                    break;

                                case 'value':

                                    promise = this.datasource.getSuggestions({
                                        type: segments[index - 2].value,
                                        variable: this.target.variable,
                                        tags: this.target.tags
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
                                results.splice(0, 0, angular.copy(_this5.options.removeSegment));
                            }
                            return results;
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

                            if (index + 1 === segments.length) {
                                segments.push(segmentSrv.newPlusButton());
                            }
                        }

                        this.rebuildTargetTagConditions();
                    }
                }, {
                    key: 'rebuildTargetTagConditions',
                    value: function rebuildTargetTagConditions() {
                        var _this6 = this;

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
                                        segments[index - 1] = _this6.uiSegmentSrv.newOperator(tagOperator);
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

                        this.target.tags = tags;
                        this.execute();
                    }
                }, {
                    key: 'getOrderByOptions',
                    value: function getOrderByOptions() {
                        var list = [];

                        if (this.options.isGraph) {
                            list.push({ text: 'metric', value: 'metric' });
                        } else if (this.options.isTable) {
                            this.target.columns.forEach(function (el) {
                                if (el.appliedFunctions.length && !el.alias) return;

                                var val = el.alias || el.name;
                                list.push({ text: val, value: val });
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
                        switch (this.target.groupBy.type) {
                            case 'time':
                                return this.$injector.get('$q').resolve([{ text: GrafanaVariables.interval, value: GrafanaVariables.interval }, { text: '1s', value: '1s' }, { text: '1m', value: '1m' }, { text: '1h', value: '1h' }, { text: '1d', value: '1d' }]);
                                break;
                            case 'column':
                                return this.datasource.getFacets(this.target.variable).then(function (data) {
                                    return data.map(function (el) {
                                        return { text: el, value: el };
                                    });
                                });
                                break;
                        }
                    }
                }]);

                return NetSpyGlassQueryCtrl;
            }(QueryCtrl));

            _export('NetSpyGlassQueryCtrl', NetSpyGlassQueryCtrl);

            NetSpyGlassQueryCtrl.templateUrl = 'partials/query.editor.html';
        }
    };
});
