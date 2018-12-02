'use strict';

System.register(['lodash', '../datemath'], function (_export, _context) {
    "use strict";

    var _, dateMath, _createClass, Timer;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_datemath) {
            dateMath = _datemath;
        }],
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

            Timer = function () {
                function Timer() {
                    _classCallCheck(this, Timer);

                    this._run = false;
                    this._nextTask = null;
                    this._currentTask = null;
                }

                /**
                 * @param {Function} task 
                 */


                _createClass(Timer, [{
                    key: 'sheduleTask',
                    value: function sheduleTask(task) {
                        if (this._run === false) {
                            this._run = true;
                            this._currentTask = task;
                            task();
                        } else {
                            this._nextTask = task;
                        }
                    }
                }, {
                    key: 'stop',
                    value: function stop() {
                        this._taskEnd();
                    }
                }, {
                    key: '_taskEnd',
                    value: function _taskEnd() {
                        if (this._nextTask) {
                            this._nextTask();
                            this._currentTask = this._nextTask;
                            this._nextTask = null;
                        } else {
                            this._currentTask = null;
                            this._run = false;
                        }
                    }
                }]);

                return Timer;
            }();

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
                },

                getScheduler: function getScheduler() {
                    if (!this._timer) {
                        this._timer = new Timer();
                    }

                    return this._timer;
                }
            });
        }
    };
});
