'use strict';

System.register(['lodash'], function (_export, _context) {
    "use strict";

    var _, _createClass, prevent, menuItems, ColumnsMenuController;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function ColumnsMenuDirective($timeout) {
        var colCounter = 0;
        return {
            restrict: 'E',
            templateUrl: 'public/plugins/happygears-netspyglass-datasource' + '/partials/column.directive.html',
            controller: ColumnsMenuController,
            controllerAs: '$ctrl',
            bindToController: true,
            scope: {
                isTable: '@',
                column: '=',
                columnsList: '<',
                onColumnRemove: '&',
                onColumnChanged: '&'
            },
            link: function link($scope, $element, $attrs, ctrl) {
                ctrl.colCounter = ++colCounter;

                $element.on('click', function (evt) {
                    var $target = $(evt.target);

                    if ($target.hasClass('select-col__func--open')) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        var $menu = getMenu();
                        var right = $target.position().left;

                        if (!$menu.is(':visible')) {
                            getMenuTrigger().trigger('click');
                        }

                        $menu.addClass('dropdown-menu--for-function').attr('style', 'left: ' + right + 'px !important; right: auto !important;').data('f-index', $target.index());
                    }
                });

                $timeout(initDropdown);

                function getMenu() {
                    return $element.find(' > ul.dropdown-menu');
                }

                function getMenuTrigger() {
                    return $element.find('.dropdown-menu-trigger');
                }

                function initDropdown() {
                    var $menu = getMenu();

                    getMenuTrigger().on('click', function () {
                        $menu.removeAttr('style');
                        $menu.removeClass('dropdown-menu--for-function');
                        $menu.data('f-index', -1);
                    });

                    $menu.on('click', function (evt) {
                        var $target = $(evt.target);

                        if (evt.target.tagName.toLowerCase() === 'a' && $target.attr('href') && $target.attr('href')[0] === '#' && !$target.attr('ng-click')) {
                            evt.preventDefault();
                            $scope.$apply(function () {
                                ctrl.onSelectFunction($target.attr('href').substr(1), $menu.data('f-index'));
                                $menu.data('f-index', false);
                            });
                        }
                    });

                    $element.find('[aria-labelledby]').removeAttr('aria-labelledby');
                }
            }
        };
    }

    _export('default', ColumnsMenuDirective);

    return {
        setters: [function (_lodash) {
            _ = _lodash;
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

            prevent = ' $event.preventDefault();';
            menuItems = [{ text: 'Clear Functions', click: '$ctrl.onClear(); ' + prevent, href: '#for-dropdown-menu' }, { text: 'Remove Column', click: '$ctrl.onColumnRemove({$column: $ctrl.column}); ' + prevent, href: '#for-dropdown-menu' }, { text: 'Add Alias', click: '$ctrl.onColumnAddAlias(); ' + prevent, href: '#for-dropdown-menu' }, { text: 'Remove function', href: '#for-function-remove' }, {
                text: 'Transformation',
                submenu: [{ text: 'to_long', href: '#to_long' }, { text: 'ifnan', href: '#ifnan' }, { text: 'ifnull', href: '#ifnull' }]
            }, {
                text: 'Aggregation',
                submenu: [{ text: 'avg', href: '#avg' }, { text: 'median', href: '#median' }, { text: 'min', href: '#min' }, { text: 'max', href: '#max' }, { text: 'sum', href: '#sum' }, { text: 'count', href: '#count' }]
            }, {
                text: 'Aggregation By Time',
                submenu: [{ text: 'tslast', href: '#tslast' }, { text: 'tsmin', href: '#tsmin' }, { text: 'tsmax', href: '#tsmax' }]
            }];

            ColumnsMenuController = function () {
                function ColumnsMenuController($injector, $scope) {
                    _classCallCheck(this, ColumnsMenuController);

                    this.$injector = $injector;
                    this.$scope = $scope;
                    this.menuItems = _.clone(menuItems);

                    if (this.isTable === 'false') {
                        this.menuItems.splice(1, 1);
                    }
                }

                _createClass(ColumnsMenuController, [{
                    key: '$onInit',
                    value: function $onInit() {
                        if (!this.column.appliedFunctions) {
                            this.column.appliedFunctions = [];
                        }
                    }
                }, {
                    key: 'getColumnsList',
                    value: function getColumnsList() {
                        return this.$injector.get('$q').resolve(this.columnsList);
                    }
                }, {
                    key: 'notifyChange',
                    value: function notifyChange() {
                        var _this = this;

                        this.$injector.get('$timeout')(function () {
                            var aliasChanged = _this.$scope.column_form && !_this.$scope.column_form.alias || _this.$scope.column_form.alias.$valid;

                            if (aliasChanged) {
                                _this.onColumnChanged({ $column: _this.column });
                            }
                        });
                    }
                }, {
                    key: 'onColumnSelect',
                    value: function onColumnSelect($value) {
                        if ($value) {
                            this.column.name = $value;
                            this.notifyChange();
                        }
                    }
                }, {
                    key: 'onColumnAddAlias',
                    value: function onColumnAddAlias() {
                        this.column.alias = 'col_' + this.colCounter;
                        this.notifyChange();
                    }
                }, {
                    key: 'onClear',
                    value: function onClear() {
                        this.column.appliedFunctions.splice(0, this.column.appliedFunctions.length);
                        this.notifyChange();
                    }
                }, {
                    key: 'onSelectFunction',
                    value: function onSelectFunction(name, fIndex) {
                        fIndex = Number(fIndex);

                        if (name === 'for-function-remove') {
                            if (fIndex >= 0) {
                                this.column.appliedFunctions.splice(fIndex, 1);
                                this.notifyChange();
                            }
                        } else {
                            if (fIndex >= 0) {
                                this.column.appliedFunctions[fIndex].name = name;
                            } else {
                                this.column.appliedFunctions.unshift({ name: name });
                            }
                            this.notifyChange();
                        }
                    }
                }]);

                return ColumnsMenuController;
            }();
        }
    };
});
