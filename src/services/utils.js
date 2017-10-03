import _ from 'lodash';
import * as dateMath from '../datemath';

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
    }
};