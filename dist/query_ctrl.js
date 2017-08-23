'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!', './hg-sql-builder', 'lodash'], function (_export, _context) {
    "use strict";

    var QueryCtrl, SQLBuilderFactory, _, _typeof, _createClass, NetSpyGlassDatasourceQueryCtrl;

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
        }, function (_cssQueryEditorCss) {}, function (_hgSqlBuilder) {
            SQLBuilderFactory = _hgSqlBuilder.default;
        }, function (_lodash) {
            _ = _lodash.default;
        }],
        execute: function () {
            _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
                return typeof obj;
            } : function (obj) {
                return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };

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

            _export('NetSpyGlassDatasourceQueryCtrl', NetSpyGlassDatasourceQueryCtrl = function (_QueryCtrl) {
                _inherits(NetSpyGlassDatasourceQueryCtrl, _QueryCtrl);

                function NetSpyGlassDatasourceQueryCtrl($scope, $injector, templateSrv, $q, uiSegmentSrv, $timeout) {
                    _classCallCheck(this, NetSpyGlassDatasourceQueryCtrl);

                    var _this = _possibleConstructorReturn(this, (NetSpyGlassDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(NetSpyGlassDatasourceQueryCtrl)).call(this, $scope, $injector));

                    _this.prompts = {
                        'category': 'select category',
                        'variable': 'select variable',
                        'device': 'select device',
                        'component': 'select component',
                        'groupByType': 'select type',
                        'groupBy': 'select value',
                        'orderBy': 'select value',
                        'selectItem': 'select item',
                        'whereValue': 'select value'
                    };

                    _this.scope = $scope;
                    _this.injector = $injector;

                    _this.templateSrv = templateSrv;
                    _this.$q = $q;
                    _this.uiSegmentSrv = uiSegmentSrv;
                    _this.$timeout = $timeout;

                    _this.clearSelection = '-- clear selection --';
                    _this.blankDropDownElement = '---';
                    _this.target.category = _this.target.category || _this.prompts['category'];
                    _this.target.variable = _this.target.variable || _this.prompts['variable'];
                    _this.target.device = _this.target.device || _this.prompts['device'];
                    _this.target.component = _this.target.component || _this.prompts['component'];
                    _this.target.sortByEl = _this.target.sortByEl || 'none';
                    _this.target.selector = _this.target.selector || ' -- ';
                    _this.target.aggregator = _this.target.aggregator || ' -- ';
                    _this.target.limit = _this.target.limit || '100';
                    _this.target.group = _this.target.group || 'select group';
                    _this.target.tagFacet = _this.target.tagFacet || _this.blankDropDownElement;
                    _this.target.tagOperation = _this.target.tagOperation || '==';
                    _this.target.tagWord = _this.target.tagWord || _this.blankDropDownElement;
                    _this.target.tagData = _this.target.tagData || [];

                    _this.target.format = _this.panel.type === 'table' ? 'table' : 'time_series';
                    _this.target.formatDisplay = _this.target.formatDisplay || 'Time Series';

                    _this.target.columns = _this.target.columns || 'time,variable,device,component,metric';
                    _this.target.alias = _this.target.alias || '';

                    // _NEW_
                    _this.SQLBuilder = new SQLBuilderFactory();
                    _this.target.queryConfig = _this.SQLBuilder.factory();
                    _this.target.customNsgqlQuery = '';

                    _this.queryConfigWhere = ['AND'];
                    _this.rowMode = false;

                    _this.category = _this.target.category || _this.prompts['category'];
                    _this.variable = _this.target.variable || _this.prompts['variable'];
                    _this.groupByFormats = [_this.prompts['groupByType'], 'time', 'column'];
                    _this.groupBy = {
                        type: _this.prompts['groupByType'],
                        val: _this.prompts['groupBy']
                    };
                    _this.orderBy = _this.target.orderBy || _this.prompts.orderBy;

                    _this.tagSegments = [];
                    _this.tagSegments.push(_this.uiSegmentSrv.newPlusButton());
                    _this.removeTagFilterSegment = uiSegmentSrv.newSegment({ fake: true, value: '-- remove tag filter --' });

                    _this.categories = [];
                    _this.getCategories();

                    if (_this.panel.type === 'graph') {
                        _this.selectData = ['time', 'metric'];
                    }
                    if (_this.panel.type === 'table') {
                        _this.selectData = [];
                        _this.addItemToSelect();
                    }
                    _this.selectList = [];
                    return _this;
                }

                _createClass(NetSpyGlassDatasourceQueryCtrl, [{
                    key: 'addItemToSelect',
                    value: function addItemToSelect(data) {
                        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
                            this.selectData.push(data);
                        } else {
                            this.selectData.push({
                                value: '',
                                func: [],
                                alias: []
                            });
                        }
                    }
                }, {
                    key: 'isCategorySelected',
                    value: function isCategorySelected() {
                        return this.target.category !== this.prompts['category'] && this.target.category !== this.clearSelection;
                    }
                }, {
                    key: 'isVariableSelected',
                    value: function isVariableSelected() {
                        return this.target.variable !== this.prompts['variable'] && this.target.variable !== this.clearSelection;
                    }
                }, {
                    key: 'tagDataAdd',
                    value: function tagDataAdd() {
                        this.target.tagData[this.target.tagData.length] = {
                            tagFacet: this.blankDropDownElement,
                            tagWord: this.blankDropDownElement,
                            tagOperation: '=='
                        };
                        this.refresh();
                    }
                }, {
                    key: 'tagDataRemove',
                    value: function tagDataRemove(index) {
                        this.target.tagData.splice(index, 1);
                        this.refresh();
                    }
                }, {
                    key: 'getCategories',
                    value: function getCategories() {
                        var _this2 = this;

                        this.datasource.executeQuery(this.SQLBuilder.factory({
                            select: ['category,name'],
                            distinct: true,
                            from: 'variables',
                            where: ['AND', {
                                category: ['<>', '']
                            }],
                            orderBy: ['category']
                        }).compile(), 'json').then(function (data) {
                            var formattedList = _.groupBy(data[0].rows, 'category');

                            console.log(formattedList);

                            _this2.categories = formattedList;
                        });
                    }
                }, {
                    key: 'selectCat',
                    value: function selectCat(category, variable) {
                        this.target.category = category;
                        this.variable = variable;
                        this.target.variable = variable;
                        this.target.queryConfig.from(variable);

                        if (this.panel.type === 'graph') {
                            this.target.queryConfig.select(this.selectData);
                        }

                        this.buildNsgQLString();
                        this.refresh();
                    }
                }, {
                    key: 'getSelectValue',
                    value: function getSelectValue() {
                        var _this3 = this;

                        this.$q.all([this.datasource.executeQuery(this.SQLBuilder.factory({
                            select: ['tagFacet'],
                            distinct: true,
                            from: this.variable,
                            orderBy: ['tagFacet']
                        }).compile(), 'list'), this.datasource.executeQuery(this.SQLBuilder.factory({
                            select: ['category,name'],
                            distinct: true,
                            from: 'variables',
                            where: ['AND', {
                                category: ['<>', '']
                            }],
                            orderBy: ['category']
                        }).compile(), 'json')]).then(function (values) {
                            var facetsList = values[0],
                                variables = _.groupBy(values[1][0].rows, 'category'),
                                resultList = [];

                            resultList.push({
                                tags: facetsList.map(function (facet) {
                                    return { name: facet };
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

                            _this3.selectList = resultList;
                        });
                    }
                }, {
                    key: 'onSelectUpdated',
                    value: function onSelectUpdated(value) {
                        var _this4 = this;

                        this.$timeout(function () {
                            var selectedValues = _this4.selectData.map(function (el) {
                                if (el.value) {
                                    return el.value;
                                }
                            }).filter(Boolean);

                            _this4.target.queryConfig.select(selectedValues);

                            _this4.buildNsgQLString();
                            _this4.refresh();
                        }, 0);
                    }
                }, {
                    key: 'transformToSegments',
                    value: function transformToSegments(currentValue, prompt) {
                        var _this5 = this;

                        console.log('transformToSegments called:  currentValue=' + currentValue + ' prompt=' + prompt);
                        return function (results) {
                            var segments = _.map(results, function (segment) {
                                //TODO: really we need to ckeck segment.text if all request types will be 'list'
                                if (segment.text) {
                                    return _this5.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
                                } else {
                                    return _this5.uiSegmentSrv.newSegment({ value: segment });
                                }
                            });
                            // segments.unshift(this.uiSegmentSrv.newSegment({ fake: true, value: this.clearSelection, html: prompt}));

                            // there is no need to add "clear selection" item if current value is already equal to prompt
                            if (currentValue !== prompt) {
                                segments.unshift(_this5.uiSegmentSrv.newSegment({ fake: true, value: _this5.clearSelection, html: prompt }));
                            }

                            console.log(segments);

                            return segments;
                        };
                    }
                }, {
                    key: 'testRemove',
                    value: function testRemove() {
                        this.target.variable = this.prompts['variable'];
                        this.getVariables();
                        this.refresh();
                    }
                }, {
                    key: 'getVariables',
                    value: function getVariables() {
                        var query = this.SQLBuilder.factory({
                            select: ['name'],
                            distinct: true,
                            from: 'variables',
                            where: ['AND', {
                                category: ['=', this.target.category]
                            }],
                            orderBy: ['name']
                        }).compile();

                        return this.datasource.executeQuery(query, 'list').then(this.transformToSegments(this.target.variable, this.prompts['variable']));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getDevices',
                    value: function getDevices() {
                        return this.datasource.findDevices(this.target).then(this.transformToSegments(this.target.device, this.prompts['device']));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getComponents',
                    value: function getComponents() {
                        return this.datasource.findComponents(this.target).then(this.transformToSegments(this.target.component, this.prompts['component']));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getTagsFacet',
                    value: function getTagsFacet(index) {
                        return this.datasource.findTagFacets(this.target, index).then(this.transformToSegments(this.target.tagFacet, this.target.tagFacet)); // do not add "-- clear selection --" item
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getTagsWord',
                    value: function getTagsWord(index) {
                        return this.datasource.findTagWordsQuery(this.target, index).then(this.transformToSegments(this.target.tagWord, this.target.tagWord)); // do not add "-- clear selection --" item
                    }
                }, {
                    key: 'toggleEditorMode',
                    value: function toggleEditorMode() {
                        this.target.rawQuery = !this.target.rawQuery;
                    }
                }, {
                    key: 'onChangeInternalCategory',
                    value: function onChangeInternalCategory() {
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
                }, {
                    key: 'onChangeInternalVariable',
                    value: function onChangeInternalVariable() {
                        this.refresh();
                    }
                }, {
                    key: 'onChangeInternalDevice',
                    value: function onChangeInternalDevice() {
                        if (this.target.device == this.clearSelection) {
                            this.target.device = this.prompts['device'];
                        }
                        this.refresh();
                    }
                }, {
                    key: 'onChangeInternalComponent',
                    value: function onChangeInternalComponent() {
                        if (this.target.component == this.clearSelection) {
                            this.target.component = this.prompts['component'];
                        }
                        this.refresh();
                    }
                }, {
                    key: 'onChangeInternalTagFacet',
                    value: function onChangeInternalTagFacet(index) {
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
                }, {
                    key: 'onChangeInternalTagWord',
                    value: function onChangeInternalTagWord(index) {
                        this.target.needToBuildQuery = true;
                        this.refresh();
                    }
                }, {
                    key: 'tagOperation',
                    value: function tagOperation(index, operation) {
                        this.target.tagData[index].tagOperation = operation;
                        this.target.needToBuildQuery = true;
                        this.refresh();
                    }
                }, {
                    key: 'setSortByEl',
                    value: function setSortByEl(sortOrder) {
                        this.target.sortByEl = sortOrder;
                        this.target.needToBuildQuery = true;
                        this.refresh();
                    }
                }, {
                    key: 'setSelector',
                    value: function setSelector(element) {
                        this.target.selector = element;
                        this.target.needToBuildQuery = true;
                        this.refresh();
                    }
                }, {
                    key: 'setAggregator',
                    value: function setAggregator(element) {
                        this.target.aggregator = element;
                        this.target.needToBuildQuery = true;
                        this.refresh();
                    }
                }, {
                    key: 'setAlias',
                    value: function setAlias() {
                        this.target.needToBuildQuery = true;
                        this.refresh();
                    }
                }, {
                    key: 'setFormat',
                    value: function setFormat(element, elementDisplayStr) {
                        this.target.format = element;
                        this.target.formatDisplay = elementDisplayStr;
                        this.target.needToBuildQuery = true;
                        this.refresh();
                    }
                }, {
                    key: 'setColumns',
                    value: function setColumns() {
                        // console.log(this.target.columns);
                        this.target.needToBuildQuery = true;
                        this.refresh();
                    }
                }, {
                    key: 'onChangeNsgQl',
                    value: function onChangeNsgQl() {
                        this.buildNsgQLString({ type: 'string' });
                        this.refresh();
                    }
                }, {
                    key: 'toggleEditorMode',
                    value: function toggleEditorMode() {
                        this.rowMode = !this.rowMode;
                    }
                }, {
                    key: 'getCollapsedText',
                    value: function getCollapsedText() {
                        return this.target.customNsgqlQuery;
                    }
                }, {
                    key: 'onFromChange',
                    value: function onFromChange() {
                        if (this.target.category !== this.category && this.variable != this.prompts['variable']) {
                            console.log(111);
                            this.target.category = this.category;
                            this.variable = this.prompts['variable'];
                            this.onSelectChange();
                            return;
                        }

                        this.target.category = this.category;
                    }
                }, {
                    key: 'onSelectChange',
                    value: function onSelectChange() {
                        this.target.variable = this.variable;
                        this.target.queryConfig.select(['time', 'metric']);
                        this.target.queryConfig.from(this.variable);

                        this.buildNsgQLString();
                        this.refresh();
                    }
                }, {
                    key: 'onOrderByChange',
                    value: function onOrderByChange() {
                        this.target.queryConfig.clearOrderBy();

                        if (this.orderBy != this.clearSelection) {
                            this.target.queryConfig.orderBy(this.orderBy);
                        }

                        this.buildNsgQLString();
                        this.refresh();
                    }
                }, {
                    key: 'onOrderByClear',
                    value: function onOrderByClear() {
                        this.orderBy = null;
                        this.target.queryConfig.clearOrderBy();

                        this.buildNsgQLString();
                        this.refresh();
                    }
                }, {
                    key: 'getOrderByValues',
                    value: function getOrderByValues() {
                        var _this6 = this;

                        var list = [];

                        if (this.panel.type === 'graph') {
                            list = [this.uiSegmentSrv.newSegment('metric')];
                        }
                        if (this.panel.type === 'table') {
                            list = this.selectData.map(function (el) {
                                return _this6.uiSegmentSrv.newSegment(el.value);
                            });
                        }

                        list.unshift(this.uiSegmentSrv.newSegment({ fake: true, value: this.clearSelection, html: this.prompts.orderBy }));

                        return this.$q.when(list);
                    }
                }, {
                    key: 'onLimitChange',
                    value: function onLimitChange() {
                        if (this.limit) {
                            this.target.queryConfig.limit(this.limit);
                        } else {
                            this.target.queryConfig.clearLimit();
                        }

                        this.buildNsgQLString();
                        this.refresh();
                    }
                }, {
                    key: 'onGroupByTypeChange',
                    value: function onGroupByTypeChange() {
                        //TODO: fix this behavior
                        this.groupBy.val = this.prompts['groupBy'];

                        if (this.groupBy.type === 'select type') {
                            this.target.queryConfig.clearGroupBy();
                            this.buildNsgQLString();
                            this.refresh();
                        }
                    }
                }, {
                    key: 'onGroupByChange',
                    value: function onGroupByChange() {
                        if (this.groupBy.type === 'time') {
                            this.target.queryConfig.groupBy('time(' + this.groupBy.val + ')');
                        }
                        if (this.groupBy.type === 'column') {
                            this.target.queryConfig.groupBy(this.groupBy.val);
                        }

                        this.buildNsgQLString();
                        this.refresh();
                    }
                }, {
                    key: 'getGroupByVariables',
                    value: function getGroupByVariables() {
                        if (this.groupBy.type === 'time') {
                            var groupByTimeOptions = [this.uiSegmentSrv.newSegment('1s'), this.uiSegmentSrv.newSegment('1m'), this.uiSegmentSrv.newSegment('30m'), this.uiSegmentSrv.newSegment('1h'), this.uiSegmentSrv.newSegment('1d')];
                            return this.$q.when(groupByTimeOptions);
                        }

                        if (this.groupBy.type === 'column') {
                            var query = this.SQLBuilder.factory({
                                select: ['tagFacet'],
                                distinct: true,
                                from: this.variable,
                                orderBy: ['tagFacet']
                            }).compile();

                            return this.datasource.executeQuery(query, 'list').then(this.transformToSegments(this.groupBy.val, '-- select group --'));
                        }
                    }
                }, {
                    key: 'getTagsOrValues',
                    value: function getTagsOrValues(segment, index) {
                        var _this7 = this;

                        console.log(segment, index);
                        var format = 'list';

                        if (segment.type === 'condition') {
                            return this.$q.when([this.uiSegmentSrv.newSegment('AND'), this.uiSegmentSrv.newSegment('OR')]);
                        }
                        if (segment.type === 'operator') {
                            var nextValue = this.tagSegments[index + 1].value;
                            return this.$q.when(this.uiSegmentSrv.newOperators(['=', '!=', '<>', '<', '>', 'REGEXP', 'NOT REGEXP']));
                        }

                        var nsgql = void 0,
                            addTemplateVars = void 0;
                        if (segment.type === 'key' || segment.type === 'plus-button') {
                            nsgql = this.SQLBuilder.factory({
                                select: ['tagFacet'],
                                distinct: true,
                                from: this.variable,
                                orderBy: ['tagFacet']
                            }).compile();

                            addTemplateVars = false;
                        } else if (segment.type === 'value') {
                            var segmentKeyValue = this.tagSegments[index - 2].value,
                                queryObj = void 0;

                            if (segmentKeyValue === 'device') {
                                queryObj = {
                                    select: ['device'],
                                    distinct: true,
                                    from: this.variable,
                                    orderBy: ['device'],
                                    where: _.cloneDeep(this.queryConfigWhere)
                                };
                            }
                            if (segmentKeyValue === 'component') {
                                queryObj = {
                                    select: ['component'],
                                    distinct: true,
                                    from: this.variable,
                                    orderBy: ['component'],
                                    where: _.cloneDeep(this.queryConfigWhere)
                                };
                            }
                            if (segmentKeyValue !== 'device' && segmentKeyValue !== 'component') {
                                queryObj = {
                                    select: [this.tagSegments[index - 2].value],
                                    distinct: true,
                                    from: 'devices',
                                    where: {},
                                    orderBy: [this.tagSegments[index - 2].value]
                                };
                                queryObj.where[this.tagSegments[index - 2].value] = ['NOTNULL'];
                            }

                            nsgql = this.SQLBuilder.factory(queryObj).compile();
                        }

                        return this.datasource.executeQuery(nsgql, format).then(function (results) {
                            if (segment.type === 'key' || segment.type === 'plus-button') {
                                results.unshift('component');
                                results.unshift('device');
                            }
                            return results;
                        }).then(this.transformToWhereSegments(addTemplateVars)).then(function (results) {
                            if (segment.type === 'key') {
                                results.splice(0, 0, angular.copy(_this7.removeTagFilterSegment));
                            }
                            return results;
                        });
                    }
                }, {
                    key: 'transformToWhereSegments',
                    value: function transformToWhereSegments() {
                        var _this8 = this;

                        return function (results) {
                            var segments = _.map(results, function (segment) {
                                return _this8.uiSegmentSrv.newSegment({ value: '' + segment });
                            });

                            return segments;
                        };
                    }
                }, {
                    key: 'tagSegmentUpdated',
                    value: function tagSegmentUpdated(segment, index) {
                        this.tagSegments[index] = segment;

                        // handle remove tag condition
                        if (segment.value === this.removeTagFilterSegment.value) {
                            this.tagSegments.splice(index, 3);
                            if (this.tagSegments.length === 0) {
                                this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
                            } else if (this.tagSegments.length > 2) {
                                this.tagSegments.splice(Math.max(index - 1, 0), 1);
                                if (this.tagSegments[this.tagSegments.length - 1].type !== 'plus-button') {
                                    this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
                                }
                            }
                        } else {
                            if (segment.type === 'plus-button') {
                                if (index > 2) {
                                    this.tagSegments.splice(index, 0, this.uiSegmentSrv.newCondition('AND'));
                                }
                                this.tagSegments.push(this.uiSegmentSrv.newOperator('='));
                                this.tagSegments.push(this.uiSegmentSrv.newFake(this.prompts.whereValue, 'value', 'query-segment-value'));
                                segment.type = 'key';
                                segment.cssClass = 'query-segment-key';
                            }

                            if (index + 1 === this.tagSegments.length) {
                                this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
                            }
                        }

                        this.rebuildTargetTagConditions();
                    }
                }, {
                    key: 'rebuildTargetTagConditions',
                    value: function rebuildTargetTagConditions() {
                        var _this9 = this;

                        var tags = [];
                        var tagIndex = 0;
                        var tagOperator = "";

                        console.log(this.tagSegments);

                        _.each(this.tagSegments, function (segment2, index) {
                            if (segment2.type === 'key') {
                                if (tags.length === 0) {
                                    tags.push({});
                                }
                                tags[tagIndex].key = segment2.value;
                            } else if (segment2.type === 'value') {
                                tagOperator = tags[tagIndex].operator;
                                if (tagOperator) {
                                    _this9.tagSegments[index - 1] = _this9.uiSegmentSrv.newOperator(tagOperator);
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

                        this.queryConfigWhere = ['AND'];
                        this.queryConfigWhere.push(this._buildTagsWhere('tags', this.target.tags));

                        this.buildNsgQLString();
                        this.refresh();
                    }
                }, {
                    key: '_buildTagsWhere',
                    value: function _buildTagsWhere(name, tagsList) {
                        var _this10 = this;

                        var result = [];

                        if (tagsList.length) {
                            tagsList.forEach(function (tag, i) {
                                if (tag.value == _this10.prompts.whereValue) return;

                                var obj = {};
                                obj[tag.key] = [tag.operator, tag.value];

                                if (tag.condition) {
                                    result.push(tag.condition);
                                }
                                result.push(obj);
                            });
                        }

                        if (result.length) {
                            result.unshift('AND');
                        } else {
                            result = null;
                        }

                        return result;
                    }
                }, {
                    key: 'buildNsgQLString',
                    value: function buildNsgQLString() {
                        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                        var str = void 0;

                        if (params.type == 'string') {
                            str = this.target.customNsgqlQuery;
                        }

                        if (params.type != 'string') {
                            var wherePart = void 0;
                            wherePart = _.cloneDeep(this.queryConfigWhere);
                            wherePart.push('$_timeFilter'); //GROUP BY time($__interval)
                            this.target.queryConfig.where(wherePart);

                            str = this.target.queryConfig.compile();
                        }

                        console.log('%cNsgQLString', 'color: blueviolet; font-weight: bold;', str);
                        this.target.customNsgqlQuery = str;
                    }
                }]);

                return NetSpyGlassDatasourceQueryCtrl;
            }(QueryCtrl));

            _export('NetSpyGlassDatasourceQueryCtrl', NetSpyGlassDatasourceQueryCtrl);

            NetSpyGlassDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
        }
    };
});
//# sourceMappingURL=query_ctrl.js.map
