import {SQLQuery} from '../services/api';
import SQLBuilderFactory from '../hg-sql-builder';
import _ from 'lodash';
import Q from 'q';

describe('APIQuery', function() {
    const ctx = {};

    describe('Test processColumns', function() {

        beforeEach(function() {
            ctx.query = new SQLQuery();
            ctx.sqlBuilder = SQLBuilderFactory();
        });

        it('Should return string when column is string', function() {
            expect(ctx.query.processColumn('foo_bar')).to.equals('foo_bar');
            expect(ctx.query.processColumn('foo_bar')).to.be.a('string');
        });
    
        it('Should return string when column is plain object', function() {
            expect(ctx.query.processColumn({name: 'foo_bar'})).to.equals('foo_bar');
        });

        it('Should throw exception when data has incorrect format', function() {
            expect(ctx.query.processColumn.bind(null)).to.throw(Error);
            expect(ctx.query.processColumn.bind(null, 123)).to.throw(Error);
            expect(ctx.query.processColumn.bind(null, [])).to.throw(Error);
        });

        it('Should generate alias when alias is specified', function() {
            expect(ctx.query.processColumn({name: 'foo_bar', 'alias': 'baz'})).to.equals('foo_bar as baz');
        });

        it('Should wrap column to given functions', function() {
            const column = {name: 'foo_bar', appliedFunctions: [{name: 'max'}]};
            const column2 = {name: 'foo_bar', appliedFunctions: [{name: 'avg'}, {name: 'max'}]};

            expect(ctx.query.processColumn(column)).to.equals('max(foo_bar)');
            expect(ctx.query.processColumn(column2)).to.equals('avg(max(foo_bar))');
        });

        it('Should wrap column to given functions and apply alias', function() {
            const column = {name: 'foo_bar', appliedFunctions: [{name: 'max'}], alias: 'baz'};
            const column2 = {name: 'foo_bar', appliedFunctions: [{name: 'avg'}, {name: 'max'}], alias: 'baz'};

            expect(ctx.query.processColumn(column)).to.equals('max(foo_bar) as baz');
            expect(ctx.query.processColumn(column2)).to.equals('avg(max(foo_bar)) as baz');
        });


        it('Should wrap column to given functions and auto-alias', function() {
            const column = {name: 'foo_bar', appliedFunctions: [{name: 'max'}]};
            const column2 = {name: 'foo_bar', appliedFunctions: [{name: 'avg'}, {name: 'max'}]};

            expect(ctx.query.processColumn(column, true)).to.equals('max(foo_bar) as max_foo_bar');
            expect(ctx.query.processColumn(column2, true)).to.equals('avg(max(foo_bar)) as avg_max_foo_bar');
        });
    });

    describe('Test categories', function () {
        it('Should return sql for query categories', function() {
            expect(ctx.query.categories()).to.equals('SELECT DISTINCT * FROM variables WHERE category <> \'\' ORDER BY category');
        });
    });

    describe('Test facets', function () {
        it('Should return sql for query facets for given variable', function() {
            expect(ctx.query.facets('variable1')).to.equals('SELECT DISTINCT tagFacet FROM variable1 ORDER BY tagFacet');
            expect(ctx.query.facets('variable2')).to.equals('SELECT DISTINCT tagFacet FROM variable2 ORDER BY tagFacet');
        });
    });

    describe('Test suggestions', function () {
        it('Should return sql for suggestinon in where builder', function() {
            const tags = [{'key': 'Link', 'operator': '=', 'value': 'gw-colo'}];

            expect(ctx.query.suggestion('device', 'variable1')).to.equals('SELECT DISTINCT device FROM variable1 ORDER BY device');
            expect(ctx.query.suggestion('component', 'variable2')).to.equals('SELECT DISTINCT component FROM variable2 ORDER BY component');
            expect(ctx.query.suggestion('component', 'variable3', tags)).to.equals('SELECT DISTINCT component FROM variable3 WHERE Link = \'gw-colo\' ORDER BY component');
            expect(ctx.query.suggestion('Model', 'ifInRate', tags)).to.equals('SELECT DISTINCT Model FROM ifInRate WHERE Model NOTNULL AND (Link = \'gw-colo\') ORDER BY Model');
        });
    });

    describe('Test AdHoc', function () {
        it('Should return sql for addHoc', function() {
            expect(ctx.query.getTagKeysForAdHoc()).to.equals('SELECT facet FROM tags');
        });

        it('Should return sql for addHoc when facet is selected', function() {
            const result = ctx.query.getTagValuesForAdHoc('Link');
            expect(result).to.be.an('array');
            expect(result.length).to.equals(2);
            expect(result[0].nsgql).to.equals('SELECT DISTINCT Link FROM devices WHERE Link NOTNULL ORDER BY Link');
            expect(result[1].nsgql).to.equals('SELECT DISTINCT Link FROM interfaces WHERE Link NOTNULL ORDER BY Link');
        });
    });

    describe('Test building where from given tags', function () {
        it('Should return correct where part from tags', function() {
            const tags = [
                {"key": "Model", "operator": "=", "value": "linux"},
                {"condition": "AND", "key": "device", "operator": "=", "value": "carrier"}
            ];

            expect(ctx.query.generateWhereFromTags([])).to.equals(null);
            expect(ctx.sqlBuilder.factory({where: ctx.query.generateWhereFromTags(tags)}).compile()).to.equals('WHERE Model = \'linux\' AND device = \'carrier\'');
        });
    });
});