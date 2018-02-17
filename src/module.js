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
import DropdownDirective from './directives/dropdown';
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
    .directive('hgDropdown', DropdownDirective);

loadPluginCss({
    dark: `plugins/${NSG_PLUGIN_ID}/styles/theme.dark.css`,
    light: `plugins/${NSG_PLUGIN_ID}/styles/theme.light.css`
});

export {
    NetSpyGlassDatasource as Datasource,
    NetSpyGlassQueryCtrl as QueryCtrl,
    GenericConfigCtrl as ConfigCtrl,
    GenericQueryOptionsCtrl as QueryOptionsCtrl,
    GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
