'use strict';

System.register(['./datasource', './query_ctrl'], function (_export, _context) {
  "use strict";

  var NetSpyGlassDatasource, NetSpyGlassDatasourceQueryCtrl, GenericConfigCtrl, GenericQueryOptionsCtrl, GenericAnnotationsQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_datasource) {
      NetSpyGlassDatasource = _datasource.NetSpyGlassDatasource;
    }, function (_query_ctrl) {
      NetSpyGlassDatasourceQueryCtrl = _query_ctrl.NetSpyGlassDatasourceQueryCtrl;
    }],
    execute: function () {
      _export('ConfigCtrl', GenericConfigCtrl = function GenericConfigCtrl() {
        _classCallCheck(this, GenericConfigCtrl);
      });

      GenericConfigCtrl.templateUrl = 'partials/config.html';

      _export('QueryOptionsCtrl', GenericQueryOptionsCtrl = function GenericQueryOptionsCtrl() {
        _classCallCheck(this, GenericQueryOptionsCtrl);
      });

      GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

      _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl = function GenericAnnotationsQueryCtrl() {
        _classCallCheck(this, GenericAnnotationsQueryCtrl);
      });

      GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

      _export('Datasource', NetSpyGlassDatasource);

      _export('QueryCtrl', NetSpyGlassDatasourceQueryCtrl);

      _export('ConfigCtrl', GenericConfigCtrl);

      _export('QueryOptionsCtrl', GenericQueryOptionsCtrl);

      _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
