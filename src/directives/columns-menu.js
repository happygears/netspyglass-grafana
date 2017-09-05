import './columns-menu.css!';

class ColumnsMenuController {
    constructor($injector) {
        this.$injector = $injector;
        this.menuItems = [
            {text: 'Clear Functions', click: '$ctrl.onClear()'},
            {text: 'Remove Column', click: '$ctrl.onColumnRemove($ctrl.column)'},
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
                text: 'Aggregation By Time',
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

        this.initColumns();

        console.log(this.column);
    }

    $onInit() {
        if (!this.column.appliedFunctions) {
            this.column.appliedFunctions = [];
        }
    }

    initColumns() {
        this.columnsList = [
            {
                text: 'tags', 
                submenu: []
            },
            {text: '----------', cssClasses: 'foooooo'},
            {
                text: 'predefined', 
                submenu: [
                    {text: 'metric', value: 'metric'},
                    {text: 'time', value: 'time'}
                ]
            },
            {text: '----------'},
            {
                text: 'none',
                submenu: []
            }
        ];
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
        }
    }

    onColumnAddAlias() {
        this.column.alias = 'col_alias';
    }

    onClear() {
        this.column.appliedFunctions.splice(0, this.column.appliedFunctions.length);
    }

    onSelectFunction(name) {
        this.column.appliedFunctions.unshift(name);
    }
}

export default function ColumnsMenuDirective($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'public/plugins/happygears-netspyglass-datasource-dev/partials/column.directive.html',
        controller: ColumnsMenuController,
        controllerAs: '$ctrl',
        bindToController: true,
        scope: {
            column: '=',
            columns: '<',
            onColumnRemove: '&'
        },
        link: function ($scope, $element, $attrs, ctrl) {
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