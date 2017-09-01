
const QueryPrompts = {
    category: 'select category',
    variable: 'select variable',
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
};

const GrafanaVariables = {
    timeFilter: '$_timeFilter',
    interval: '$_interval'
};

export {
    QueryPrompts,
    GrafanaVariables
};