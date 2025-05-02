export const QueryPrompts = {
  category: 'Select Category',
  variable: 'Select Variable',
  column: 'Select Column',
  device: 'Select Device',
  component: 'Select Cmponent',
  groupByType: 'Select Type',
  groupBy: 'Select Value',
  orderBy: 'Select Value',
  selectItem: 'Select Item',
  whereValue: 'Select Value',
  removeTag: '-- Remove Tag Filter --',
  clearSelection: '-- Clear Selection --',
  blankDropDownElement: '---',
};

export const QueryHints = {
  variable: 'Select Monitoring Variable',
  select: 'Click `+` to add column. Drag-n-drop columns to reorder. Click menu to add functions and column alias.',
  groupBy: `Choose column to group alias by. Grouped values are passed as arguments to aggregation functions used with columns in SELECT. You can group by a column that does not appear in SELECT.`,
  limit: `Restrict number of time series returned by this query. Limit is applied after sorting. If this field is empty, result is unrestricted, however the server may apply its own restriction to avoid sending thousands of time series to Grafana`,
  alias: `You can use '$device', '$component', '$description', or a tag facet name in 'Alias by' field`,
  regex: 'Enter regex using format ^.*$',
};

export const QueryPlaceholders = {
  alias: 'Naming pattern',
};

export const GrafanaVariables = {
  timeFilter: '$_timeFilter',
  interval: '$_interval',
  adHocFilter: '$_adhoc',
  allValue: '$__all',
};

export const groupByTimeTags = [
  {
    label: GrafanaVariables.interval,
    value: GrafanaVariables.interval,
  },
  {
    label: '1s',
    value: '1s',
  },
  {
    label: '1m',
    value: '1m',
  },
  {
    label: '1h',
    value: '1h',
  },
  {
    label: '1d',
    value: '1d',
  },
];

export const PredefinedColumns = [
  { label: 'address', value: 'address' },
  { label: 'boxDescr', value: 'boxDescr' },
  { label: 'combinedRoles', value: 'combinedRoles' },
  { label: 'combinedNsgRoles', value: 'combinedNsgRoles' },
  { label: 'component', value: 'component' },
  { label: 'device', value: 'device' },
  { label: 'description', value: 'description' },
  { label: 'discoveryTime', value: 'discoveryTime' },
  { label: 'freshness', value: 'freshness' },
  { label: 'metric', value: 'metric' },
  { label: 'name', value: 'name' },
  { label: 'time', value: 'time' },
  { label: 'stale', value: 'stale' },
];

export const TransformationFuncs = [
  {
    label: 'Transformation',
    options: [
      { label: 'to_long', value: 'to_long' },
      { label: 'ifnan', value: 'ifnan' },
      { label: 'ifnull', value: 'ifnull' },
    ],
  },

  {
    label: 'Aggregation',
    options: [
      { label: 'avg', value: 'avg' },
      { label: 'median', value: 'median' },
      { label: 'min', value: 'min' },
      { label: 'max', value: 'max' },
      { label: 'sum', value: 'sum' },
      { label: 'count', value: 'count' },
    ],
  },
  {
    label: 'Aggregation By Time',
    options: [
      { label: 'tslast', value: 'tslast' },
      { label: 'tsmin', value: 'tsmin' },
      { label: 'tsmax', value: 'tsmax' },
      { label: 'tsavg', value: 'tsavg' },
      { label: 'tsmedian', value: 'tsmedian' },
      { label: 'tspercentile95', value: 'tspercentile95' },
      { label: 'tslinear', value: 'tslinear' },
      { label: 'sma', value: 'sma' },
      { label: 'cumulative_sum', value: 'cumulative_sum' },
      { label: 'loess', value: 'loess' },
    ],
  },
];
