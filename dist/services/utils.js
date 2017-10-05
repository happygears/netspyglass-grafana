'use strict';

System.register(['lodash', '../datemath'], function (_export, _context) {
    "use strict";

    var _, dateMath;

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_datemath) {
            dateMath = _datemath;
        }],
        execute: function () {
            _export('default', {
                getTime: function getTime(date, roundUp) {
                    if (_.isString(date)) {
                        if (date === 'now') {
                            return 'now';
                        }

                        var parts = /^now-(\d+)([d|h|m|s])$/.exec(date);

                        if (parts) {
                            var amount = parseInt(parts[1]);
                            var unit = parts[2];

                            return 'now-' + amount + unit;
                        }

                        date = dateMath.parse(date, roundUp);
                    }

                    return date.valueOf();
                },
                /**
                 * compileColumnAlias - return the column name wrapped by a function when column has appliedFunctions, else return only column name
                 * @param column {string}
                 * @return {string}
                 */
                compileColumnName: function compileColumnName(column) {
                    var columnName = column.name;

                    if (column.appliedFunctions && angular.isArray(column.appliedFunctions) && column.appliedFunctions.length) {
                        columnName = column.appliedFunctions.map(function (func) {
                            return func.name;
                        }).join('(') + '(' + columnName + ')'.repeat(column.appliedFunctions.length);
                    }

                    return columnName;
                },
                /**
                 * compileColumnAlias - return alias when column has appliedFunctions, else return column name
                 * @param column {string}
                 * @return {string}
                 */
                compileColumnAlias: function compileColumnAlias(column) {
                    var columnName = column.name;

                    if (column.appliedFunctions && angular.isArray(column.appliedFunctions) && column.appliedFunctions.length) {
                        columnName = column.appliedFunctions.map(function (func) {
                            return func.name;
                        }).join('_') + '_' + columnName;
                    }

                    return columnName;
                }
            });
        }
    };
});
