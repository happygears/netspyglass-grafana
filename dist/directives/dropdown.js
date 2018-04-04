'use strict';

System.register([], function (_export, _context) {
    "use strict";

    var _createClass, DropdownController;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function DropdownDirective() {
        return {
            restrict: 'E',
            templateUrl: 'public/plugins/happygears-netspyglass-datasource-v2' + '/partials/dropdown.directive.html',
            controller: DropdownController,
            controllerAs: '$ctrl',
            bindToController: true,
            scope: {
                label: '@',
                value: '=?',
                onValueChanged: '&',
                getOptions: '&'
            },
            link: function link($scope, $element, $attrs, ctrl) {
                var $body = angular.element('body');

                $element.find('.pointer').on('click', function (e) {
                    // e.stopPropagation();
                    e.preventDefault();

                    if (!ctrl.isOpened) {
                        setTimeout(function () {
                            $body.on('click', onBodyClick);
                        }, 0);

                        ctrl.getSelectOptions().then(function (data) {
                            ctrl.list = data;
                        });
                    }

                    $scope.$apply(function () {
                        ctrl.isOpened = !ctrl.isOpened;
                    });
                });

                $element.on('$destroy', function () {
                    $body.off('click', onBodyClick);
                });

                function onBodyClick() {
                    $body.off('click', onBodyClick);
                    $scope.$apply(function () {
                        ctrl.isOpened = false;
                        $element.toggleClass('open', ctrl.isOpened);
                    });
                }

                ctrl.toggleSubMenu = function ($event) {
                    $event.stopPropagation();
                    $event.preventDefault();

                    var link = angular.element($event.currentTarget),
                        submenuItems = link.parent().parent().find('.dropdown-submenu'),
                        submenuItemCurrent = link.parent();

                    submenuItems.removeClass('submenu-open');
                    submenuItemCurrent.toggleClass('submenu-open');
                };
            }
        };
    }

    _export('default', DropdownDirective);

    return {
        setters: [],
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

            DropdownController = function () {
                function DropdownController($injector, $scope) {
                    _classCallCheck(this, DropdownController);

                    this.$injector = $injector;
                    this.$scope = $scope;
                }

                _createClass(DropdownController, [{
                    key: '$onInit',
                    value: function $onInit() {
                        this.isOpened = false;
                    }
                }, {
                    key: 'onSelectValue',
                    value: function onSelectValue(value) {
                        this.value = value;
                        this.onValueChanged({ $value: value });
                    }
                }, {
                    key: 'getSelectOptions',
                    value: function getSelectOptions() {
                        var result = this.getOptions();
                        if (this.isPromiseLike(result)) {
                            return result;
                        }

                        return this.$q.when(result);
                    }
                }, {
                    key: 'isPromiseLike',
                    value: function isPromiseLike(obj) {
                        return obj && typeof obj.then === 'function';
                    }
                }]);

                return DropdownController;
            }();
        }
    };
});
