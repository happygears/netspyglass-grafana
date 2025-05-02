import { QueryEditorProps } from '@grafana/data';
import { DataSource } from 'datasource';
import { ZSDataSourceOptions, ZSQuery } from 'types';

export type EditorProps = QueryEditorProps<DataSource, ZSQuery, ZSDataSourceOptions>;

export interface ListOption {
  label: string;
  value: string;
}

export interface ListOptionTree {
  label: string;
  value: string;
  items?: ListOptionTree[];
}
