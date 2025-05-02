import { getBackendSrv, isFetchError, getTemplateSrv } from '@grafana/runtime';
import {
  CoreApp,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  LegacyMetricFindQueryOptions,
  DataSourceGetTagValuesOptions,
} from '@grafana/data';

import { ZSQuery, ZSDataSourceOptions, ZSTarget } from './types';
import { NSGQLApi, NSGQLTimeSeriesRow } from 'services/nsgql';
import { NSGSqlHelper } from 'services/nsgql-helper';
import { Dictionary, groupBy } from 'lodash';
import { ZSVariable as ZSVariable } from 'services/nsgql/response-models';
import { QueryPrompts } from 'dictionary';
import * as utils from './services/utils';

export class DataSource extends DataSourceApi<ZSQuery, ZSDataSourceOptions> {
  zsApi!: NSGQLApi;
  zsHelper!: NSGSqlHelper;
  templateService = getTemplateSrv();

  constructor(instanceSettings: DataSourceInstanceSettings<ZSDataSourceOptions>) {
    super(instanceSettings);
    this.zsApi = new NSGQLApi(instanceSettings, getBackendSrv());
    this.zsHelper = new NSGSqlHelper(this.templateService);
  }

  public getSQLString(target: ZSTarget) {
    return this.zsHelper.generateSQLQuery(target, {}, true) || '';
  }

  /**
   * This is where ALIAS BY substitution happens
   * TODO: should be moved out
   */
  private getSeriesName(item: NSGQLTimeSeriesRow, alias: string) {
    const regex = /\$(\w+)|\[\[([\s\S]+?)]]/g;

    alias = this.templateService.replace(alias);

    return alias.replace(regex, function (match: string, ...args) {
      const group = args[0] || args[1];

      if (!group) {
        return match;
      }

      switch (group) {
        case 'm':
        case 'measurement':
        case 'variable':
          return item.variable;
        case 'device':
          return item.device;
        case 'component':
          return item.component;
        case 'description':
          return item.description;
      }

      if (item[group as keyof NSGQLTimeSeriesRow]) {
        return item[group as keyof NSGQLTimeSeriesRow] as string;
      }

      if (typeof item.tags === 'object' && item.tags && item.tags[group]) {
        return item.tags[group];
      }

      return match;
    });
  }

  public async getNSGVariables() {
    return this.zsApi
      .queryDataJSON<ZSVariable>(this.zsHelper.variablesSQL())
      .then((response): Dictionary<ZSVariable[]> => {
        const value = Array.isArray(response) && response[0];

        if (value) {
          return groupBy(value.rows, 'category');
        }

        return {};
      })
      .catch(() => ({} as Dictionary<ZSVariable[]>));
  }

  public async getTagsFacets(variable: string) {
    return this.zsApi.queryDataList(this.zsHelper.facetsSQL(variable)).catch(() => []) as Promise<string[]>;
  }

  public async getSuggestions(variable: string, type: string) {
    return this.zsApi.queryDataList(this.zsHelper.suggestionSQL(type, variable, [], {}));
  }

  // Here specified methods which use by Grafana
  public getDefaultQuery(_: CoreApp): Partial<ZSQuery> {
    return {
      _nsgTarget: utils.getDefaultTarget(),
    };
  }

  public filterQuery(query: ZSQuery): boolean {
    const target = query._nsgTarget;

    if (!target) {
      return false;
    }

    // variable is empty
    if (utils.isEqCaseIns(target.variable, QueryPrompts.variable)) {
      return false;
    }

    const columns = (target.columns || []).filter((col) => !utils.isEqCaseIns(col.name, QueryPrompts.column));
    if (columns.length === 0) {
      return false;
    }

    return true;
  }

  public async query(options: DataQueryRequest<ZSQuery>): Promise<DataQueryResponse> {
    const { targets, rangeRaw } = options;
    const timeRange = {
      from: utils.getTime(rangeRaw?.from, false),
      to: utils.getTime(rangeRaw?.to, true),
    };

    const aliases: Record<string, string> = {};
    const adhocFilters = this.zsHelper.correctAdhoc(options.filters || []);

    // this variable is used for building "raw" query in the getSQLString method
    const queryOptions = {
      timeRange,
      interval: options.interval,
      adHoc: adhocFilters,
      scopedVars: options.scopedVars,
    };

    const sqlTargets = targets
      .filter(({ hide }) => !hide)
      .map(({ _nsgTarget: target, refId }: ZSQuery) => {
        if (!target) {
          throw new Error('Empty target: ' + refId);
        }

        let maxDataPoints =
          options.maxDataPoints && target.format === 'time_series' ? options.maxDataPoints : undefined;

        aliases[refId] = target.alias;

        if (target.orderBy && target.orderBy.column?.name === 'column') {
          target.orderBy.column.value = target.orderBy.colValue;
        }

        let nsgql: string = target.rawQuery
          ? this.zsHelper.generateSQLQueryFromString(target, queryOptions as any)
          : (this.zsHelper.generateSQLQuery(target, queryOptions as any) as string);

        nsgql = this.templateService.replace(nsgql, options.scopedVars, utils.variableFormatter);

        return {
          id: refId,
          format: target.format,
          nsgql,
          maxDataPoints,
        };
      })
      .filter(({ nsgql }) => Boolean(nsgql));

    if (sqlTargets.length === 0) {
      return Promise.resolve({ data: [] });
    }

    return this.zsApi.queryTimeSeries(sqlTargets).then((result) => {
      (result.data as NSGQLTimeSeriesRow[]).forEach((item) => {
        item.refId = item.id;
        const alias = aliases[item.id.toUpperCase()];
        if (!item || !alias) {
          return;
        }

        item.target = this.getSeriesName(item, alias);
        delete item.tags; // needs to remove tags from data because start from v7 tags are rendered as part of the legend
      });

      return result;
    });
  }

  // For loading AdHocTags
  public async getTagKeys() {
    return this.zsApi
      .queryDataList(this.zsHelper.getTagKeysForAdHocSQL())
      .then((list) => list.map((item) => ({ text: item })))
      .then((data) => ({ data }));
  }

  // For loading AdHocTagValues for specific tag
  public async getTagValues(options: DataSourceGetTagValuesOptions) {
    const nsgqlQueries = this.zsHelper.getTagValuesForAdHoc(options.key);
    return this.zsApi
      .queryDataList(nsgqlQueries)
      .then((list) => Array.from(new Set(list)).map((item) => ({ text: item })))
      .then((data) => ({ data }));
  }

  // For loading Variables
  public async metricFindQuery(query: string, options: LegacyMetricFindQueryOptions) {
    return this.zsApi
      .queryDataList(this.templateService.replace(query, {}, utils.variableFormatter))
      .then((data) => data.map((text) => ({ text })))
      .catch(() => [] as []);
  }

  public async testDatasource() {
    const defaultErrorMessage = 'Cannot connect to API';
    try {
      const response = await this.zsApi.ping();
      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Success',
        };
      } else {
        return {
          status: 'error',
          message: response.statusText ? response.statusText : defaultErrorMessage,
        };
      }
    } catch (err) {
      let message = '';
      if (typeof err === 'string') {
        message = err;
      } else if (isFetchError(err)) {
        message = 'Fetch error: ' + (err.statusText ? err.statusText : defaultErrorMessage);
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message;
        }
      } else {
        message = `[${defaultErrorMessage}]` + ': ' + String(err).replace('TypeError: ', '');
      }

      return {
        status: 'error',
        message,
      };
    }
  }
}
