/*
 * Copyright (c) 2016.  Happy Gears, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import _ from 'lodash';
import moment from 'moment';

var units = ['y', 'M', 'w', 'd', 'h', 'm', 's'];

export function parse(text, roundUp) {
    if (!text) { return undefined; }
    if (moment.isMoment(text)) { return text; }
    if (_.isDate(text)) { return moment(text); }

    var time;
    var mathString = '';
    var index;
    var parseString;

    if (text.substring(0, 3) === 'now') {
        time = moment();
        mathString = text.substring('now'.length);
    } else {
        index = text.indexOf('||');
        if (index === -1) {
            parseString = text;
            mathString = ''; // nothing else
        } else {
            parseString = text.substring(0, index);
            mathString = text.substring(index + 2);
        }
        // We're going to just require ISO8601 timestamps, k?
        time = moment(parseString, moment.ISO_8601);
    }

    if (!mathString.length) {
        return time;
    }

    return parseDateMath(mathString, time, roundUp);
}

export function isValid(text) {
    var date = parse(text);
    if (!date) {
        return false;
    }

    if (moment.isMoment(date)) {
        return date.isValid();
    }

    return false;
}

export function parseDateMath(mathString, time, roundUp) {
    var dateTime = time;
    var i = 0;
    var len = mathString.length;

    while (i < len) {
        var c = mathString.charAt(i++);
        var type;
        var num;
        var unit;

        if (c === '/') {
            type = 0;
        } else if (c === '+') {
            type = 1;
        } else if (c === '-') {
            type = 2;
        } else {
            return undefined;
        }

        if (isNaN(mathString.charAt(i))) {
            num = 1;
        } else if (mathString.length === 2) {
            num = mathString.charAt(i);
        } else {
            var numFrom = i;
            while (!isNaN(mathString.charAt(i))) {
                i++;
                if (i > 10) { return undefined; }
            }
            num = parseInt(mathString.substring(numFrom, i), 10);
        }

        if (type === 0) {
            // rounding is only allowed on whole, single, units (eg M or 1M, not 0.5M or 2M)
            if (num !== 1) {
                return undefined;
            }
        }
        unit = mathString.charAt(i++);

        if (!_.includes(units, unit)) {
            return undefined;
        } else {
            if (type === 0) {
                if (roundUp) {
                    dateTime.endOf(unit);
                } else {
                    dateTime.startOf(unit);
                }
            } else if (type === 1) {
                dateTime.add(num, unit);
            } else if (type === 2) {
                dateTime.subtract(num, unit);
            }
        }
    }
    return dateTime;
}

