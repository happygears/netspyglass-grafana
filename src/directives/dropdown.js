
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
        this.onValueChanged({$value: this.value});
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
            value: '=',
            onValueChanged: '&',
            getOptions: '&'
        },
        link: function ($scope, $element, $attrs, ctrl) {

            $element
                .find('.pointer')
                .on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();

                    if (!ctrl.isOpened) {
                        ctrl.getSelectOptions().then((data) => {
                            ctrl.list = data;
                        });
                    }

                    ctrl.isOpened = !ctrl.isOpened;
                    $element.toggleClass('open', ctrl.isOpened);
                });

            angular.element('html, body').on('click', function () {
                ctrl.isOpened = false;
                $element.toggleClass('open', ctrl.isOpened);
            })
        }
    };
}