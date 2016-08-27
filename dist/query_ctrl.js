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

                    _this.scope = $scope;
                    _this.uiSegmentSrv = uiSegmentSrv;
                    _this.clearSelection = '-- clear selection --';
                    _this.blankDropDownElement = '---';
                    _this.target.category = _this.target.category || 'select category';
                    _this.target.variable = _this.target.variable || 'select variable';
                    _this.target.device = _this.target.device || 'select device';
                    _this.target.component = _this.target.component || 'select component';
                    _this.target.sortByEl = _this.target.sortByEl || 'none';
                    _this.target.selector = _this.target.selector || 'choose selector';
                    _this.target.limit = _this.target.limit || '';
                    _this.target.group = _this.target.group || 'select group';
                    _this.target.tagFacet = _this.target.tagFacet || _this.blankDropDownElement;
                    _this.target.tagOperation = _this.target.tagOperation || '==';
                    _this.target.tagWord = _this.target.tagWord || _this.blankDropDownElement;
                    _this.target.tagData = _this.target.tagData || [];

                    _this.target.resultFormat = _this.target.resultFormat || 'time_series';
                    _this.target.resultFormatDisplay = _this.target.resultFormatDisplay || 'Time Series';

                    _this.target.columns = _this.target.columns || 'time,variable,device,component,metric';
                    _this.target.alias = _this.target.alias || '';
                    return _this;
                }

                _createClass(NetSpyGlassDatasourceQueryCtrl, [{
                    key: 'isCategorySelected',
                    value: function isCategorySelected() {
                        return this.target.category !== 'select category' && this.target.category !== this.clearSelection;
                    }
                }, {
                    key: 'isVariableSelected',
                    value: function isVariableSelected() {
                        return this.target.variable !== 'select variable' && this.target.variable !== this.clearSelection;
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
                        return this.datasource.metricFindCategoryQuery(this.target).then(this.transformToSegments(this.target.category, 'select category'));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'transformToSegments',
                    value: function transformToSegments(element, addTemplateVars) {
                        var _this2 = this;

                        return function (results) {
                            var segments = _.map(results, function (segment) {
                                return _this2.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
                            });

                            if (element !== addTemplateVars) {
                                segments.unshift(_this2.uiSegmentSrv.newSegment({ fake: true, value: _this2.clearSelection, html: addTemplateVars }));
                            }
                            return segments;
                        };
                    }
                }, {
                    key: 'testRemove',
                    value: function testRemove() {
                        this.target.variable = 'select variable';
                        this.getVariables();
                        this.refresh();
                    }
                }, {
                    key: 'getVariables',
                    value: function getVariables() {
                        return this.datasource.metricFindVariableQuery(this.target).then(this.transformToSegments(this.target.variable, 'select variable'));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getDevices',
                    value: function getDevices() {
                        return this.datasource.metricFindQuery(this.target, 'device').then(this.transformToSegments(this.target.device, 'select device'));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getComponents',
                    value: function getComponents() {
                        return this.datasource.metricFindQuery(this.target, 'component').then(this.transformToSegments(this.target.component, 'select component'));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getTagsFacet',
                    value: function getTagsFacet() {
                        return this.datasource.metricFindQuery(this.target, 'tagFacet').then(this.transformToSegments(this.target.tagFacet, this.target.tagFacet)); // do not add "-- clear selection --" item
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getTagsWord',
                    value: function getTagsWord(facet) {
                        return this.datasource.metricFindTagWordQuery(this.target, facet).then(this.transformToSegments(this.target.tagWord, this.target.tagWord)); // do not add "-- clear selection --" item
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
                            this.target.category = 'select category';
                        }
                        this.refresh();
                    }
                }, {
                    key: 'onChangeInternalVariable',
                    value: function onChangeInternalVariable() {
                        if (this.target.variable == this.clearSelection) {
                            this.target.variable = 'select variable';
                        }
                        this.refresh();
                    }
                }, {
                    key: 'onChangeInternalDevice',
                    value: function onChangeInternalDevice() {
                        if (this.target.device == this.clearSelection) {
                            this.target.device = 'select device';
                        }
                        this.refresh();
                    }
                }, {
                    key: 'onChangeInternalComponent',
                    value: function onChangeInternalComponent() {
                        if (this.target.component == this.clearSelection) {
                            this.target.component = 'select component';
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
                        // this does not look right, there must be a way to update element without manipulating it directly in DOM
                        angular.element('#tag-word-' + index).children().children("a.tag-word").html(this.target.tagData[index].tagWord);
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
                    value: function setSortByEl(element) {
                        this.target.sortByEl = element;
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
                    key: 'setResultFormat',
                    value: function setResultFormat(element, elementDisplayStr) {
                        this.target.resultFormat = element;
                        this.target.resultFormatDisplay = elementDisplayStr;
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
