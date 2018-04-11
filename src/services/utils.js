import _ from 'lodash';
import * as dateMath from '../datemath';

class Timer {
    constructor() {
        this._run = false;
        this._nextTask = null;
        this._currentTask = null;
    }

    /**
     * @param {Function} task 
     */
    sheduleTask(task) {
        if (this._run === false) {
            this._run = true;
            this._currentTask = task;
            task();
        } else {
            this._nextTask = task;
        }
    }

    stop() {
        this._taskEnd();
    }

    _taskEnd() {
        if (this._nextTask) {
            this._nextTask();
            this._currentTask = this._nextTask;
            this._nextTask = null;
        } else {
            this._currentTask = null;
            this._run = false;
        }
    }
}

export default {
    getTime: function (date, roundUp) {
        if (_.isString(date)) {
            if (date === 'now') {
                return `now`
            }

            const parts = /^now-(\d+)([d|h|m|s])$/.exec(date);

            if (parts) {
                const amount = parseInt(parts[1]);
                const unit = parts[2];

                return `now-${amount}${unit}`;
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
    compileColumnName: function (column) {
        let columnName = column.name;

        if (column.appliedFunctions && angular.isArray(column.appliedFunctions) && column.appliedFunctions.length) {
            columnName = `${column.appliedFunctions.map(((func) => func.name)).join('(')}(${columnName}${')'.repeat(column.appliedFunctions.length)}`;
        }

        return columnName;
    },
    /**
     * compileColumnAlias - return alias when column has appliedFunctions, else return column name
     * @param column {string}
     * @return {string}
     */
    compileColumnAlias: function (column) {
        let columnName = column.name;

        if (column.appliedFunctions && angular.isArray(column.appliedFunctions) && column.appliedFunctions.length) {
            columnName = `${column.appliedFunctions.map(((func) => func.name)).join('_')}_${columnName}`;
        }

        return columnName;
    },

    getScheduler: function()  {
        if (!this._timer) {
            this._timer = new Timer();
        }

        return this._timer;
    }
};

