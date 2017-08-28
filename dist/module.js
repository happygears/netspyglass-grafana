'use strict';

System.register(['./datasource', './query_ctrl', 'angular'], function (_export, _context) {
    "use strict";

    var NetSpyGlassDatasource, NetSpyGlassQueryCtrl, angular, GenericConfigCtrl, GenericQueryOptionsCtrl, GenericAnnotationsQueryCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_datasource) {
            NetSpyGlassDatasource = _datasource.NetSpyGlassDatasource;
        }, function (_query_ctrl) {
            NetSpyGlassQueryCtrl = _query_ctrl.NetSpyGlassQueryCtrl;
        }, function (_angular) {
            angular = _angular.default;
        }],
        execute: function () {
            _export('ConfigCtrl', GenericConfigCtrl = function GenericConfigCtrl() {
                _classCallCheck(this, GenericConfigCtrl);
            });

            GenericConfigCtrl.templateUrl = 'partials/config.html';

            _export('QueryOptionsCtrl', GenericQueryOptionsCtrl = function GenericQueryOptionsCtrl() {
                _classCallCheck(this, GenericQueryOptionsCtrl);
            });

            GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

            _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl = function GenericAnnotationsQueryCtrl() {
                _classCallCheck(this, GenericAnnotationsQueryCtrl);
            });

            GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

            angular.module('grafana.directives').directive("selectDropdown", ['$compile', function ($compile) {
                return {
                    template: '',
                    restrict: 'A',
                    scope: {
                        items: '=',
                        value: '=',
                        eventOnSelect: '&'
                    },
                    link: function link($scope, $element, $attrs) {
                        "use strict";

                        $scope.$watch('items', function (val) {
                            console.log(val);
                            buildDropdownHtml(val);
                        });

                        $scope.selectItem = function (value) {
                            $scope.value = value;
                            $scope.eventOnSelect({ value: value });
                        };

                        function buildDropdownHtml(list) {
                            var html = '';

                            list.forEach(function (l1) {
                                if (l1.type == 'separator') {
                                    html += '<li class="separator"><span>-</span></li>';
                                    return;
                                }
                                if (l1.type == 'simple') {
                                    html += '<li><a data-ng-click="selectItem(\'' + l1.name + '\')">' + l1.name + '</a></li>';
                                    return;
                                }

                                Object.keys(l1).forEach(function (key, index) {
                                    var value = l1[key];

                                    if (value.length) {
                                        html += '<li class="dropdown-submenu" role="menu">';
                                        html += '<a>' + key + '</a>';
                                        html += '<ul class="dropdown-menu" role="menu">';
                                        value.forEach(function (item) {
                                            html += '<li><a data-ng-click="selectItem(\'' + item.name + '\')">' + item.name + '</a></li>';
                                        });
                                        html += '</ul>';
                                        html += '</li>';
                                    } else {
                                        html += '<li>';
                                        html += '<a>' + key + '</a>';
                                        html += '</li>';
                                    }
                                });
                            });

                            var compiledHtml = $compile(html)($scope);

                            $element.html('');
                            console.log(compiledHtml);
                            $element.append(compiledHtml);
                        }
                    }
                };
            }]);

            _export('Datasource', NetSpyGlassDatasource);

            _export('QueryCtrl', NetSpyGlassQueryCtrl);

            _export('ConfigCtrl', GenericConfigCtrl);

            _export('QueryOptionsCtrl', GenericQueryOptionsCtrl);

            _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl);
        }
    };
});
//# sourceMappingURL=module.js.map
