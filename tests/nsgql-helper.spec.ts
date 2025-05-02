import _ from 'lodash';
import { NSGSqlHelper } from '../src/services/nsgql-helper';
import { NSQLQuery, Operators } from '../src/services/nsgql';

describe('Test', function () {
  const ctx: { helper?: NSGSqlHelper; query?: NSQLQuery } = {};
  const templateService = {
    variables: [] as any[],
    getVariables() {
      return this.variables;
    },
  };

  beforeEach(function () {
    ctx.helper = new NSGSqlHelper(templateService as any);
    ctx.query = new NSQLQuery();
  });

  describe('Test processColumns', function () {
    beforeEach(function () {
      ctx.helper = new NSGSqlHelper(templateService as any);
      ctx.query = new NSQLQuery();
    });

    it('Should return string when column is string', function () {
      expect(ctx.helper!.processColumn('foo_bar')).toEqual('foo_bar');
      expect(ctx.helper!.processColumn('foo_bar')).toEqual('foo_bar');
    });

    it('Should return string when column is plain object', function () {
      expect(ctx.helper!.processColumn({ name: 'foo_bar' })).toEqual('foo_bar');
    });

    it('Should throw exception when data has incorrect format', function () {
      expect(ctx.helper!.processColumn.bind(null)).toThrow(Error);
      expect(ctx.helper!.processColumn.bind(null, 123 as any)).toThrow(Error);
      expect(ctx.helper!.processColumn.bind(null, [] as any)).toThrow(Error);
    });

    it('Should generate alias when alias is specified', function () {
      expect(ctx.helper!.processColumn({ name: 'foo_bar', alias: 'baz' })).toEqual('foo_bar as baz');
    });

    it('Should wrap column to given functions', function () {
      const column = { name: 'foo_bar', appliedFunctions: [{ name: 'max' }] };
      const column2 = { name: 'foo_bar', appliedFunctions: [{ name: 'avg' }, { name: 'max' }] };

      expect(ctx.helper!.processColumn(column)).toEqual('max(foo_bar)');
      expect(ctx.helper!.processColumn(column2)).toEqual('avg(max(foo_bar))');
    });

    it('Should wrap column to given functions and apply alias', function () {
      const column = { name: 'foo_bar', appliedFunctions: [{ name: 'max' }], alias: 'baz' };
      const column2 = { name: 'foo_bar', appliedFunctions: [{ name: 'avg' }, { name: 'max' }], alias: 'baz' };

      expect(ctx.helper!.processColumn(column)).toEqual('max(foo_bar) as baz');
      expect(ctx.helper!.processColumn(column2)).toEqual('avg(max(foo_bar)) as baz');
    });

    it('Should wrap column to given functions and auto-alias', function () {
      const column = { name: 'foo_bar', appliedFunctions: [{ name: 'max' }] };
      const column2 = { name: 'foo_bar', appliedFunctions: [{ name: 'avg' }, { name: 'max' }] };

      expect(ctx.helper!.processColumn(column, true)).toEqual('max(foo_bar) as max_foo_bar');
      expect(ctx.helper!.processColumn(column2, true)).toEqual('avg(max(foo_bar)) as avg_max_foo_bar');
    });
  });

  describe('Test variablesSQL', function () {
    it('Should return sql for query with variablesSQL', function () {
      expect(ctx.helper!.variablesSQL()).toEqual(
        "SELECT DISTINCT * FROM variables WHERE category <> '' ORDER BY 'category'"
      );
    });
  });

  describe('Test facets', function () {
    it('Should return sql for query facets for given variable', function () {
      expect(ctx.helper!.facetsSQL('variable1')).toEqual(
        `SELECT DISTINCT tagFacet FROM variable1 WHERE tagFacet NOTNULL ORDER BY 'tagFacet'`
      );
      expect(ctx.helper!.facetsSQL('variable2')).toEqual(
        `SELECT DISTINCT tagFacet FROM variable2 WHERE tagFacet NOTNULL ORDER BY 'tagFacet'`
      );
    });
  });

  describe('Test suggestions', function () {
    it('Should return sql for suggestinon in where builder', function () {
      const tags = [{ key: 'Link', operator: Operators.EQ, value: 'gw-colo', condition: Operators.AND }];

      expect(ctx.helper!.suggestionSQL('device', 'variable1')).toEqual(
        "SELECT DISTINCT device FROM variable1 ORDER BY 'device'"
      );
      expect(ctx.helper!.suggestionSQL('component', 'variable2')).toEqual(
        "SELECT DISTINCT component FROM variable2 ORDER BY 'component'"
      );
      expect(ctx.helper!.suggestionSQL('component', 'variable3', tags)).toEqual(
        "SELECT DISTINCT component FROM variable3 WHERE Link = 'gw-colo' ORDER BY 'component'"
      );
      expect(ctx.helper!.suggestionSQL('Model', 'ifInRate', tags)).toEqual(
        "SELECT DISTINCT Model FROM ifInRate WHERE Model NOTNULL AND (Link = 'gw-colo') ORDER BY 'Model'"
      );
    });
  });

  describe('Test AdHoc', function () {
    it('Should return sql for addHoc', function () {
      expect(ctx.helper!.getTagKeysForAdHocSQL()).toEqual(`SELECT facet FROM tags ORDER BY 'facet'`);
    });

    it('Should return sql for addHoc when facet is selected', function () {
      const result = ctx.helper!.getTagValuesForAdHoc('Link');
      expect(result).toHaveLength(2);
      expect(Array.isArray(result)).toBeTruthy();
      expect(result[0]).toEqual(`SELECT DISTINCT Link FROM devices WHERE Link NOTNULL ORDER BY 'Link'`);
      expect(result[1]).toEqual(`SELECT DISTINCT Link FROM interfaces WHERE Link NOTNULL ORDER BY 'Link'`);
    });
  });

  describe('Test building where from given tags', function () {
    it('Should return correct where part from tags', function () {
      const tags = [
        { condition: 'OR', key: 'Model', operator: '=', value: 'linux' },
        { condition: 'AND', key: 'device', operator: '=', value: 'carrier' },
      ];

      expect(ctx.helper!.generateWhereFromTags([])).toEqual(null);
      expect(NSQLQuery.buildWhere(ctx.helper!.generateWhereFromTags(tags as any))).toEqual(
        "Model = 'linux' AND device = 'carrier'"
      );
    });
  });

  describe('Test variables replacement', function () {
    it('should replace plain variable', function () {
      templateService.variables = [{ name: 'DEVICE', current: { value: 'cty1-bb01' } }] as any;
      const sql = `select * from cpuUtil where device = $DEVICE`;
      expect(ctx.helper!.replaceVariables(sql)).toEqual(`select * from cpuUtil where device = cty1-bb01`);
    });

    it('should replace multiple variables', function () {
      templateService.variables = [
        { name: 'DEVICE1', current: { value: 'cty1-bb01' } },
        { name: 'DEVICE2', current: { value: 'cty1-bb02' } },
        { name: 'DEVICE3', current: { value: 'cty1-bb03' } },
      ];

      const sql = `select * from cpuUtil where device = $DEVICE1 or device = '$DEVICE2' or device = '$DEVICE3'`;
      const expectSql = `select * from cpuUtil where device = cty1-bb01 or device = 'cty1-bb02' or device = 'cty1-bb03'`;

      expect(ctx.helper!.replaceVariables(sql)).toEqual(expectSql);
    });

    it('should correct replace multivalue variable (without quotes)', function () {
      templateService.variables = [
        {
          name: 'DEVICES',
          current: {
            value: ['cty1-bb01', 'cty1-bb02', 'cty1-bb03'],
          },
        },
      ];

      const sql = `select * from cpuUtil where device IN ($DEVICES)`;
      const expectSql = `select * from cpuUtil where device IN (cty1-bb01, cty1-bb02, cty1-bb03)`;

      expect(ctx.helper!.replaceVariables(sql)).toEqual(expectSql);
    });

    it('should correct replace multivalue variable (with quotes)', function () {
      templateService.variables = [
        {
          name: 'DEVICESX',
          options: ['cty1-bb01', 'cty1-bb02', 'cty1-bb03'],
          current: {
            value: ['cty1-bb01', 'cty1-bb02', 'cty1-bb03'],
          },
        },
      ];

      const sql = `select * from cpuUtil where device IN ('$DEVICESX')`;
      const expectSql = `select * from cpuUtil where device IN ('cty1-bb01', 'cty1-bb02', 'cty1-bb03')`;

      expect(ctx.helper!.replaceVariables(sql)).toEqual(expectSql);
    });

    it('should correct rendex REGEXP', function () {
      templateService.variables = [
        {
          name: 'DEVICES',
          options: ['foo', 'bar'],
          current: {
            value: ['foo', 'bar'],
          },
        },
      ];

      const sql = `select * from cpuUtil where device REGEXP $DEVICES OR device REGEXP '$DEVICES'`;
      const expectSql = `select * from cpuUtil where device REGEXP foo|bar OR device REGEXP 'foo|bar'`;

      expect(ctx.helper!.replaceVariables(sql)).toEqual(expectSql);
    });

    it('should not add quotes when the variable is already in quotes', function () {
      templateService.variables = [
        {
          name: 'DEVICES',
          options: ['foo', 'bar'],
          current: {
            value: ['foo', 'bar'],
          },
        },
      ];

      const sql = `select * from cpuUtil where device REGEXP '$DEVICES'`;
      const expectSql = `select * from cpuUtil where device REGEXP 'foo|bar'`;

      expect(ctx.helper!.replaceVariables(sql)).toEqual(expectSql);
    });
  });
});
