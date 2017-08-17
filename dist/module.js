'use strict';

System.register(['./datasource', './query_ctrl', 'angular'], function (_export, _context) {
    "use strict";

    var NetSpyGlassDatasource, NetSpyGlassDatasourceQueryCtrl, angular, GenericConfigCtrl, GenericQueryOptionsCtrl, GenericAnnotationsQueryCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_datasource) {
            NetSpyGlassDatasource = _datasource.NetSpyGlassDatasource;
        }, function (_query_ctrl) {
            NetSpyGlassDatasourceQueryCtrl = _query_ctrl.NetSpyGlassDatasourceQueryCtrl;
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

            angular.module('grafana.directives').directive("test", function () {
                return {
                    template: 'Test val {{prop}}',
                    restrict: 'E',
                    scope: {
                        prop: "="
                    }
                };
            });

            _export('Datasource', NetSpyGlassDatasource);

            _export('QueryCtrl', NetSpyGlassDatasourceQueryCtrl);

            _export('ConfigCtrl', GenericConfigCtrl);

            _export('QueryOptionsCtrl', GenericQueryOptionsCtrl);

            _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl);
        }
    };
});
//# sourceMappingURL=module.js.map
