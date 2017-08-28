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

                    return date.valueOf() + 'ms';
                }
            });
        }
    };
});
//# sourceMappingURL=utils.js.map
