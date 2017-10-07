import {Datasource} from '../modules';
import _ from 'lodash';
import Q from 'q';

const options = {
    panelId: 1, 
    range: {
        from: new Date("2017-10-05T08:25:28.524Z"), 
        to: new Date("2017-10-05T14:25:28.524Z"), 
        raw: {from: 'now-6h', to: 'now'}
    }, 
    rangeRaw: {from: 'now-6h', to: 'now'}, 
    interval: '15s', 
    intervalMs: 15000,
    targets: [
        {
            _nsgTarget: {
                columns: [
                    {appliedFunctions: [], name: 'metric', visible: true},
                    {name: 'time', visible: false}
                ],
                format: 'time_series',
                groupBy: {'type': 'select type', 'value': 'select value'},
                hide: false,
                limit: 100,
                loading: false,
                orderBy: {'column': 'select value', 'sort': 'ASC', 'colName': 'select value'},
                rawQuery: 0,
                refId: 'A',
                tags: [{'key': 'Link', 'operator': '=', 'value': 'gw-colo'}],
                type: 'nsgql',
                variable: 'ifInRate',
                isTablePanel: false
            }, 'hide': false
        }
    ]
};

describe('NetSpyGlassDatasource', function () {
    const ctx = {};
    const settings = {
        jsonData: {networkId: 1},
    };

    beforeEach(function () {
        ctx.$q = Q;
        ctx.backendSrv = {};
        ctx.templateSrv = {
            getAdhocFilters: function() {
                return [];
            },
            replace: function (str) {
                return str;
            }
        };
        ctx.ds = new Datasource(settings, ctx.$q, ctx.backendSrv, ctx.templateSrv);
        ctx.options = _.cloneDeep(options);
    });

    it('should return an empty array when no targets are set', function (done) {
        ctx.options.targets = [];
        ctx.ds.query(ctx.options).then(function (result) {
            expect(result.data).to.have.length(0);
            done();
        });
    });

    it('should return an empty array when single target has 0 columns', function (done) {
        ctx.options.targets[0]._nsgTarget.columns.length = 0;
        ctx.ds.query(ctx.options).then(function (result) {
            expect(result.data).to.have.length(0);
            done();
        });
    });
});
