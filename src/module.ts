import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
// import { QueryEditorHelp } from './components/QueryEditorHelp';
import { ZSQuery, ZSDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, ZSQuery, ZSDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
// .setQueryEditorHelp(QueryEditorHelp);
