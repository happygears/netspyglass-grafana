import * as _ from 'lodash';

const prevent = ' $event.preventDefault();';

const menuItems = [
    {text: 'Clear Functions', click: `$ctrl.onClear(); ${prevent}`,  href: '#for-dropdown-menu'},
    {text: 'Remove Column', click: `$ctrl.onColumnRemove({$column: $ctrl.column}); ${prevent}`, href: '#for-dropdown-menu'},
    {text: 'Add Alias', click: `$ctrl.onColumnAddAlias(); ${prevent}`, href: '#for-dropdown-menu'},
    {text: 'Remove function', href: '#for-function-remove'},
    {
        text: 'Transformation',
        submenu: [
            {text: 'to_long', href: '#to_long'},
            {text: 'ifnan', href: '#ifnan'},
            {text: 'ifnull', href: '#ifnull'},
        ]
    },
    {
        text: 'Aggregation',
        submenu: [
            {text: 'avg', href: '#avg'},
            {text: 'median', href: '#median'},
            {text: 'min', href: '#min'},
            {text: 'max', href: '#max'},
            {text: 'sum', href: '#sum'},
            {text: 'count', href: '#count'}
        ]
    },
    {
        text: 'Aggregation By Time',
        submenu: [
            {text: 'tslast', href: '#tslast'},
            {text: 'tsmin', href: '#tsmin'},
            {text: 'tsmax', href: '#tsmax'}
        ]
    }
];

class ColumnsMenuController {
    constructor($injector, $scope) {
        this.$injector = $injector;
        this.$scope = $scope;
        this.menuItems = _.clone(menuItems);
    }

    $onInit() {
        if (!this.column.appliedFunctions) {
            this.column.appliedFunctions = [];
        }

        if (!this.availableRemove) {
            this.menuItems.splice(1, 1);
        }
    }

    getColumnsList() {
        return this.$injector.get('$q').resolve(this.columnsList);
    }

    notifyChange() {
        this.$injector.get('$timeout')(() => {
            const aliasChanged = this.$scope.column_form 
                && !this.$scope.column_form.alias || 
                this.$scope.column_form.alias.$valid;
            
            if (aliasChanged) {
                this.onColumnChanged({$column: this.column});
            }
        });
    }

    onColumnSelect($value) {
        if ($value) {
            this.column.name = $value;
            this.notifyChange();
        }
    }

    onColumnAddAlias() {
        this.column.alias = `col_${this.colCounter}`;
        this.notifyChange();
    }

    onClear() {
        this.column.appliedFunctions.splice(0, this.column.appliedFunctions.length);
        this.notifyChange();
    }

    onSelectFunction(name, fIndex) {
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
                this.column.appliedFunctions.unshift({name});
            }
            this.notifyChange();
        }
    }
}

export default function ColumnsMenuDirective($timeout) {
    let colCounter = 0;
    return {
        restrict: 'E',
        templateUrl: `public/plugins/${NSG_PLUGIN_ID}/partials/column.directive.html`,
        controller: ColumnsMenuController,
        controllerAs: '$ctrl',
        bindToController: true,
        scope: {
            availableRemove: '=',
            isTable: '=',
            column: '=',
            columnsList: '<',
            onColumnRemove: '&',
            onColumnChanged: '&'
        },
        link: function ($scope, $element, $attrs, ctrl) {
            ctrl.colCounter = (++colCounter);
            
            $element.on('click', function(evt) {
                const $target = $(evt.target);

                if ($target.hasClass('select-col__func--open')) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    const $menu = getMenu();
                    const right = $target.position().left;

                    if (!$menu.is(':visible')) {
                        getMenuTrigger().trigger('click');
                    }

                    $menu.addClass('dropdown-menu--for-function')
                        .attr('style', `left: ${right}px !important; right: auto !important;`)
                        .data('f-index', $target.index());
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
                const $menu = getMenu();

                getMenuTrigger().on('click', function() {
                    $menu.removeAttr('style');
                    $menu.removeClass('dropdown-menu--for-function');
                    $menu.data('f-index', -1);
                });

                $menu.on('click', function (evt) {
                    const $target = $(evt.target);

                    if (evt.target.tagName.toLowerCase() === 'a' && $target.attr('href')
                     && $target.attr('href')[0] === '#' && !$target.attr('ng-click')) {
                        evt.preventDefault();
                        $scope.$apply(function () {
                            ctrl.onSelectFunction($target.attr('href').substr(1), $menu.data('f-index'));
                            $menu.data('f-index', false);
                        });
                    }
                });

                $element
                    .find('[aria-labelledby]')
                    .removeAttr('aria-labelledby');
            }
        }
    };
}