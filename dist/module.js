'use strict';

System.register(['angular', './datasource', './query_ctrl', './directives/columns-menu', './directives/dropdown', 'app/plugins/sdk'], function (_export, _context) {
    "use strict";

    var angular, NetSpyGlassDatasource, NetSpyGlassQueryCtrl, ColumnsMenuDirective, DropdownDirective, loadPluginCss, GenericConfigCtrl, GenericQueryOptionsCtrl, GenericAnnotationsQueryCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_angular) {
            angular = _angular.default;
        }, function (_datasource) {
            NetSpyGlassDatasource = _datasource.NetSpyGlassDatasource;
        }, function (_query_ctrl) {
            NetSpyGlassQueryCtrl = _query_ctrl.NetSpyGlassQueryCtrl;
        }, function (_directivesColumnsMenu) {
            ColumnsMenuDirective = _directivesColumnsMenu.default;
        }, function (_directivesDropdown) {
            DropdownDirective = _directivesDropdown.default;
        }, function (_appPluginsSdk) {
            loadPluginCss = _appPluginsSdk.loadPluginCss;
        }],
        execute: function () {
            /*
             * Copyright (c) 2016.  Happy Gears, Inc
             *
             * Licensed under the Apache License, Version 2.0 (the "License");
             * you may not use this file except in compliance with the License.
             * You may obtain a copy of the License at
             *
             *     http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing, software
             * distributed under the License is distributed on an "AS IS" BASIS,
             * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
             * See the License for the specific language governing permissions and
             * limitations under the License.
             */

            ColumnsMenuDirective.templateUrl = 'partials_foo/config.html';

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

            angular.module('grafana.directives').directive('hgColumnsMenu', ColumnsMenuDirective).directive('hgDropdown', DropdownDirective);

            loadPluginCss({
                dark: 'plugins/happygears-netspyglass-datasource-v2' + '/styles/theme.dark.css',
                light: 'plugins/happygears-netspyglass-datasource-v2' + '/styles/theme.light.css'
            });

            _export('Datasource', NetSpyGlassDatasource);

            _export('QueryCtrl', NetSpyGlassQueryCtrl);

            _export('ConfigCtrl', GenericConfigCtrl);

            _export('QueryOptionsCtrl', GenericQueryOptionsCtrl);

            _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl);
        }
    };
});
