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

import angular from 'angular';
import {NetSpyGlassDatasource} from './datasource';
import {NetSpyGlassQueryCtrl} from './query_ctrl';
import ColumnsMenuDirective from './directives/columns-menu';
import {loadPluginCss} from 'app/plugins/sdk';

ColumnsMenuDirective.templateUrl = 'partials_foo/config.html'

class GenericConfigCtrl {}
GenericConfigCtrl.templateUrl = 'partials/config.html';

class GenericQueryOptionsCtrl {}
GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

class GenericAnnotationsQueryCtrl {}
GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';


angular.module('grafana.directives')
    .directive('hgColumnsMenu', ColumnsMenuDirective)
    .directive("selectDropdown",['$compile', function($compile) {
        return {
            template: '',
            restrict: 'A',
            scope: {
                items: '=',
                value: '=',
                eventOnSelect: '&'
            },
            link: function($scope, $element, $attrs) {
                "use strict";

                $scope.$watch('items', (val) => {
                    console.log(val);
                    buildDropdownHtml(val);
                });

                $scope.selectItem = function(value) {
                    $scope.value = value;
                    $scope.eventOnSelect({value: value});
                };

                function buildDropdownHtml(list) {
                    let html = '';

                    list.forEach((l1) => {
                        if( l1.type == 'separator') {
                            html += `<li class="separator"><span>-</span></li>`;
                            return;
                        }
                        if( l1.type == 'simple') {
                            html += `<li><a data-ng-click="selectItem('${l1.name}')">${l1.name}</a></li>`;
                            return;
                        }

                        Object.keys(l1).forEach((key, index) => {
                            let value = l1[key];

                            if( value.length ) {
                                html += `<li class="dropdown-submenu" role="menu">`;
                                html += `<a>${key}</a>`;
                                html += `<ul class="dropdown-menu" role="menu">`;
                                value.forEach((item) => {
                                    html += `<li><a data-ng-click="selectItem('${item.name}')">${item.name}</a></li>`;
                                });
                                html += `</ul>`;
                                html += `</li>`;
                            } else {
                                html += `<li>`;
                                html += `<a>${key}</a>`;
                                html += `</li>`;
                            }
                        });

                    });

                    let compiledHtml = $compile(html)($scope);

                    $element.html('');
                    console.log(compiledHtml);
                    $element.append(compiledHtml);
                }

            }
        };
    }]);

loadPluginCss({
    dark: 'plugins/happygears-netspyglass-datasource-dev/styles/theme.dark.css',
    light: 'plugins/happygears-netspyglass-datasource-dev/styles/theme.light.css'
});

export {
    NetSpyGlassDatasource as Datasource,
    NetSpyGlassQueryCtrl as QueryCtrl,
    GenericConfigCtrl as ConfigCtrl,
    GenericQueryOptionsCtrl as QueryOptionsCtrl,
    GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
