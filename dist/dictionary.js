'use strict';

System.register([], function (_export, _context) {
    "use strict";

    var QueryPrompts, GrafanaVariables;
    return {
        setters: [],
        execute: function () {
            _export('QueryPrompts', QueryPrompts = {
                category: 'select category',
                variable: 'select variable',
                column: 'select column',
                device: 'select device',
                component: 'select component',
                groupByType: 'select type',
                groupBy: 'select value',
                orderBy: 'select value',
                selectItem: 'select item',
                whereValue: 'select value',
                removeTag: '-- remove tag filter --',
                clearSelection: '-- clear selection --',
                blankDropDownElement: '---'
            });

            _export('GrafanaVariables', GrafanaVariables = {
                timeFilter: '$_timeFilter',
                interval: '$_interval',
                adHocFilter: '$_adhoc'
            });

            _export('QueryPrompts', QueryPrompts);

            _export('GrafanaVariables', GrafanaVariables);
        }
    };
});
