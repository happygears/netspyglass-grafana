'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!'], function (_export, _context) {
    "use strict";

    var QueryCtrl, _createClass, prompts, targetDefaults, NetSpyGlassQueryCtrl;

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

            prompts = {
                category: 'select category',
                variable: 'select variable',
                device: 'select device',
                component: 'select component',
                groupByType: 'select type',
                groupBy: 'select value',
                orderBy: 'select value',
                selectItem: 'select item',
                whereValue: 'select value'
            };
            targetDefaults = {
                columns: [],
                category: prompts.category,
                variable: prompts.variable,
                rawQuery: 0,
                limit: 100
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
                    _this.prompts = prompts;
                    _this.uiSegmentSrv = uiSegmentSrv;

                    _this.options = {
                        categories: [],

                        segments: [uiSegmentSrv.newPlusButton()],

                        removeSegment: uiSegmentSrv.newSegment({ fake: true, value: '-- remove tag filter --' })
                    };
                    return _this;
                }

                _createClass(NetSpyGlassQueryCtrl, [{
                    key: 'execute',
                    value: function execute() {
                        this.panelCtrl.refresh();
                    }
                }, {
                    key: 'init',
                    value: function init() {
                        var _this2 = this;

                        this.initTarget();
                        this.datasource.getCategories().then(function (categories) {
                            _this2.options.categories = categories;
                        });
                    }
                }, {
                    key: 'initTarget',
                    value: function initTarget() {
                        _.defaultsDeep(this.target, targetDefaults);
                    }
                }, {
                    key: 'selectCategory',
                    value: function selectCategory(category, variable) {
                        this.target.category = category;
                        this.target.variable = variable;
                        this.execute();
                    }
                }, {
                    key: 'toggleEditorMode',
                    value: function toggleEditorMode() {
                        this.target.rawQuery ^= 1;
                    }
                }, {
                    key: 'getTagsOrValues',
                    value: function getTagsOrValues(segment, index) {
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
                                    return this.$q.when([this.uiSegmentSrv.newSegment('AND'), this.uiSegmentSrv.newSegment('OR')]);
                                    break;

                                case 'operator':
                                    return this.$q.when(this.uiSegmentSrv.newOperators(['=', '!=', '<>', '<', '>', 'REGEXP', 'NOT REGEXP']));
                                    break;
                            }
                        }

                        this.rebuildTargetTagConditions();

                        return promise.then(function (list) {
                            return list.map(function (item) {
                                return uiSegmentSrv.newSegment({ value: item });
                            });
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
                    }
                }, {
                    key: 'rebuildTargetTagConditions',
                    value: function rebuildTargetTagConditions() {
                        var _this3 = this;

                        var segments = this.options.segments;
                        var tags = [];
                        var tagIndex = 0;
                        var tagOperator = '';

                        segments.forEach(function (segment, index) {
                            if (segment.type === 'key') {
                                if (tags.length === 0) {
                                    tags.push({});
                                }
                                tags[tagIndex].key = segment.value;
                            } else if (segment.type === 'value') {
                                if (tagOperator = tags[tagIndex].operator) {
                                    segments[index - 1] = _this3.uiSegmentSrv.newOperator(tagOperator);
                                    tags[tagIndex].operator = tagOperator;
                                }
                                tags[tagIndex].value = segment.value;
                            } else if (segment.type === 'condition') {
                                tags.push({ condition: segment.value });
                                tagIndex += 1;
                            } else if (segment.type === 'operator') {
                                tags[tagIndex].operator = segment.value;
                            }
                        });

                        this.target.tags = tags;
                    }
                }]);

                return NetSpyGlassQueryCtrl;
            }(QueryCtrl));

            _export('NetSpyGlassQueryCtrl', NetSpyGlassQueryCtrl);

            NetSpyGlassQueryCtrl.templateUrl = 'partials/query.editor.html';
        }
    };
});
//# sourceMappingURL=query_ctrl.js.map
