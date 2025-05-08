import { QueryPrompts } from 'dictionary';
import isArray from 'lodash/isArray';

import { dateMath, dateTime, DateTime } from '@grafana/data';
import { merge, uniqueId } from 'lodash';
import { ZSTarget, ZSTargetColumn } from 'types';
import { UNIQ_PREFIXES } from './constants';

export function isEqCaseIns(s1: string, s2: string) {
  return String(s1).toLowerCase() === String(s2).toLowerCase();
}

export function getTime(date?: string | DateTime | Date | null, roundUp = false) {
  if (!date) {
    return dateTime('now');
  }

  if (typeof date === 'string') {
    if (date === 'now') {
      return `now`;
    }

    const parts = /^now-(\d+)([d|h|m|s])$/.exec(date);
    if (parts) {
      const amount = parseInt(parts[1], 10);
      const unit = parts[2];
      return `now-${amount}${unit}`;
    }

    return dateMath.toDateTime(date, { roundUp })?.valueOf();
  }

  return date.valueOf();
}

/**
 * compileColumnAlias - return the column name wrapped by a function when column has appliedFunctions, else return only column name
 */
export function compileColumnName(column: Omit<ZSTargetColumn, 'id'>) {
  let columnName = column.name;

  if (column.appliedFunctions && isArray(column.appliedFunctions) && column.appliedFunctions.length) {
    columnName = `${column.appliedFunctions.map((func) => func.name).join('(')}(${columnName}${')'.repeat(
      column.appliedFunctions.length
    )}`;
  }

  return columnName;
}

export function compileColumnAlias(column: Omit<ZSTargetColumn, 'id'>) {
  let columnName = column.name;

  if (column.appliedFunctions && isArray(column.appliedFunctions) && column.appliedFunctions.length) {
    columnName = `${column.appliedFunctions.map((func) => func.name).join('_')}_${columnName}`;
  }

  return columnName;
}

// Returns only changes object which should apply to lodash merge
export function normalizeTarget(target: ZSTarget): Partial<ZSTarget> | null {
  if (target.format === 'time_series') {
    const changes: Partial<ZSTarget> = {};
    const columns: ZSTargetColumn[] = [];

    if (!('isMultiColumnMode' in target)) {
      changes.isMultiColumnMode = true;
    }

    if (!target.columns.find(({ name }) => name === 'time')) {
      columns.push({ name: 'time', visible: true, id: uniqueId(UNIQ_PREFIXES.columnId) });
    }

    if (!target.columns.find(({ name }) => name === 'metric')) {
      columns.push({
        id: uniqueId(UNIQ_PREFIXES.columnId),
        name: 'metric',
        visible: true,
        appliedFunctions: [{ name: 'tsavg' }],
      });
    }

    if (target.groupBy.value === QueryPrompts.groupBy && target.groupBy.type === QueryPrompts.groupByType) {
      changes.groupBy = {
        ...target.groupBy,
        type: 'time',
        value: '$_interval',
      };
    }

    if (columns.length) {
      changes.columns = [...target.columns].concat(columns);
    }

    if (Object.keys(changes).length) {
      return changes;
    }
  }

  return null;
}

export function variableFormatter(varValue: string[] | string) {
  if (Array.isArray(varValue)) {
    if (varValue.length === 1) {
      varValue = varValue[0];
    } else {
      return `${varValue.join("', '")}`;
    }
  }

  return varValue;
}

export function getDefaultTarget(overrides: Partial<ZSTarget> = {}): ZSTarget {
  return merge(
    {
      type: 'nsgql',
      columns: [
        { name: 'time', visible: false, id: uniqueId(UNIQ_PREFIXES.columnId) },
        { name: 'metric', appliedFunctions: [{ name: 'tsavg' }] },
      ],
      variable: QueryPrompts.variable,
      orderBy: {
        column: {
          name: '',
          value: '',
          alias: '',
        },
        sort: 'ASC',
        colName: QueryPrompts.orderBy,
        colValue: QueryPrompts.orderBy,
      },
      rawQuery: 0,
      alias: '',
      limit: null,
      tags: [],
      groupBy: {
        type: QueryPrompts.groupByType,
        value: QueryPrompts.groupBy,
      },
      isSeparatedColumns: false,
      disableAdHoc: false,
      format: 'time_series',
    },
    overrides
  );
}

// class Timer {
//   constructor() {
//     this._run = false;
//     this._nextTask = null;
//     this._currentTask = null;
//   }

//   /**
//    * @param {Function} task
//    */
//   sheduleTask(task) {
//     if (this._run === false) {
//       this._run = true;
//       this._currentTask = task;
//       task();
//     } else {
//       this._nextTask = task;
//     }
//   }

//   stop() {
//     this._taskEnd();
//   }

//   _taskEnd() {
//     if (this._nextTask) {
//       this._nextTask();
//       this._currentTask = this._nextTask;
//       this._nextTask = null;
//     } else {
//       this._currentTask = null;
//       this._run = false;
//     }
//   }
// }

// export default {
//     getTime: function (date: string | DateTime | Date | null, roundUp: boolean) {
//       if (typeof date === "string") {
//         if (date === 'now') {
//           return `now`;
//         }
//         const parts = /^now-(\d+)([d|h|m|s])$/.exec(date);
//         if (parts) {
//           const amount = parseInt(parts[1]);
//           const unit = parts[2];
//           return `now-${amount}${unit}`;
//         }
//         date = dateMath.parse(date, roundUp);
//       }
//       return date.valueOf();
//     },
/**
 * compileColumnAlias - return alias when column has appliedFunctions, else return column name
 */
//   getScheduler: function () {
//     if (!this._timer) {
//       this._timer = new Timer();
//     }
//     return this._timer;
//   },
// };
