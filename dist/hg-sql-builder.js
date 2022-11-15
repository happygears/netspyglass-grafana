"use strict";

System.register([], function (_export, _context) {
  "use strict";

  var _createClass, SQLBuilder;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function SQLBuilderFactory() {
    return {
      OP: SQLBuilder.OPERATORS,
      escape: SQLBuilder.escape,
      buildWhere: SQLBuilder.buildWhere,
      /**
       * @param query
       * @returns {SQLBuilder}
       */
      factory: function factory() {
        var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return new SQLBuilder(query);
      }
    };
  }

  return {
    setters: [],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      SQLBuilder = function () {
        function SQLBuilder() {
          var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          _classCallCheck(this, SQLBuilder);

          this.setOptions(options);
        }

        _createClass(SQLBuilder, [{
          key: 'setOptions',
          value: function setOptions(options) {
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
        }, {
          key: 'getOptions',
          value: function getOptions() {
            return this.options;
          }
        }, {
          key: 'setDistinct',
          value: function setDistinct() {
            var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            this.options.distinct = value;
            return this;
          }
        }, {
          key: 'select',
          value: function select() {
            var columns = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            this.options.select = columns;
            return this;
          }
        }, {
          key: 'from',
          value: function from(_from) {
            this.options.from = _from;
            return this;
          }
        }, {
          key: 'where',
          value: function where() {
            var _where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            this.options.where = _where;
            return this;
          }
        }, {
          key: 'orderBy',
          value: function orderBy(order) {
            this.options.orderBy.push(order);
            return this;
          }
        }, {
          key: 'groupBy',
          value: function groupBy(group) {
            this.options.groupBy = [group];
            return this;
          }
        }, {
          key: 'limit',
          value: function limit(_limit) {
            var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            this.options.limit = [_limit, offset];
            return this;
          }
        }, {
          key: 'clearLimit',
          value: function clearLimit() {
            this.options.limit = 0;
            return this;
          }
        }, {
          key: 'clearGroupBy',
          value: function clearGroupBy() {
            this.options.groupBy = [];
            return this;
          }
        }, {
          key: 'clearOrderBy',
          value: function clearOrderBy() {
            this.options.orderBy = [];
            return this;
          }
        }, {
          key: 'compile',
          value: function compile() {
            var sql = [];

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
              sql.push('GROUP BY ' + this.options.groupBy.join(', '));
            }

            if (this.options.orderBy.length) {
              sql.push('ORDER BY ' + this.options.orderBy.join(', '));
            }

            if (this.options.limit.length) {
              sql.push('LIMIT ' + this.options.limit.join(', '));
            }

            return sql.join(' ');
          }
        }], [{
          key: 'isOperand',
          value: function isOperand(el) {
            if (typeof el !== 'string') return false;
            return !!SQLBuilder.OPERATORS[el];
          }
        }, {
          key: 'proccessMultiOperand',
          value: function proccessMultiOperand(where, idx, multiOperand, baseString) {
            if (multiOperand && where.length > idx + 1) {
              var localOperand = SQLBuilder.isOperand(where[idx + 1]) ? where[idx + 1] : 'AND';
              return baseString + ' ' + localOperand;
            } else {
              return '' + baseString;
            }
          }
        }]);

        return SQLBuilder;
      }();

      SQLBuilder.buildWhere = function (where) {
        var _this = this;

        if (where === null || where === undefined) return;

        var sql = [];
        var operand = SQLBuilder.OPERATORS.AND;
        var multiOperand = Array.isArray(where) && where.reduce(function (result, el) {
          return SQLBuilder.isOperand(el) ? result + 1 : result;
        }, 0) > 1;

        var WITH_BRACKETS = [SQLBuilder.OPERATORS.IN, SQLBuilder.OPERATORS.NOT_IN];

        var REGEXP = [SQLBuilder.OPERATORS.REGEXP, SQLBuilder.OPERATORS.NOT_REGEXP];

        if (!angular.isArray(where) && angular.isObject(where)) {
          where = [operand, where];
        }

        if (where.length >= 2) {
          operand = where[0];
          where = where.splice(1);

          where.forEach(function (wherePart, idx) {
            if (angular.isArray(wherePart)) {
              sql.push('(' + _this.buildWhere(wherePart) + ')');
            } else if (angular.isObject(wherePart)) {
              angular.forEach(wherePart, function (value, key) {
                var operator = '=';

                if (angular.isArray(value)) {
                  operator = value[0].toUpperCase();
                  value = value.slice(1);

                  if (operator === SQLBuilder.OPERATORS.BETWEEN) {
                    var result = void 0;

                    result = value.reduce(function (current, item) {
                      if (current.length) {
                        current += ' ' + SQLBuilder.OPERATORS.AND + ' ';
                      }
                      return current + ('\'' + item + '\'');
                    }, '');

                    value = result;
                  } else if (operator === SQLBuilder.OPERATORS.MATCH_IP) {
                    var joinString = void 0;

                    joinString = value.reduce(function (current, item) {
                      var op = void 0;

                      op = item.indexOf('/') === -1 ? SQLBuilder.OPERATORS.EQ : SQLBuilder.OPERATORS.MATCH_IP_SUBNET;

                      if (current.length) {
                        current += ' ' + SQLBuilder.OPERATORS.OR + ' ';
                      }

                      return current + (key + ' ' + op + ' \'' + item + '\'');
                    }, '');

                    sql.push(joinString);
                    return;
                  } else if (operator === SQLBuilder.OPERATORS.NOT_NULL || operator === SQLBuilder.OPERATORS.IS_NULL) {
                    sql.push(SQLBuilder.proccessMultiOperand(where, idx, multiOperand, key + ' ' + operator));
                    return;
                  } else if (WITH_BRACKETS.indexOf(operator) !== -1) {
                    value = '(\'' + value.join('\', \'') + '\')';
                  } else if (REGEXP.indexOf(operator) !== -1) {
                    value = '\'' + value.join('|') + '\'';
                  } else {
                    value = '\'' + value + '\'';
                  }
                } else {
                  value = '\'' + value + '\'';
                }

                sql.push(SQLBuilder.proccessMultiOperand(where, idx, multiOperand, key + ' ' + operator + ' ' + value));
              });
            } else if (angular.isString(wherePart)) {
              if (!(multiOperand && SQLBuilder.isOperand(wherePart))) {
                sql.push(wherePart);
              }
            }
          });

          if (!multiOperand) {
            return sql.join(' ' + operand + ' ');
          } else {
            return sql.join(' ');
          }
        } else if (where.length === 1) {
          where = [];
        }

        return where.join(' ' + operand + ' ');
      };

      SQLBuilder.escape = function (str) {
        // NET-5988
        // ... all symbols that don't match with the allowed pattern will be replaced with _
        return str.replace(/[^a-zA-Z0-9_]/g, "_");
      };

      SQLBuilder.OPERATORS = {
        AND: 'AND',
        OR: 'OR',
        IN: 'IN',
        NOT_IN: 'NOT IN',
        EQ: '=',
        NOT_EQ: '<>',
        NOT_EQ_2: '!=',
        REGEXP: 'REGEXP',
        NOT_REGEXP: 'NOT REGEXP',
        IS_NULL: 'ISNULL',
        NOT_NULL: 'NOTNULL',
        MATCH_IP: '_ABSTRACT_OPERATOR_IP_MATCH',
        MATCH_IP_SUBNET: '<<',
        BETWEEN: 'BETWEEN'
      };
      _export('default', SQLBuilderFactory);
    }
  };
});
