import { DataQueryError, DataQueryResponse, DataSourceInstanceSettings, TimeSeries } from '@grafana/data';
import { BackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';
import { ZSDataSourceOptions } from 'types';

export const FORMAT_JSON = 'json';
export const FORMAT_LIST = 'list';
export const FORMAT_TABLE = 'table';
export const FORMAT_TIME_SERIES = 'time_series';

export type ResponseFormat = typeof FORMAT_JSON | typeof FORMAT_LIST | typeof FORMAT_TABLE;

export type NSGQLTimeSeriesRow = {
  id: string;
  refId: string;
  triplet: string;
  varUnit: string;
  scale: string;
  tags?: string | Record<string, string>;
  prefix: string;
  range: string[];
  legend: string;
  legendEmbedded: string;
  target: string;
  variable: string;
  device: string;
  component: string;
  description: string;
  datapoints: Array<[number | null, number]>;
  dataFreshness: number;
  server: string;
  queryId: number;
  processingTimeMs: number;
  age: number;
};

export type NSGQLTimeSeries = Array<NSGQLTimeSeriesRow | { error: string; id?: string }>;
export type NSGQLResponseList = string[];
export type NSGQLResponseJSON<T> = {
  id: string;
  error?: string;
  status?: 'error' | string;
  dataFreshness: number;
  server: string;
  queryId: number;
  age: number;
  rows: T[];
};
export type NSGQLResponseTable = string[];
export class NSGQLApi {
  get dataUrl(): string {
    return `${this.instanceSettings.url}/v2/query/net/${this.instanceSettings.jsonData.networkId || 1}/data`;
  }

  get pingUrl(): string {
    return `${this.instanceSettings.url}/v2/ping/net/${this.instanceSettings.jsonData.networkId || 1}/test`;
  }

  static generateTarget<T extends { maxDataPoints?: number }>(
    nsgql: string,
    format: ResponseFormat = 'json',
    id = 'A',
    data?: T
  ) {
    return { ...data, nsgql, format, id };
  }

  static normalize(data: string | string[], format: ResponseFormat) {
    return (data = Array.isArray(data) ? data : ([data] as string[])).map((nsgql) =>
      NSGQLApi.generateTarget(nsgql, format)
    );
  }

  constructor(
    private instanceSettings: DataSourceInstanceSettings<ZSDataSourceOptions>,
    private backendService: BackendSrv
  ) {}

  public async ping() {
    return this._request(this.pingUrl, undefined, 'GET');
  }

  public async queryDataTable<T>(nsgql: string | string[]) {
    const list = NSGQLApi.normalize(nsgql, 'table').map((t, index) => ({
      ...t,
      id: String.fromCharCode('A'.charCodeAt(0) + index),
    }));
    return this.dataRequest<T>(list).then(({ data }) => data);
  }

  public async queryDataJSON<T>(nsgql: string | string[]) {
    const promise = this.dataRequest<Array<NSGQLResponseJSON<T>>>(NSGQLApi.normalize(nsgql, 'json')).then(
      ({ data }) => data
    );
    return promise;
  }

  public async queryDataList(nsgql: string | string[]) {
    const list = NSGQLApi.normalize(nsgql, 'list').map((t, index) => ({
      ...t,
      id: String.fromCharCode('A'.charCodeAt(0) + index),
    }));
    return this.dataRequest<string[]>(list).then(({ data }) => data);
  }

  public async dataRequest<T>(targets: Array<{ nsgql: string; format: ResponseFormat }>) {
    return this._request<T>(this.dataUrl, { targets }, 'POST');
  }

  public _request<T>(url: string, data: any, method: string) {
    if (this.instanceSettings.access === 'direct') {
      const { accessToken, useToken, addTokenToHeader } = this.instanceSettings.jsonData;
      const headers: Record<string, string> = {};
      const params: Record<string, string> = {};

      if (accessToken && useToken) {
        if (addTokenToHeader) {
          headers['X-NSG-Auth-API-Token'] = accessToken;
        } else {
          params['access_token'] = accessToken;
        }
      }

      return firstValueFrom(this.backendService.fetch<T>({ url, data, method, headers, params }));
    }

    return firstValueFrom(this.backendService.fetch<T>({ url, data, method }));
  }

  public async queryTimeSeries(
    targets: Array<{ id: string; nsgql: string; format: string }>
  ): Promise<DataQueryResponse> {
    return firstValueFrom(
      this.backendService.fetch<NSGQLTimeSeries>({
        url: this.dataUrl,
        method: 'POST',
        data: { targets },
      })
    ).then((response) => {
      if (response.status === 200) {
        const errors = this.proccessNsgQlErrors(
          response.data,
          targets.map(({ id }) => id)
        );
        return {
          data: response.data.filter((r) => !('error' in r)) as TimeSeries[],
          errors,
        };
      }

      return {
        data: [] as TimeSeries[],
      };
    });
  }

  private proccessNsgQlErrors<T>(rows: NSGQLTimeSeries, ids: string[]): DataQueryError[] {
    const goodRows = new Set(rows.filter((row) => !('error' in row)).map((row) => row.id));
    const errors = rows.filter((row) => 'error' in row).map(({ error, id }) => ({ message: error, refId: id }));

    if (errors.length) {
      return ids
        .map((refId) => {
          if (!goodRows.has(refId)) {
            const error = errors.shift();
            if (error) {
              return { refId: error?.refId || refId, message: error?.message };
            }
          }

          return;
        })
        .filter((row) => !!row);
    }

    return [];
  }
}
