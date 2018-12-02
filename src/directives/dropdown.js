class DropdownController {
    constructor($injector, $scope) {
        this.$injector = $injector;
        this.$scope = $scope;
    }

    $onInit() {
        this.isOpened = false;
    }

    onSelectValue(value) {
        this.value = value;
        this.onValueChanged({$value: value});
    }

    /**
     * @returns {promise}
     */
    getSelectOptions() {
        var result = this.getOptions();
        if (this.isPromiseLike(result)) {
            return result;
        }

        return this.$q.when(result);
    }

    /**
     * @param {object} obj
     * @returns {boolean}
     */
    isPromiseLike(obj) {
        return obj && (typeof obj.then === 'function');
    }

}

export default function DropdownDirective() {
    return {
        restrict: 'E',
        templateUrl: `public/plugins/${NSG_PLUGIN_ID}/partials/dropdown.directive.html`,
        controller: DropdownController,
        controllerAs: '$ctrl',
        bindToController: true,
        scope: {
            label: '@',
            value: '=?',
            onValueChanged: '&',
            getOptions: '&'
        },
        link: function ($scope, $element, $attrs, ctrl) {
            const $body = angular.element('body');

            $element
                .find('.pointer')
                .on('click', function (e) {
                    // e.stopPropagation();
                    e.preventDefault();

                    if (!ctrl.isOpened) {
                        setTimeout(function() {
                            $body.on('click', onBodyClick);
                        }, 0);

                        ctrl.getSelectOptions().then((data) => {
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

            ctrl.toggleSubMenu = function($event) {
                $event.stopPropagation();
                $event.preventDefault();

                const link = angular.element($event.currentTarget),
                    submenuItems = link.parent().parent().find('.dropdown-submenu'),
                    submenuItemCurrent = link.parent();

                submenuItems.removeClass('submenu-open');
                submenuItemCurrent.toggleClass('submenu-open');
            }
        }
    };
}