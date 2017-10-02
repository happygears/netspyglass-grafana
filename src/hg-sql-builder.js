"use strict";

class SQLBuilder {
  constructor(options = {}) {
    this.setOptions(options);
  }

  setOptions(options) {
    this.options = angular.extend({
      distinct: false,
      select: [],
      from: false,
      where: false,
      orderBy: [],
      groupBy: [],
      limit: []
    }, options);

    return this;
  }

  getOptions() {
    return this.options;
  }

  setDistinct(value = false) {
    this.options.distinct = value;
    return this;
  }

  select(columns = []) {
    this.options.select = columns;
    return this;
  }

  from(from) {
    this.options.from = from;
    return this;
  }

  where(where = []) {
    this.options.where = where;
    return this;
  }

  orderBy(order) {
    this.options.orderBy.push(order);
    return this;
  }

  groupBy(group) {
    this.options.groupBy = [group];
    return this;
  }

  limit(limit, offset = 0) {
    this.options.limit = [limit, offset];
    return this;
  }

  clearLimit() {
    this.options.limit = 0;
    return this;
  }

  clearGroupBy() {
    this.options.groupBy = [];
    return this;
  }

  clearOrderBy() {
    this.options.orderBy = [];
    return this;
  }

  compile() {
    let sql = [];

    if (this.options.distinct || this.options.select.length) {
      sql.push('SELECT');
    }

    if (this.options.distinct) {
      sql.push('DISTINCT');
    }

    if (this.options.select.length) {
      sql.push(this.options.select.join(','));
    }

    if (this.options.from) {
      sql.push('FROM', this.options.from);
    }

    if (this.options.where) {
      sql.push('WHERE');
      sql.push(SQLBuilder.buildWhere(this.options.where));
    }

    if (this.options.groupBy.length) {
      sql.push(`GROUP BY ${this.options.groupBy.join(', ')}`)
    }

    if (this.options.orderBy.length) {
      sql.push(`ORDER BY ${this.options.orderBy.join(', ')}`)
    }

    if (this.options.limit.length) {
      sql.push(`LIMIT ${this.options.limit.join(', ')}`)
    }

    return sql.join(' ');
  }

  static isOperand(el) {
    if( typeof el !== 'string' ) return false;
    return !!SQLBuilder.OPERATORS[el];
  }
}

SQLBuilder.buildWhere = function (where) {
    if (where === null || where === undefined) return;

    let sql = [];
    let operand = SQLBuilder.OPERATORS.AND;
    let multiOperand = Array.isArray(where) && where.reduce((result,el) => {
            return SQLBuilder.isOperand(el) ? result + 1 : result;
        },0) > 1;

    const WITH_BRACKETS = [
        SQLBuilder.OPERATORS.IN,
        SQLBuilder.OPERATORS.NOT_IN
    ];

    if (!angular.isArray(where) && angular.isObject(where)) {
        where = [operand, where];
    }

    if (where.length >= 2) {
        operand = where[0];
        where = where.splice(1);

        where.forEach((wherePart, idx) => {
            if (angular.isArray(wherePart)) {
                sql.push(`(${this.buildWhere(wherePart)})`);
            } else if (angular.isObject(wherePart)) {
                angular.forEach(wherePart, function (value, key) {
                    let operator = '=';

                    if (angular.isArray(value)) {
                        operator = value[0].toUpperCase();
                        value = value.slice(1);

                        if(operator === SQLBuilder.OPERATORS.BETWEEN) {
                            let result;

                            result = value.reduce( (current, item) => {
                                if (current.length) {
                                    current += ` ${SQLBuilder.OPERATORS.AND} `;
                                }
                                return current + `'${item}'`;
                            }, '');

                            value = result;

                        } else if (operator === SQLBuilder.OPERATORS.MATCH_IP) {
                            let joinString;

                            joinString = value.reduce(function (current, item) {
                                let op;

                                op = item.indexOf('/') === -1
                                    ? SQLBuilder.OPERATORS.EQ
                                    : SQLBuilder.OPERATORS.MATCH_IP_SUBNET;


                                if (current.length) {
                                    current += ` ${SQLBuilder.OPERATORS.OR} `;
                                }

                                return current + `${key} ${op} '${item}'`;
                            }, '');

                            sql.push(joinString);
                            return;
                        } else if (operator === SQLBuilder.OPERATORS.NOT_NULL) {
                            sql.push(`${key} ${SQLBuilder.OPERATORS.NOT_NULL}`);
                            return;
                        } else if (WITH_BRACKETS.indexOf(operator) !== -1) {
                            value = `('${value.join('\', \'')}')`;
                        } else {
                            if(Array.isArray(value)) value = value[0];

                            value = value.indexOf('$') === 0 ? `${value}` : `'${value}'`;
                        }
                    } else {
                        value = `'${value}'`;
                    }


                    if(multiOperand && where.length > idx+1) {
                        let localOperand = SQLBuilder.isOperand(where[idx+1]) ? where[idx+1] : 'AND';
                        sql.push(`${key} ${operator} ${value} ${localOperand}`)
                    } else {
                        sql.push(`${key} ${operator} ${value}`);
                    }
                })
            } else if (angular.isString(wherePart)) {
                if( !(multiOperand && SQLBuilder.isOperand(wherePart)) ) {
                    sql.push(wherePart);
                }
            }
        });

        if(!multiOperand) {
            return sql.join(` ${operand} `);
        } else {
            return sql.join(' ');
        }


    } else  if (where.length === 1) {
        where = [];
    }

    return where.join(` ${operand} `);
};

SQLBuilder.escape = function (str) {
  return str.replace(/\'/g,  '\\\'');
};

SQLBuilder.OPERATORS = {
  AND: 'AND',
  OR: 'OR',
  IN: 'IN',
  NOT_IN: 'NOT IN',
  EQ: '=',
  NOT_EQ: '<>',
  REGEXP: 'REGEXP',
  NOT_REGEXP: 'NOT REGEXP',
  IS_NULL: 'ISNULL',
  NOT_NULL: 'NOTNULL',
  MATCH_IP: '_ABSTRACT_OPERATOR_IP_MATCH',
  MATCH_IP_SUBNET: '<<',
  BETWEEN: 'BETWEEN'
};

function SQLBuilderFactory () {
  return {
    OP: SQLBuilder.OPERATORS,
    escape: SQLBuilder.escape,
    buildWhere: SQLBuilder.buildWhere,
    /**
     * @param query
     * @returns {SQLBuilder}
     */
    factory: function (query = {}) {
      return new SQLBuilder(query);
    }
  };
}

export default SQLBuilderFactory;
