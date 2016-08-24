'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!'], function (_export, _context) {
    "use strict";

    var QueryCtrl, _createClass, GenericDatasourceQueryCtrl;

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

            _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl = function (_QueryCtrl) {
                _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

                function GenericDatasourceQueryCtrl($scope, $injector, uiSegmentSrv) {
                    _classCallCheck(this, GenericDatasourceQueryCtrl);

                    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(GenericDatasourceQueryCtrl).call(this, $scope, $injector));

                    _this.scope = $scope;
                    _this.uiSegmentSrv = uiSegmentSrv;
                    _this.clearSelection = '-- clear selection --';
                    _this.target.category = _this.target.category || 'select category';
                    _this.target.variable = _this.target.variable || 'select variable';
                    _this.target.device = _this.target.device || 'select device';
                    _this.target.component = _this.target.component || 'select component';
                    _this.target.sortByEl = _this.target.sortByEl || 'none';
                    _this.target.selector = _this.target.selector || 'choose selector';
                    _this.target.limit = _this.target.limit || 'select limit';
                    _this.target.group = _this.target.group || 'select group';
                    _this.target.tagFacet = _this.target.tagFacet || 'select tag facet';
                    _this.target.tagOperation = _this.target.tagOperation || '==';
                    _this.target.tagWord = _this.target.tagWord || 'select tag word';
                    _this.target.tagData = _this.target.tagData || [{
                        tagFacet: '',
                        tagWord: '',
                        tagOperation: '=='
                    }];

                    _this.target.resultFormat = _this.target.resultFormat || 'time_series';
                    _this.target.resultFormatDisplay = _this.target.resultFormatDisplay || 'Time Series';

                    _this.target.columns = _this.target.columns || 'time,variable,device,component,metric';

                    _this.temp = '';
                    return _this;
                }

                _createClass(GenericDatasourceQueryCtrl, [{
                    key: 'tagDataAdd',
                    value: function tagDataAdd() {
                        this.target.tagData[this.target.tagData.length] = {
                            tagFacet: this.target.tagData.length,
                            tagWord: '',
                            tagOperation: '=='
                        };
                        this.panelCtrl.refresh();
                    }
                }, {
                    key: 'tagDataRemove',
                    value: function tagDataRemove(index) {
                        this.target.tagData.splice(index, 1);
                        this.panelCtrl.refresh();
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

                            var temp = segments[0].html;
                            return segments;
                        };
                    }
                }, {
                    key: 'testRemove',
                    value: function testRemove() {
                        this.target.variable = 'select variable';
                        this.getVariables();
                        this.panelCtrl.refresh();
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
                        return this.datasource.metricFindQuery(this.target, 'tagFacet').then(this.transformToSegments(this.target.tagFacet, 'select tag facet'));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getTagsOperation',
                    value: function getTagsOperation() {
                        return this.datasource.metricFindTagOperationQuery(this.target).then(this.transformToSegments(false));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'getTagsWord',
                    value: function getTagsWord(data) {
                        return this.datasource.metricFindTagWordQuery(this.target, data).then(this.transformToSegments(this.target.tagWord, 'select tag word'));
                        // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
                    }
                }, {
                    key: 'addAdditionalTags',
                    value: function addAdditionalTags(param) {
                        this.target.tagOperation = param;
                        this.panelCtrl.refresh();
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
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'onChangeInternalVariable',
                    value: function onChangeInternalVariable() {
                        if (this.target.variable == this.clearSelection) {
                            this.target.variable = 'select variable';
                        }
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'onChangeInternalDevice',
                    value: function onChangeInternalDevice() {
                        if (this.target.device == this.clearSelection) {
                            this.target.device = 'select device';
                        }
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'onChangeInternalComponent',
                    value: function onChangeInternalComponent() {
                        if (this.target.component == this.clearSelection) {
                            this.target.component = 'select component';
                        }
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'onChangeInternalTagFacet',
                    value: function onChangeInternalTagFacet(index) {
                        if (this.target.tagFacet == this.clearSelection) {
                            this.target.tagFacet = 'select tag facet';
                        }
                        if (this.target.tagData[index].tagWord !== '') {
                            this.target.tagData[index].tagWord = '';
                        }
                        angular.element('#tag-word-' + index).children().children("a.tag-word").html('select tag word');
                        this.target.tagData[index].tagFacet = this.target.tagFacet;
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'onChangeInternalTagWord',
                    value: function onChangeInternalTagWord(index) {
                        if (this.target.tagWord == this.clearSelection) {
                            this.target.tagWord = 'select tag word';
                        }
                        this.target.tagData[index].tagWord = this.target.tagWord;
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'tagOperation',
                    value: function tagOperation(index, operation) {
                        this.target.tagData[index].tagOperation = operation;
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'setSortByEl',
                    value: function setSortByEl(element) {
                        this.target.sortByEl = element;
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'setSelector',
                    value: function setSelector(element) {
                        this.target.selector = element;
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'setLimit',
                    value: function setLimit() {
                        if (this.target.limit == '') {
                            if (this.temp !== '') {
                                this.target.limit = this.temp;
                            } else {
                                this.target.limit = 'select limit';
                            }
                        }
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'setResultFormat',
                    value: function setResultFormat(element, elementDisplayStr) {
                        this.target.resultFormat = element;
                        this.target.resultFormatDisplay = elementDisplayStr;
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'setColumns',
                    value: function setColumns() {
                        console.log(this.target.columns);
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }, {
                    key: 'setGroup',
                    value: function setGroup() {
                        if (this.target.group == '') {
                            if (this.tempNew !== '') {
                                this.target.group = this.tempNew;
                            } else {
                                this.target.group = 'select group';
                            }
                        }
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }]);

                return GenericDatasourceQueryCtrl;
            }(QueryCtrl));

            _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl);

            GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
        }
    };
});
//# sourceMappingURL=query_ctrl.js.map
