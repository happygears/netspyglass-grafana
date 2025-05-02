import cloneDeep from 'lodash/cloneDeep';

export interface SQLBuilderOptions {
  from: string;
  select: string[];
  distinct?: boolean;
  where?: SQLBuilderWhere;
  orderBy?: string[];
  groupBy?: string[];
  limit?: [number, number];
}

// todo: declare where type
export type SQLBuilderWhere = any;
export enum Operators {
  AND = 'AND',
  OR = 'OR',
  IN = 'IN',
  NOT_IN = 'NOT IN',
  EQ = '=',
  NOT_EQ = '<>',
  LT = '<',
  LTE = '<=',
  GT = '>',
  GTE = '>=',
  NOT_EQ2 = '!=',
  REGEXP = 'REGEXP',
  NOT_REGEXP = 'NOT REGEXP',
  IS_NULL = 'ISNULL',
  NOT_NULL = 'NOTNULL',
  MATCH_IP = '_ABSTRACT_OPERATOR_IP_MATCH',
  MATCH_IP_SUBNET = '<<',
  BETWEEN = 'BETWEEN',
  LIKE = 'LIKE',
}

function orderByEscaper(orderBy: string[]) {
  return orderBy.map((value) => {
    const chunks = value.split(' ');

    if (chunks.length > 1) {
      const direction = chunks[chunks.length - 1];
      const orderTarget = chunks.slice(0, chunks.length - 1).join(' ');
      return `'${orderTarget}' ${direction}`;
    }

    return `'${value}'`;
  });
}

export class NSQLQuery {
  options: SQLBuilderOptions;

  static isOperand(el: unknown) {
    if (typeof el !== 'string') {
      return false;
    }

    return el in Operators;
  }

  static proccessMultiOperand(where: unknown[], idx: number, multiOperand: boolean, baseString: string) {
    if (multiOperand && where.length > idx + 1) {
      let localOperand = NSQLQuery.isOperand(where[idx + 1]) ? where[idx + 1] : 'AND';
      return `${baseString} ${localOperand}`;
    } else {
      return `${baseString}`;
    }
  }

  static escape(value: string) {
    // ... all symbols that don't match with the allowed pattern will be replaced with _
    return value.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  constructor(options?: SQLBuilderOptions) {
    this.options = options || {
      select: [],
      from: '',
    };
  }

  setOptions(options: SQLBuilderOptions): void {
    this.options = options;
  }

  setDistinct(value: boolean): this {
    this.options.distinct = value;
    return this;
  }

  distinct(): this {
    this.options.distinct = true;
    return this;
  }

  select(columns: string[], append = false): this {
    if (append) {
      this.options.select.push(...columns);
    } else {
      this.options.select = columns;
    }

    return this;
  }

  from(from: string): this {
    this.options.from = from;
    return this;
  }

  where(where: SQLBuilderWhere): this {
    this.options.where = where;
    return this;
  }

  orderBy(value: string | string[]): this {
    const orderBy = this.options.orderBy || [];

    if (typeof value === 'string') {
      orderBy.push(value);
    }

    this.options.orderBy = value as string[];

    return this;
  }

  groupBy(value: string[]): this {
    const groupBy = this.options.groupBy || [];

    if (typeof value === 'string') {
      groupBy.push(value);
    }

    this.options.groupBy = value as string[];

    return this;
  }

  limit(limit: number, offset = 0): this {
    // in case we get a zero limit, removes the need to check a prop value
    if (limit === 0) {
      return this;
    }
    this.options.limit = [limit, offset];
    return this;
  }

  compile(): string {
    const sql: string[] = [];
    const { select, from, distinct = false, groupBy, limit, orderBy, where } = this.options;

    sql.push('SELECT');

    if (distinct) {
      sql.push('DISTINCT');
    }

    if (select) {
      sql.push(this.options.select.join(','));
    }

    if (from) {
      sql.push('FROM', this.options.from);
    }

    if (where) {
      const condition = NSQLQuery.buildWhere(where);

      if (condition) {
        sql.push('WHERE', condition);
      }
    }

    if (groupBy && groupBy.length) {
      sql.push(`GROUP BY ${groupBy.join(', ')}`);
    }

    if (orderBy && orderBy.length) {
      sql.push(`ORDER BY ${orderByEscaper(orderBy).join(', ')}`);
    }

    if (limit && limit.length) {
      sql.push(`LIMIT ${limit.join(', ')}`);
    }

    return sql.join(' ');
  }

  static buildWhere(whereCondition: SQLBuilderWhere | null | undefined): string {
    if (whereCondition === null || whereCondition === undefined) {
      return '';
    }

    const sql: string[] = [];
    let where = cloneDeep(whereCondition);
    let operand = Operators.AND;
    let multiOperand =
      Array.isArray(where) &&
      where.reduce((result, el) => {
        return NSQLQuery.isOperand(el) ? result + 1 : result;
      }, 0) > 1;

    const WITH_BRACKETS = [Operators.IN, Operators.NOT_IN];

    if (Array.isArray(where) && where.length === 0) {
      return '';
    }

    if (!Array.isArray(where) && typeof where === 'object') {
      where = [operand, where];
    }

    if (where.length >= 2) {
      operand = where[0];
      where = where.splice(1);

      (where as any[]).forEach((wherePart: unknown, idx) => {
        if (Array.isArray(wherePart)) {
          sql.push(`(${NSQLQuery.buildWhere(wherePart)})`);
        } else if (typeof wherePart === 'object') {
          for (const key in wherePart) {
            let operator: Operators = Operators.EQ;
            let value = (wherePart as Record<string, SQLBuilderWhere | string>)[key];

            if (Array.isArray(value)) {
              operator = value[0].toUpperCase();
              value = value.slice(1);

              if (operator === Operators.BETWEEN) {
                const result: string = value.reduce((current: string, item: string) => {
                  if (current.length) {
                    current += ` ${Operators.AND} `;
                  }
                  return current + `'${item}'`;
                }, '');

                value = result;
              } else if (operator === Operators.MATCH_IP) {
                const joinString = value.reduce(function (current: string, item: string) {
                  const op = item.indexOf('/') === -1 ? Operators.EQ : Operators.MATCH_IP_SUBNET;

                  if (current.length) {
                    current += ` ${Operators.OR} `;
                  }

                  return current + `${key} ${op} '${item}'`;
                }, '');

                sql.push(joinString);
                return;
              } else if (operator === Operators.NOT_NULL) {
                // `${key} ${Operators.NOT_NULL}`
                sql.push(NSQLQuery.proccessMultiOperand(where, idx, multiOperand, `${key} ${operator}`));

                return;
              } else if (operator === Operators.IS_NULL) {
                // `${key} ${Operators.IS_NULL}`
                sql.push(NSQLQuery.proccessMultiOperand(where, idx, multiOperand, `${key} ${operator}`));

                return;
              } else if (WITH_BRACKETS.indexOf(operator) !== -1) {
                if (Array.isArray(value) && Array.isArray(value[0])) {
                  value = value[0];
                }
                if (typeof value[0] === 'number') {
                  value = `(${value.join(', ')})`;
                } else {
                  value = `('${value.join("', '")}')`;
                }
              } else {
                value = `'${value}'`;
              }
            } else {
              if (isNaN(value)) {
                value = `'${value}'`;
              } else {
                value = `${value}`;
              }
            }
            sql.push(NSQLQuery.proccessMultiOperand(where, idx, multiOperand, `${key} ${operator} ${value}`));
            // sql.push(`${key} ${operator} ${value}`);
          }
        } else if (typeof wherePart === 'string') {
          // sql.push(wherePart);
          if (!(multiOperand && NSQLQuery.isOperand(wherePart))) {
            sql.push(wherePart);
          }
        }
      });

      if (!multiOperand) {
        return sql.join(` ${operand} `);
      } else {
        return sql.join(' ');
      }
    } else if (where.length === 1) {
      where = [];
    }

    return where.join(` ${operand} `);
  }
}
