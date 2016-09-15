'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!'], function (_export, _context) {
    "use strict";

    var QueryCtrl, _createClass, NetSpyGlassDatasourceQueryCtrl;

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
        }, function (_cssQueryEditorCss) {}],
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

            _export('NetSpyGlassDatasourceQueryCtrl', NetSpyGlassDatasourceQueryCtrl = function (_QueryCtrl) {
                _inherits(NetSpyGlassDatasourceQueryCtrl, _QueryCtrl);

                function NetSpyGlassDatasourceQueryCtrl($scope, $injector, uiSegmentSrv) {
                    _classCallCheck(this, NetSpyGlassDatasourceQueryCtrl);

                    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(NetSpyGlassDatasourceQueryCtrl).call(this, $scope, $injector));

                    _this.prompts = {
                        'category': 'select category',
                        'variable': 'select variable',
                        'device': 'select device',
                        'component': 'select component'
                    };

                    _this.scope = $scope;
                    _this.injector = $injector;
                    _this.uiSegmentSrv = uiSegmentSrv;
                    _this.clearSelection = '-- clear selection --';
                    _this.blankDropDownElement = '---';
                    _this.target.category = _this.target.category || _this.prompts['category'];
                    _this.target.variable = _this.target.variable || _this.prompts['variable'];
                    _this.target.device = _this.target.device || _this.prompts['device'];
                    _this.target.component = _this.target.component || _this.prompts['component'];
                    _this.target.sortByEl = _this.target.sortByEl || 'none';
                    _this.target.selector = _this.target.selector || 'choose selector';
                    _this.target.limit = _this.target.limit || '';
                    _this.target.group = _this.target.group || 'select group';
                    _this.target.tagFacet = _this.target.tagFacet || _this.blankDropDownElement;
                    _this.target.tagOperation = _this.target.tagOperation || '==';
                    _this.target.tagWord = _this.target.tagWord || _this.blankDropDownElement;
                    _this.target.tagData = _this.target.tagData || [];

                    _this.target.format = _this.target.format || 'time_series';
                    _this.target.formatDisplay = _this.target.formatDisplay || 'Time Series';

                    _this.target.columns = _this.target.columns || 'time,variable,device,component,metric';
                    _this.target.alias = _this.target.alias || '';
                    return _this;
                }

                _createClass(NetSpyGlassDatasourceQueryCtrl, [{
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
                        return this.datasource.findCategoriesQuery(this.target).then(this.transformToSegments(this.target.category, this.prompts['category']));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'transformToSegments',
                    value: function transformToSegments(currentValue, prompt) {
                        var _this2 = this;

                        console.log('transformToSegments called:  currentValue=' + currentValue + ' prompt=' + prompt);
                        return function (results) {
                            var segments = _.map(results, function (segment) {
                                return _this2.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
                            });
                            // segments.unshift(this.uiSegmentSrv.newSegment({ fake: true, value: this.clearSelection, html: prompt}));

                            // there is no need to add "clear selection" item if current value is already equal to prompt
                            if (currentValue !== prompt) {
                                segments.unshift(_this2.uiSegmentSrv.newSegment({ fake: true, value: _this2.clearSelection, html: prompt }));
                            }
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
                        return this.datasource.findVariablesQuery(this.target).then(this.transformToSegments(this.target.variable, this.prompts['variable']));
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
                        // FIXME: this does not look right, there must be a way to update element in the browser without manipulating it directly in DOM
                        angular.element('#variable-field').children().children('a').html(this.target.variable);
                        // call refresh to force graph reload (which should turn blank since we dont have enough data
                        // to build valid query)
                        this.refresh();
                    }
                }, {
                    key: 'onChangeInternalVariable',
                    value: function onChangeInternalVariable() {
                        console.log('Variable has changed to ' + this.target.variable);
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
                        // FIXME: this does not look right, there must be a way to update element in the browser without manipulating it directly in DOM
                        angular.element('#tag-word-' + index).children().children("a.tag-word").html(this.target.tagData[index].tagWord);
                        this.refresh();
                    }
                }, {
                    key: 'onChangeInternalTagWord',
                    value: function onChangeInternalTagWord(index) {
                        this.refresh();
                    }
                }, {
                    key: 'tagOperation',
                    value: function tagOperation(index, operation) {
                        this.target.tagData[index].tagOperation = operation;
                        this.refresh();
                    }
                }, {
                    key: 'setSortByEl',
                    value: function setSortByEl(sortOrder) {
                        this.target.sortByEl = sortOrder;
                        this.refresh();
                    }
                }, {
                    key: 'setSelector',
                    value: function setSelector(element) {
                        this.target.selector = element;
                        this.refresh();
                    }
                }, {
                    key: 'setAlias',
                    value: function setAlias() {
                        this.refresh();
                    }
                }, {
                    key: 'setFormat',
                    value: function setFormat(element, elementDisplayStr) {
                        this.target.format = element;
                        this.target.formatDisplay = elementDisplayStr;
                        this.refresh();
                    }
                }, {
                    key: 'setColumns',
                    value: function setColumns() {
                        // console.log(this.target.columns);
                        this.refresh();
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
