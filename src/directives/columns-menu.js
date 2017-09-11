
class ColumnsMenuController {
    constructor($injector, $scope) {
        this.$injector = $injector;
        this.$scope = $scope;
        this.menuItems = [
            {text: 'Clear Functions', click: '$ctrl.onClear()'},
            {text: 'Remove Column', click: '$ctrl.onColumnRemove({$column: $ctrl.column})'},
            {text: 'Add Alias', click: '$ctrl.onColumnAddAlias()'},
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

        if (this.isTable === 'false') {
            this.menuItems.splice(1, 1);
        }
    }

    $onInit() {
        if (!this.column.appliedFunctions) {
            this.column.appliedFunctions = [];
        }
    }

    notifyChange() {
        this.$injector.get('$timeout')(() => {
            if (!this.$scope.column_form.alias || this.$scope.column_form.alias.$valid) {
                this.onColumnChanged({$column: this.column});
            }
        });
    }

    onColumnSelect($item, $subItem) {
        let value;
        
        if ($subItem && $subItem.value) {
            value = $subItem.value;
        } else if ($item && $item.value) {
            value = $item.value;
        }

        if (value) {
            this.column.name = value;
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

    onSelectFunction(name) {
        this.column.appliedFunctions.unshift(name);
        this.notifyChange();
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
            isTable: '@',
            column: '=',
            columnsList: '<',
            onColumnRemove: '&',
            onColumnChanged: '&'
        },
        link: function ($scope, $element, $attrs, ctrl) {
            ctrl.colCounter = (++colCounter);
            function initDropdown() {
                $element
                    .find(' > ul.dropdown-menu')
                    .on('click', function (evt) {
                        const $target = $(evt.target);
                        if (evt.target.tagName.toLowerCase() === 'a' && $target.attr('href') && $target.attr('href')[0] === '#') {
                            evt.preventDefault();
                            $scope.$apply(function () {
                                ctrl.onSelectFunction($target.attr('href').substr(1));
                            });
                        }
                    });

                $element.find('[aria-labelledby]').removeAttr('aria-labelledby');
            }

            $timeout(initDropdown);
        }
    };
}