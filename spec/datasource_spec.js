import {Datasource} from '../module';
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
            hide: false,
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
            }
        }
    ]
};

const customTarget = {
    isNew: true,
    hide: false,
    refId: "A",
    _nsgTarget: {
        refId: "A",
        hide: false,
        type: "nsgql",
        columns: [],
        variable: "cpuUtil",
        orderBy: {
            "column": {"name": "", "value": "", "alias": ""},
            sort: "ASC", "colName": "select value"
        },
        rawQuery: 1,
        limit: 100,
        tags: [],
        groupBy: {'type': 'select type', 'value': 'select value'},
        format: 'time_series',
        isTablePanel: false,
        loading: false,
        nsgqlString: "SELECT metric,time FROM cpuUtil WHERE $_timeFilter LIMIT 100, 0"
    }
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
            getAdhocFilters: function () {
                return [];
            },
            replace: function (str) {
                return str;
            }
        };
        ctx.ds = new Datasource(settings, ctx.$q, ctx.backendSrv, ctx.templateSrv);
        ctx.options = _.cloneDeep(options);
    });


    it('Show implements query method', function() {
        expect(ctx.ds.query).to.be.defined;
    });

    it('Show implements testDatasource method', function() {
        expect(ctx.ds.testDatasource).to.be.defined;
    });

    it('Show implements metricFindQuery method', function() {
        expect(ctx.ds.metricFindQuery).to.be.defined;
    });

    describe('Test query method', function() {
       
        it('Should return an empty array when no targets are set', function (done) {
            ctx.options.targets = [];
            ctx.ds.query(ctx.options).then(function (result) {
                expect(result.data).to.have.length(0);
                done();
            });
        });
    
        it('Should return an empty array when single target has 0 columns', function (done) {
            ctx.options.targets[0]._nsgTarget.columns.length = 0;
            ctx.ds.query(ctx.options).then(function (result) {
                expect(result.data).to.have.length(0);
                done();
            });
        });
    
        it('Should has correct sql when custom target specified', function (done) {
            ctx.backendSrv.datasourceRequest = function(request) {
                const target = request.data.targets[0];

                expect(target).to.be.an('object');
                expect(target).to.include.all.keys('nsgql', 'format', 'id');
                expect(target.nsgql).to.equals('SELECT metric,time FROM cpuUtil WHERE time BETWEEN \'now-6h\' AND \'now\' LIMIT 100, 0');

                return Q.resolve([]);
            };
    
            ctx.options.targets[0] = _.cloneDeep(customTarget);
            ctx.ds.query(ctx.options).finally(() => done());
        });

        it('Should use custom target when rawQuery equals to 1', function (done) {
            ctx.backendSrv.datasourceRequest = function(request) {
                const target = request.data.targets[0];

                expect(target).to.be.an('object');
                expect(target).to.include.all.keys('nsgql', 'format', 'id');
                expect(target.nsgql).to.equals('SELECT metric FROM devices');

                return Q.resolve([]);
            };
    
            ctx.options.targets[0] = _.cloneDeep(customTarget);
            ctx.options.targets[0]._nsgTarget.rawQuery = 1;
            ctx.options.targets[0]._nsgTarget.nsgqlString = 'SELECT metric FROM devices';

            ctx.ds.query(ctx.options).finally(() => done());
        });


        it('Should return [] when all targets has hide that equals true', function (done) {
            ctx.options.targets[0] = _.cloneDeep(customTarget);
            ctx.options.targets[0]._nsgTarget.hide = true;
            ctx.options.targets[0].hide = true;

            ctx.ds
                .query(ctx.options)
                .then((result) => {
                    expect(result.data).to.have.length(0);
                    done();
                });
        });


        it('Should automatically add quotes for user variables in query builder mode', function (done) {
            ctx.options.targets[0]._nsgTarget.tags = [{'key': 'Link', 'operator': '=', 'value': '$_foo'}];

            ctx.backendSrv.datasourceRequest = function(request) {
                const target = request.data.targets[0];
                const sql = target.nsgql;

                expect(/['"]{1}\$_foo['"]{1}/.test(sql)).to.be.true;
                
                return Q.resolve([]);
            };

            ctx.ds
                .query(ctx.options)
                .then((result) => done());
        });
    });
});
