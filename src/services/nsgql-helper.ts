import { escape, NSQLQuery, Operators } from './nsgql';
import { GrafanaVariables, QueryPrompts } from '../dictionary';
import * as utils from 'services/utils';
import _, { isNumber } from 'lodash';

import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import { ZSTargetColumn, ZSTargetTag, ZSTarget } from 'types';
import { TemplateSrv } from '@grafana/runtime';
import { AdHocVariableFilter, IntervalValues, QueryVariableModel, ScopedVars, TimeRange } from '@grafana/data';

export interface ZSQueryOptions {
  interval?: IntervalValues;
  timeRange?: TimeRange;
  scopedVars?: ScopedVars;
  adHoc?: AdHocVariableFilter[];
}

export interface UniversalTag {
  key: string;
  value: string | string[];
  operator: string;
  condition?: string;
}

export class NSGSqlHelper {
  constructor(public templateSrv: TemplateSrv) {}

  public columnsSQL(table: string) {
    return 'SELECT * FROM ' + escape(table) + ' LIMIT 0';
  }

  public variablesSQL() {
    return new NSQLQuery({
      select: ['*'],
      distinct: true,
      from: 'variables',
      where: [
        Operators.AND,
        {
          category: [Operators.NOT_EQ, ''],
        },
      ],
      orderBy: ['category'],
    }).compile();
  }

  public facetsSQL(from: string) {
    return new NSQLQuery({
      select: ['tagFacet'],
      distinct: true,
      from: from,
      orderBy: ['tagFacet'],
      where: [
        Operators.AND,
        {
          tagFacet: [Operators.NOT_NULL],
        },
      ],
    }).compile();
  }

  public getTagKeysForAdHocSQL() {
    return new NSQLQuery({
      select: ['facet'],
      from: 'tags',
      orderBy: ['facet'],
    }).compile();
  }

  public getTagValuesForAdHoc(tagFacet: string): [string, string] {
    return [
      new NSQLQuery({
        select: [tagFacet],
        distinct: true,
        from: 'devices',
        where: {
          [tagFacet]: [Operators.NOT_NULL],
        },
        orderBy: [tagFacet],
      }).compile(),
      new NSQLQuery({
        select: [tagFacet],
        distinct: true,
        from: 'interfaces',
        where: {
          [tagFacet]: [Operators.NOT_NULL],
        },
        orderBy: [tagFacet],
      }).compile(),
    ];
  }

  public suggestionSQL(type: string, from: string, tags: ZSTargetTag[] = [], scopedVars: ScopedVars = {}) {
    const query = new NSQLQuery().setDistinct(true).from(from).select([type]).orderBy([type]);

    switch (type) {
      case 'device':
      case 'component':
        query.where(this.generateWhereFromTags(tags, scopedVars));
        break;
      default:
        query.where([Operators.AND, { [type]: [Operators.NOT_NULL] }, this.generateWhereFromTags(tags, scopedVars)]);
        break;
    }

    return query.compile();
  }

  public generateWhereFromTags(tags: UniversalTag[], scopedVars: ScopedVars = {}) {
    let result: any = [];

    const updateOpertor = function (operator: string) {
      switch (operator) {
        case Operators.EQ:
          return Operators.IN;
        case Operators.NOT_EQ:
        case Operators.NOT_EQ2:
          return Operators.NOT_IN;
        default:
          return operator;
      }
    };

    // remove adHoc variables from where, because they are applied globally
    const adHocVariables = (this.templateSrv.getVariables() || [])
      .filter((el) => el.type === 'adhoc')
      .map((el) => el.name);

    if (adHocVariables.length) {
      tags = tags.filter((tag) => {
        const key = tag.key.replace(/^\$/, '');
        const value = (Array.isArray(tag.value) ? tag.value.join('') : '').replace(/^\$/, '');

        return adHocVariables.indexOf(key) === -1 && adHocVariables.indexOf(value) === -1;
      });
    }

    tags
      .map((t) => ({ ...t }))
      .forEach((tag) => {
        if (typeof tag.value === 'string' && tag.value && tag.value[0] === '$') {
          tag.value = this.getTemplateValue(tag.value, scopedVars);
          if (_.isArray(tag.value)) {
            if (tag.value.length === 1) {
              tag.value = tag.value[0];
            } else if (tag.value.length > 1) {
              tag.operator = updateOpertor(tag.operator);
            }
          }
        }

        const isPlaceholder = typeof tag.value === 'string' && utils.isEqCaseIns(tag.value, QueryPrompts.whereValue);

        if (!isPlaceholder) {
          if (tag.condition) {
            result.push(tag.condition);
          }

          if (_.isArray(tag.value)) {
            result.push({ [tag.key]: [tag.operator, ...tag.value] });
          } else {
            result.push({ [tag.key]: [tag.operator, tag.value] });
          }
        }

        if (isPlaceholder && [Operators.NOT_NULL, Operators.IS_NULL].includes(tag.operator as Operators)) {
          result.push({ [tag.key]: [tag.operator] });
        }
      });

    if (result.length) {
      result.unshift('AND');
      return result;
    }

    return null;
  }

  public generateSQLQuery(target: ZSTarget, options: ZSQueryOptions, useTemplates = false): string | null {
    let adHoc = null;
    let columns = _.isArray(target.columns) ? target.columns : [];
    const query = new NSQLQuery();
    const timeVar = useTemplates
      ? GrafanaVariables.timeFilter
      : { time: [Operators.BETWEEN, options.timeRange?.from, options.timeRange?.to] };

    if (options.adHoc && options.adHoc.length && !target.disableAdHoc) {
      adHoc = useTemplates
        ? GrafanaVariables.adHocFilter
        : this.generateWhereFromTags(options.adHoc, options.scopedVars);
    }

    if (columns.length) {
      columns = columns.filter((column) => !utils.isEqCaseIns(column.name, QueryPrompts.column));
    }

    if (columns.length === 0 || utils.isEqCaseIns(target.variable, QueryPrompts.variable)) {
      return null;
    }

    query.select(columns.map((column) => this.processColumn(column, true)));
    query.from(target.variable);
    query.where([Operators.AND, this.generateWhereFromTags(target.tags, options.scopedVars), adHoc, timeVar]);

    if (target.limit && isNumber(target.limit)) {
      query.limit(target.limit);
    }

    if (
      target.orderBy.column &&
      target.orderBy.column.value &&
      !utils.isEqCaseIns(target.orderBy.column.value, QueryPrompts.orderBy)
    ) {
      query.orderBy([
        `${NSQLQuery.escape(target.orderBy.column.alias || target.orderBy.column.value)} ${target.orderBy.sort}`,
      ]);
    } else {
      query.orderBy([]);
    }

    if (target.groupBy.value && target.groupBy.value.toLowerCase() !== QueryPrompts.groupBy.toLowerCase()) {
      query.groupBy([this.generateGroupByValue(target, options, useTemplates)]);
    } else {
      query.groupBy([]);
    }

    return query.compile();
  }

  public replaceVariables(sql: string, scopedVars: ScopedVars = {}) {
    const varRegexp = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
    const isRegExp = /REGEXP['"\s]+$/gi;
    let result;

    while ((result = varRegexp.exec(sql))) {
      const [name] = result;
      // We do not want replace private variables
      if (/^\$_/.test(name)) {
        continue;
      }

      let variable: string | string[] = this.getTemplateValue(name, scopedVars);

      // We do not want replace variables with value that store in Grafana private variables
      // Corner case #NET-2824
      if (typeof variable === 'string' && /^\$_/.test(variable)) {
        continue;
      }

      if (variable) {
        let quote = sql.substring(result.index - 1, result.index);
        let hasQuotes = /['"]{1}/.test(quote);

        if (!_.isArray(variable)) {
          variable = [variable];
        }

        if (isRegExp.test(sql.substring(0, result.index))) {
          variable = variable.join('|');
        } else {
          variable = hasQuotes ? variable.join(`${quote}, ${quote}`) : variable.join(`, `);
        }

        sql = sql.replace(name, variable);
      }
    }

    return sql;
  }

  public generateSQLQueryFromString(target: ZSTarget, options: ZSQueryOptions) {
    const timeFilter = `time BETWEEN '${options.timeRange?.from}' AND '${options.timeRange?.to}'`;
    const interval = `${options.interval}`;
    const adhocWhere = NSQLQuery.buildWhere(this.generateWhereFromTags(options.adHoc || [], options.scopedVars));

    let query = this.replaceVariables(target.nsgqlString as string, options.scopedVars);

    if (query && query.indexOf(GrafanaVariables.timeFilter) > 0) {
      query = _.replace(query, GrafanaVariables.timeFilter, timeFilter);
    }

    if (query && query.indexOf(GrafanaVariables.adHocFilter) > 0) {
      const adhocString = adhocWhere ? `( ${adhocWhere} )` : '';

      query = _.replace(query, GrafanaVariables.adHocFilter, adhocString);
    }

    if (query && query.indexOf(GrafanaVariables.interval) > 0) {
      query = _.replace(query, GrafanaVariables.interval, interval);
    }

    query = this.removeExtraConditionStatements(query);

    return query;
  }

  public generateGroupByValue(target: ZSTarget, options: ZSQueryOptions, useTemplates = false) {
    switch (target.groupBy.type) {
      case 'time':
        const groupByValue =
          target.groupBy.value === GrafanaVariables.interval && !useTemplates ? options.interval : target.groupBy.value;
        return `time(${groupByValue})`;

      default:
      case 'column':
        return target.groupBy.value;
    }
  }

  public correctAdhoc(adhocFilters: AdHocVariableFilter[]) {
    return adhocFilters.map((el) => {
      switch (el.operator) {
        case '=~':
          el.operator = Operators.REGEXP;
          break;
        case '!~':
          el.operator = Operators.NOT_REGEXP;
          break;
      }

      return el;
    });
  }

  public removeExtraConditionStatements(query: string) {
    return query
      .replace(/\s+(and)\s+and\s+/gi, ' $1 ')
      .replace(/\s+(or)\s+or\s+/gi, ' $1 ')
      .replace(/\s+((and|or)[\s]+)(group|order|limit)\s+/gi, ' $3 ')
      .replace(/\s+(where)[\s]+(and|or)\s+/gi, ' $1 ');
  }

  public processColumn(column: Omit<ZSTargetColumn, 'id'> | string, needToCreateAliases = false) {
    if (isString(column)) {
      return column;
    }

    if (isObject(column) && !Array.isArray(column)) {
      let columnName = utils.compileColumnName(column);

      if (column.alias) {
        columnName += ` as ${NSQLQuery.escape(column.alias)}`;
      } else if (needToCreateAliases) {
        let alias = utils.compileColumnAlias(column);
        if (alias !== columnName) {
          columnName += ` as ${NSQLQuery.escape(alias)}`;
        }
      }

      return columnName;
    }

    throw new Error('Unknow column type!');
  }

  private getTemplateValue(str: string, scopedVars: ScopedVars): string | string[] {
    const name = str.substring(1);

    if (name in scopedVars) {
      return scopedVars[name]?.value;
    }

    const variable = _.find(this.templateSrv.getVariables() as QueryVariableModel[], { name });

    if (variable) {
      const value = variable.current.value;
      const allValue =
        variable.includeAll &&
        ((typeof value === 'string' && value === GrafanaVariables.allValue) ||
          (Array.isArray(variable.current.value) && variable.current.value.includes(GrafanaVariables.allValue)));

      if (allValue) {
        return ((variable.options || []) as Array<{ text: string; value: string }>).map(({ value }) => value);
      }

      return _.cloneDeep(variable.current.value);
    }

    return str;
  }
}
