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
    }
};