/**
 * orb v1.0.9, Pivot table javascript library.
 *
 * Copyright (c) 2014-2017 Najmeddine Nouri <devnajm@gmail.com>.
 *
 * @version v1.0.9
 * @link http://orbjs.net/
 * @license MIT
 */

/* global module, require, define, window, document, global, React */
/*jshint node: true, eqnull: true*/

'use strict';
! function(e) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
    else if ("function" == typeof define && define.amd) define([], e);
    else {
        var f;
        "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self), f.orb = e()
    }
}(function() {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function(_dereq_, module, exports) {

            module.exports.utils = _dereq_('./orb.utils');
            module.exports.pgrid = _dereq_('./orb.pgrid');
            module.exports.pgridwidget = _dereq_('./orb.ui.pgridwidget');
            module.exports.query = _dereq_('./orb.query');
            module.exports["export"] = _dereq_('./orb.export.excel');

        }, {
            "./orb.export.excel": 6,
            "./orb.pgrid": 8,
            "./orb.query": 9,
            "./orb.ui.pgridwidget": 15,
            "./orb.utils": 17
        }],
        2: [function(_dereq_, module, exports) {

            var Aggregations = module.exports = {
                toAggregateFunc: function(func) {
                    if (func) {
                        if (typeof func === 'string' && Aggregations[func]) {
                            return Aggregations[func];
                        } else if (typeof func === 'function') {
                            return func;
                        } else {
                            return Aggregations.sum;
                        }
                    } else {
                        return Aggregations.sum;
                    }
                },
                count: function(datafield, intersection, datasource) {
                    return intersection === 'all' ? datasource.length : intersection.length;
                },
                sum: function(datafield, intersection, datasource) {
                    var sum = 0;
                    forEachIntersection(datafield, intersection, datasource, function(val) {
                        sum += val;
                    });
                    return sum;
                },
                min: function(datafield, intersection, datasource) {
                    var min = null;
                    forEachIntersection(datafield, intersection, datasource, function(val) {
                        if (min == null || val < min) {
                            min = val;
                        }
                    });
                    return min;
                },
                max: function(datafield, intersection, datasource) {
                    var max = null;
                    forEachIntersection(datafield, intersection, datasource, function(val) {
                        if (max == null || val > max) {
                            max = val;
                        }
                    });
                    return max;
                },
                avg: function(datafield, intersection, datasource) {
                    var avg = 0;
                    var len = (intersection === 'all' ? datasource : intersection).length;
                    if (len > 0) {
                        forEachIntersection(datafield, intersection, datasource, function(val) {
                            avg += val;
                        });
                        avg /= len;
                    }
                    return avg;
                },
                prod: function(datafield, intersection, datasource) {
                    var prod;
                    var len = (intersection === 'all' ? datasource : intersection).length;
                    if (len > 0) {
                        prod = 1;
                        forEachIntersection(datafield, intersection, datasource, function(val) {
                            prod *= val;
                        });
                    }
                    return prod;
                },
                stdev: function(datafield, intersection, datasource) {
                    return Math.sqrt(calcVariance(datafield, intersection, datasource, false));
                },
                stdevp: function(datafield, intersection, datasource) {
                    return Math.sqrt(calcVariance(datafield, intersection, datasource, true));
                },
                'var': function(datafield, intersection, datasource) {
                    return calcVariance(datafield, intersection, datasource, false);
                },
                varp: function(datafield, intersection, datasource) {
                    return calcVariance(datafield, intersection, datasource, true);
                }
            };

            function calcVariance(datafield, intersection, datasource, population) {
                var variance = 0;
                var avg = 0;
                var len = (intersection === 'all' ? datasource : intersection).length;
                if (len > 0) {
                    if (population || len > 1) {
                        forEachIntersection(datafield, intersection, datasource, function(val) {
                            avg += val;
                        });
                        avg /= len;
                        forEachIntersection(datafield, intersection, datasource, function(val) {
                            variance += (val - avg) * (val - avg);
                        });
                        variance = variance / (population ? len : len - 1);
                    } else {
                        variance = NaN;
                    }
                }
                return variance;
            }

            function forEachIntersection(datafield, intersection, datasource, callback) {
                var all = intersection === 'all';
                intersection = all ? datasource : intersection;
                if (intersection.length > 0) {
                    for (var i = 0; i < intersection.length; i++) {
                        callback((all ? intersection[i] : datasource[intersection[i]])[datafield]);
                    }
                }
            }

        }, {}],
        3: [function(_dereq_, module, exports) {

            var utils = _dereq_('./orb.utils');
            var Dimension = _dereq_('./orb.dimension');

            var AxeType = {
                COLUMNS: 1,
                ROWS: 2,
                DATA: 3
            };

            module.exports = function(pgrid, type) {

                var self = this;
                var dimid = 0;

                if (pgrid != null && pgrid.config != null) {


                    this.pgrid = pgrid;


                    this.type = type;


                    this.fields = (function() {
                        switch (type) {
                            case AxeType.COLUMNS:
                                return self.pgrid.config.columnFields;
                            case AxeType.ROWS:
                                return self.pgrid.config.rowFields;
                            case AxeType.DATA:
                                return self.pgrid.config.dataFields;
                            default:
                                return [];
                        }
                    }());


                    this.dimensionsCount = null;


                    this.root = null;


                    this.dimensionsByDepth = null;

                    this.update = function() {
                        self.dimensionsCount = self.fields.length;
                        self.root = new Dimension(++dimid, null, null, null, self.dimensionsCount + 1, true);

                        self.dimensionsByDepth = {};
                        for (var depth = 1; depth <= self.dimensionsCount; depth++) {
                            self.dimensionsByDepth[depth] = [];
                        }

                        // fill data
                        fill();

                        // initial sort
                        for (var findex = 0; findex < self.fields.length; findex++) {
                            var ffield = self.fields[findex];
                            if (ffield.sort.order === 'asc' || ffield.sort.order === 'desc') {
                                self.sort(ffield, true);
                            }
                        }
                    };

                    this.sort = function(field, donottoggle) {
                        if (field != null) {
                            if (donottoggle !== true) {
                                if (field.sort.order !== 'asc') {
                                    field.sort.order = 'asc';
                                } else {
                                    field.sort.order = 'desc';
                                }
                            }

                            var depth = self.dimensionsCount - getfieldindex(field);
                            var parents = depth === self.dimensionsCount ? [self.root] : self.dimensionsByDepth[depth + 1];
                            for (var i = 0; i < parents.length; i++) {
                                //console.warn(field.sort, parents[i].values)
                                if (typeof field.sort.customfunc == 'function') {
                                    var ret = field.sort.customfunc.call(this, parents[i].values);
                                    if (ret !== undefined) parents[i].values = ret;
                                } else {
                                    parents[i].values.sort();
                                    if (field.sort.order === 'desc') {
                                        parents[i].values.reverse();
                                    }
                                }
                            }
                        }
                    };
                }

                function getfieldindex(field) {
                    for (var i = 0; i < self.fields.length; i++) {
                        if (self.fields[i].name === field.name) {
                            return i;
                        }
                    }
                    return -1;
                }


                function fill() {

                    if (self.pgrid.filteredDataSource != null && self.dimensionsCount > 0) {

                        var datasource = self.pgrid.filteredDataSource;
                        if (datasource != null && utils.isArray(datasource) && datasource.length > 0) {
                            for (var rowIndex = 0, dataLength = datasource.length; rowIndex < dataLength; rowIndex++) {
                                var row = datasource[rowIndex];
                                var dim = self.root;
                                for (var findex = 0; findex < self.dimensionsCount; findex++) {
                                    var depth = self.dimensionsCount - findex;
                                    var subfield = self.fields[findex];
                                    var subvalue = row[subfield.name];
                                    var subdimvals = dim.subdimvals;

                                    if (subdimvals[subvalue] !== undefined) {
                                        dim = subdimvals[subvalue];
                                    } else {
                                        dim.values.push(subvalue);
                                        dim = new Dimension(++dimid, dim, subvalue, subfield, depth, false, findex == self.dimensionsCount - 1);
                                        subdimvals[subvalue] = dim;
                                        dim.rowIndexes = [];
                                        self.dimensionsByDepth[depth].push(dim);
                                    }

                                    dim.rowIndexes.push(rowIndex);
                                }
                            }
                        }
                    }
                }
            };

            module.exports.Type = AxeType;

        }, {
            "./orb.dimension": 5,
            "./orb.utils": 17
        }],
        4: [function(_dereq_, module, exports) {

            var utils = _dereq_('./orb.utils');
            var axe = _dereq_('./orb.axe');
            var aggregation = _dereq_('./orb.aggregation');
            var filtering = _dereq_('./orb.filtering');
            var themeManager = _dereq_('./orb.themes');

            function getpropertyvalue(property, configs, defaultvalue) {
                for (var i = 0; i < configs.length; i++) {
                    if (configs[i][property] != null) {
                        return configs[i][property];
                    }
                }
                return defaultvalue;
            }

            function mergefieldconfigs() {

                var merged = {
                    configs: [],
                    sorts: [],
                    subtotals: [],
                    functions: []
                };

                for (var i = 0; i < arguments.length; i++) {
                    var nnconfig = arguments[i] || {};
                    merged.configs.push(nnconfig);
                    merged.sorts.push(nnconfig.sort || {});
                    merged.subtotals.push(nnconfig.subTotal || {});
                    merged.functions.push({
                        aggregateFuncName: nnconfig.aggregateFuncName,
                        aggregateFunc: i === 0 ? nnconfig.aggregateFunc : (nnconfig.aggregateFunc ? nnconfig.aggregateFunc() : null),
                        formatFunc: i === 0 ? nnconfig.formatFunc : (nnconfig.formatFunc ? nnconfig.formatFunc() : null)
                    });
                }

                return merged;
            }

            function createfield(rootconfig, axetype, fieldconfig, defaultfieldconfig) {

                var axeconfig;
                var fieldAxeconfig;

                if (defaultfieldconfig) {
                    switch (axetype) {
                        case axe.Type.ROWS:
                            axeconfig = rootconfig.rowSettings;
                            fieldAxeconfig = defaultfieldconfig.rowSettings;
                            break;
                        case axe.Type.COLUMNS:
                            axeconfig = rootconfig.columnSettings;
                            fieldAxeconfig = defaultfieldconfig.columnSettings;
                            break;
                        case axe.Type.DATA:
                            axeconfig = rootconfig.dataSettings;
                            fieldAxeconfig = defaultfieldconfig.dataSettings;
                            break;
                        default:
                            axeconfig = null;
                            fieldAxeconfig = null;
                            break;
                    }
                } else {
                    axeconfig = null;
                    fieldAxeconfig = null;
                }

                var merged = mergefieldconfigs(fieldconfig, fieldAxeconfig, axeconfig, defaultfieldconfig, rootconfig);

                return new Field({
                    name: getpropertyvalue('name', merged.configs, ''),

                    caption: getpropertyvalue('caption', merged.configs, ''),

                    sort: {
                        order: getpropertyvalue('order', merged.sorts, null),
                        customfunc: getpropertyvalue('customfunc', merged.sorts, null)
                    },
                    subTotal: {
                        visible: getpropertyvalue('visible', merged.subtotals, true),
                        collapsible: getpropertyvalue('collapsible', merged.subtotals, true),
                        collapsed: getpropertyvalue('collapsed', merged.subtotals, false) && getpropertyvalue('collapsible', merged.subtotals, true)
                    },

                    aggregateFuncName: getpropertyvalue('aggregateFuncName', merged.functions, 'sum'),
                    aggregateFunc: getpropertyvalue('aggregateFunc', merged.functions, aggregation.sum),
                    formatFunc: getpropertyvalue('formatFunc', merged.functions, null)
                }, false);
            }

            function GrandTotalConfig(options) {

                options = options || {};

                this.rowsvisible = options.rowsvisible !== undefined ? options.rowsvisible : true;
                this.columnsvisible = options.columnsvisible !== undefined ? options.columnsvisible : true;
            }

            function SubTotalConfig(options, setdefaults) {

                var defaults = {
                    visible: setdefaults === true ? true : undefined,
                    collapsible: setdefaults === true ? true : undefined,
                    collapsed: setdefaults === true ? false : undefined
                };
                options = options || {};

                this.visible = options.visible !== undefined ? options.visible : defaults.visible;
                this.collapsible = options.collapsible !== undefined ? options.collapsible : defaults.collapsible;
                this.collapsed = options.collapsed !== undefined ? options.collapsed : defaults.collapsed;
            }

            function SortConfig(options) {
                options = options || {};

                this.order = options.order;
                this.customfunc = options.customfunc;
            }

            var Field = module.exports.field = function(options, createSubOptions) {

                options = options || {};

                // field name
                this.name = options.name;

                // shared settings
                this.caption = options.caption || this.name;

                // rows & columns settings
                this.sort = new SortConfig(options.sort);
                this.subTotal = new SubTotalConfig(options.subTotal);

                // data settings
                var _aggregatefunc;
                var _formatfunc;

                function defaultFormatFunc(val) {
                    return val != null ? val.toString() : '';
                }

                this.aggregateFunc = function(func) {
                    if (func) {
                        _aggregatefunc = aggregation.toAggregateFunc(func);
                    } else {
                        return _aggregatefunc;
                    }
                };

                this.formatFunc = function(func) {
                    if (func) {
                        _formatfunc = func;
                    } else {
                        return _formatfunc;
                    }
                };

                this.aggregateFuncName = options.aggregateFuncName ||
                    (options.aggregateFunc ?
                        (utils.isString(options.aggregateFunc) ?
                            options.aggregateFunc :
                            'custom') :
                        null);

                this.aggregateFunc(options.aggregateFunc);
                this.formatFunc(options.formatFunc || defaultFormatFunc);

                if (createSubOptions !== false) {
                    (this.rowSettings = new Field(options.rowSettings, false)).name = this.name;
                    (this.columnSettings = new Field(options.columnSettings, false)).name = this.name;
                    (this.dataSettings = new Field(options.dataSettings, false)).name = this.name;
                }
            };

            module.exports.config = function(config) {

                var self = this;

                this.dataSource = config.dataSource || [];
                this.canMoveFields = config.canMoveFields !== undefined ? !!config.canMoveFields : true;
                this.dataHeadersLocation = config.dataHeadersLocation === 'columns' ? 'columns' : 'rows';
                this.grandTotal = new GrandTotalConfig(config.grandTotal);
                this.subTotal = new SubTotalConfig(config.subTotal, true);
                this.width = config.width;
                this.height = config.height;
                this.toolbar = config.toolbar;
                this.theme = themeManager;

                themeManager.current(config.theme);

                this.rowSettings = new Field(config.rowSettings, false);
                this.columnSettings = new Field(config.columnSettings, false);
                this.dataSettings = new Field(config.dataSettings, false);

                // datasource field names
                this.dataSourceFieldNames = [];
                // datasource field captions
                this.dataSourceFieldCaptions = [];

                this.captionToName = function(caption) {
                    var fcaptionIndex = self.dataSourceFieldCaptions.indexOf(caption);
                    return fcaptionIndex >= 0 ? self.dataSourceFieldNames[fcaptionIndex] : caption;
                };

                this.nameToCaption = function(name) {
                    var fnameIndex = self.dataSourceFieldNames.indexOf(name);
                    return fnameIndex >= 0 ? self.dataSourceFieldCaptions[fnameIndex] : name;
                };

                this.setTheme = function(newTheme) {
                    return self.theme.current() !== self.theme.current(newTheme);
                };

                this.allFields = (config.fields || []).map(function(fieldconfig) {
                    var f = new Field(fieldconfig);
                    // map fields names to captions
                    self.dataSourceFieldNames.push(f.name);
                    self.dataSourceFieldCaptions.push(f.caption);
                    return f;
                });

                function ensureFieldConfig(obj) {
                    if (typeof obj === 'string') {
                        return {
                            name: self.captionToName(obj)
                        };
                    }
                    return obj;
                }

                this.rowFields = (config.rows || []).map(function(fieldconfig) {
                    fieldconfig = ensureFieldConfig(fieldconfig);
                    return createfield(self, axe.Type.ROWS, fieldconfig, getfield(self.allFields, fieldconfig.name));
                });

                this.columnFields = (config.columns || []).map(function(fieldconfig) {
                    fieldconfig = ensureFieldConfig(fieldconfig);
                    return createfield(self, axe.Type.COLUMNS, fieldconfig, getfield(self.allFields, fieldconfig.name));
                });

                this.dataFields = (config.data || []).map(function(fieldconfig) {
                    fieldconfig = ensureFieldConfig(fieldconfig);
                    return createfield(self, axe.Type.DATA, fieldconfig, getfield(self.allFields, fieldconfig.name));
                });

                this.dataFieldsCount = this.dataFields ? (this.dataFields.length || 1) : 1;

                var runtimeVisibility = {
                    subtotals: {
                        rows: self.rowSettings.subTotal.visible !== undefined ? self.rowSettings.subTotal.visible : true,
                        columns: self.columnSettings.subTotal.visible !== undefined ? self.columnSettings.subTotal.visible : true
                    }
                };

                function getfield(axefields, fieldname) {
                    var fieldindex = getfieldindex(axefields, fieldname);
                    if (fieldindex > -1) {
                        return axefields[fieldindex];
                    }
                    return null;
                }

                function getfieldindex(axefields, fieldname) {
                    for (var fi = 0; fi < axefields.length; fi++) {
                        if (axefields[fi].name === fieldname) {
                            return fi;
                        }
                    }
                    return -1;
                }

                this.getField = function(fieldname) {
                    return getfield(self.allFields, fieldname);
                };

                this.getRowField = function(fieldname) {
                    return getfield(self.rowFields, fieldname);
                };

                this.getColumnField = function(fieldname) {
                    return getfield(self.columnFields, fieldname);
                };

                this.getDataField = function(fieldname) {
                    return getfield(self.dataFields, fieldname);
                };

                this.availablefields = function() {
                    return self.allFields.filter(function(field) {
                        var notequalfield = function(otherfield) {
                            return field.name !== otherfield.name;
                        };

                        return self.dataFields.every(notequalfield) &&
                            self.rowFields.every(notequalfield) &&
                            self.columnFields.every(notequalfield);
                    });
                };

                this.getDataSourceFieldCaptions = function() {
                    var row0;
                    if (self.dataSource && (row0 = self.dataSource[0])) {
                        var fieldNames = utils.ownProperties(row0);
                        var headers = [];
                        for (var i = 0; i < fieldNames.length; i++) {
                            headers.push(self.nameToCaption(fieldNames[i]));
                        }
                        return headers;
                    }
                    return null;
                };

                this.getPreFilters = function() {
                    var prefilters = {};
                    if (config.preFilters) {
                        utils.ownProperties(config.preFilters).forEach(function(filteredField) {
                            var prefilterConfig = config.preFilters[filteredField];
                            if (utils.isArray(prefilterConfig)) {
                                prefilters[self.captionToName(filteredField)] = new filtering.expressionFilter(null, null, prefilterConfig, false);
                            } else {
                                var opname = utils.ownProperties(prefilterConfig)[0];
                                if (opname) {
                                    prefilters[self.captionToName(filteredField)] = new filtering.expressionFilter(opname, prefilterConfig[opname]);
                                }
                            }
                        });
                    }

                    return prefilters;
                };

                this.moveField = function(fieldname, oldaxetype, newaxetype, position) {

                    var oldaxe, oldposition;
                    var newaxe;
                    var fieldConfig;
                    var defaultFieldConfig = getfield(self.allFields, fieldname);

                    if (defaultFieldConfig) {

                        switch (oldaxetype) {
                            case axe.Type.ROWS:
                                oldaxe = self.rowFields;
                                break;
                            case axe.Type.COLUMNS:
                                oldaxe = self.columnFields;
                                break;
                            case axe.Type.DATA:
                                oldaxe = self.dataFields;
                                break;
                            default:
                                break;
                        }

                        switch (newaxetype) {
                            case axe.Type.ROWS:
                                newaxe = self.rowFields;
                                fieldConfig = self.getRowField(fieldname);
                                break;
                            case axe.Type.COLUMNS:
                                newaxe = self.columnFields;
                                fieldConfig = self.getColumnField(fieldname);
                                break;
                            case axe.Type.DATA:
                                newaxe = self.dataFields;
                                fieldConfig = self.getDataField(fieldname);
                                break;
                            default:
                                break;
                        }

                        if (oldaxe || newaxe) {

                            var newAxeSubtotalsState = self.areSubtotalsVisible(newaxetype);

                            if (oldaxe) {
                                oldposition = getfieldindex(oldaxe, fieldname);
                                if (oldaxetype === newaxetype) {
                                    if (oldposition == oldaxe.length - 1 &&
                                        position == null ||
                                        oldposition === position - 1) {
                                        return false;
                                    }
                                }
                                oldaxe.splice(oldposition, 1);
                            }

                            var field = createfield(
                                self,
                                newaxetype,
                                fieldConfig,
                                defaultFieldConfig);

                            if (!newAxeSubtotalsState && field.subTotal.visible !== false) {
                                field.subTotal.visible = null;
                            }

                            if (newaxe) {
                                if (position != null) {
                                    newaxe.splice(position, 0, field);
                                } else {
                                    newaxe.push(field);
                                }
                            }

                            // update data fields count
                            self.dataFieldsCount = self.dataFields ? (self.dataFields.length || 1) : 1;

                            return true;
                        }
                    }
                };

                this.toggleSubtotals = function(axetype) {

                    var i;
                    var axeFields;
                    var newState = !self.areSubtotalsVisible(axetype);

                    if (axetype === axe.Type.ROWS) {
                        runtimeVisibility.subtotals.rows = newState;
                        axeFields = self.rowFields;
                    } else if (axetype === axe.Type.COLUMNS) {
                        runtimeVisibility.subtotals.columns = newState;
                        axeFields = self.columnFields;
                    } else {
                        return false;
                    }

                    newState = newState === false ? null : true;
                    for (i = 0; i < axeFields.length; i++) {
                        if (axeFields[i].subTotal.visible !== false) {
                            axeFields[i].subTotal.visible = newState;
                        }
                    }
                    return true;
                };

                this.areSubtotalsVisible = function(axetype) {
                    if (axetype === axe.Type.ROWS) {
                        return runtimeVisibility.subtotals.rows;
                    } else if (axetype === axe.Type.COLUMNS) {
                        return runtimeVisibility.subtotals.columns;
                    } else {
                        return null;
                    }
                };

                this.toggleGrandtotal = function(axetype) {
                    var newState = !self.isGrandtotalVisible(axetype);

                    if (axetype === axe.Type.ROWS) {
                        self.grandTotal.rowsvisible = newState;
                    } else if (axetype === axe.Type.COLUMNS) {
                        self.grandTotal.columnsvisible = newState;
                    } else {
                        return false;
                    }
                    return true;
                };

                this.isGrandtotalVisible = function(axetype) {
                    if (axetype === axe.Type.ROWS) {
                        return self.grandTotal.rowsvisible;
                    } else if (axetype === axe.Type.COLUMNS) {
                        return self.grandTotal.columnsvisible;
                    } else {
                        return false;
                    }
                };
            };
        }, {
            "./orb.aggregation": 2,
            "./orb.axe": 3,
            "./orb.filtering": 7,
            "./orb.themes": 11,
            "./orb.utils": 17
        }],
        5: [function(_dereq_, module, exports) {

            module.exports = function(id, parent, value, field, depth, isRoot, isLeaf) {

                var self = this;

                this.id = id;

                this.parent = parent;

                this.value = value;

                this.isRoot = isRoot;

                this.isLeaf = isLeaf;

                this.field = field;

                this.depth = depth;

                this.values = [];

                this.subdimvals = {};

                this.rowIndexes = null;

                this.getRowIndexes = function(result) {
                    if (self.rowIndexes == null) {
                        self.rowIndexes = [];
                        for (var i = 0; i < self.values.length; i++) {
                            self.subdimvals[self.values[i]].getRowIndexes(self.rowIndexes);
                        }
                    }
                    if (result != null) {
                        for (var j = 0; j < self.rowIndexes.length; j++) {
                            result.push(self.rowIndexes[j]);
                        }
                        return result;
                    } else {
                        return self.rowIndexes;
                    }
                };
            };

        }, {}],
        6: [function(_dereq_, module, exports) {






            var utils = _dereq_('./orb.utils');
            var uiheaders = _dereq_('./orb.ui.header');
            var themeManager = _dereq_('./orb.themes');

            var uriHeader = 'data:application/vnd.ms-excel;base64,';
            var docHeader = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
                '<head>' +
                '<meta http-equiv=Content-Type content="text/html; charset=UTF-8">' +
                '<!--[if gte mso 9]><xml>' +
                ' <x:ExcelWorkbook>' +
                '  <x:ExcelWorksheets>' +
                '   <x:ExcelWorksheet>' +
                '    <x:Name>###sheetname###</x:Name>' +
                '    <x:WorksheetOptions>' +
                '     <x:ProtectContents>False</x:ProtectContents>' +
                '     <x:ProtectObjects>False</x:ProtectObjects>' +
                '     <x:ProtectScenarios>False</x:ProtectScenarios>' +
                '    </x:WorksheetOptions>' +
                '   </x:ExcelWorksheet>' +
                '  </x:ExcelWorksheets>' +
                '  <x:ProtectStructure>False</x:ProtectStructure>' +
                '  <x:ProtectWindows>False</x:ProtectWindows>' +
                ' </x:ExcelWorkbook>' +
                '</xml><![endif]-->' +
                '</head>' +
                '<body>';
            var docFooter = '</body></html>';

            module.exports = function(pgridwidget) {

                var config = pgridwidget.pgrid.config;

                var currTheme = themeManager.current();
                currTheme = currTheme === 'bootstrap' ? 'white' : currTheme;
                var override = currTheme === 'white';

                var buttonTextColor = override ? 'black' : 'white';
                var themeColor = themeManager.themes[currTheme];
                var themeFadeout = themeManager.utils.fadeoutColor(themeColor, 0.1);

                var buttonStyle = 'style="font-weight: bold; color: ' + buttonTextColor + '; background-color: ' + themeColor + ';" bgcolor="' + themeColor + '"';
                var headerStyle = 'style="background-color: ' + themeFadeout + ';" bgcolor="' + themeFadeout + '"';

                function createButtonCell(caption) {
                    return '<td ' + buttonStyle + '><font color="' + buttonTextColor + '">' + caption + '</font></td>';
                }

                function createButtons(buttons, cellsCountBefore, cellsCountAfter, prefix) {
                    var i;
                    var str = prefix || '<tr>';
                    for (i = 0; i < cellsCountBefore; i++) {
                        str += '<td></td>';
                    }

                    str += buttons.reduce(function(tr, field) {
                        return (tr += createButtonCell(field.caption));
                    }, '');

                    for (i = 0; i < cellsCountAfter; i++) {
                        str += '<td></td>';
                    }
                    return str + '</tr>';
                }

                var cellsHorizontalCount = Math.max(config.dataFields.length + 1, pgridwidget.layout.pivotTable.width);

                var dataFields = createButtons(config.dataFields,
                    0,
                    cellsHorizontalCount - config.dataFields.length,
                    '<tr><td><font color="#ccc">Data</font></td>'
                );

                var sep = '<tr><td style="height: 22px;" colspan="' + cellsHorizontalCount + '"></td></tr>';

                var columnFields = createButtons(config.columnFields,
                    pgridwidget.layout.rowHeaders.width,
                    cellsHorizontalCount - (pgridwidget.layout.rowHeaders.width + config.columnFields.length)
                );

                var columnHeaders = (function() {
                    var str = '';
                    var j;
                    for (var i = 0; i < pgridwidget.columns.headers.length; i++) {
                        var currRow = pgridwidget.columns.headers[i];
                        var rowStr = '<tr>';
                        if (i < pgridwidget.columns.headers.length - 1) {
                            for (j = 0; j < pgridwidget.layout.rowHeaders.width; j++) {
                                rowStr += '<td></td>';
                            }
                        } else {
                            rowStr += config.rowFields.reduce(function(tr, field) {
                                return (tr += createButtonCell(field.caption));
                            }, '');
                        }

                        rowStr += currRow.reduce(function(tr, header) {
                            var value = header.type === uiheaders.HeaderType.DATA_HEADER ? header.value.caption : //header.value;
                                ((header.datafield && header.datafield.formatFunc) ? header.datafield.formatFunc()(header.value) : header.value);
                            header.type === uiheaders.HeaderType.SUB_TOTAL && (value += ' 小计');
                            //console.log(value, header.type, header)
                            return (tr += '<td ' + headerStyle + ' colspan="' + header.hspan(true) + '" rowspan="' + header.vspan(true) + '">' + value + '</td>');
                        }, '');
                        str += rowStr + '</tr>';
                    }
                    return str;
                }());

                var rowHeadersAndDataCells = (function() {
                    var str = '';
                    var j;
                    for (var i = 0; i < pgridwidget.rows.headers.length; i++) {
                        var currRow = pgridwidget.rows.headers[i];
                        var rowStr = '<tr>';
                        rowStr += currRow.reduce(function(tr, header) {
                            var value = (header.datafield && header.datafield.formatFunc) ? header.datafield.formatFunc()(header.value) : header.value;
                            header.type === uiheaders.HeaderType.SUB_TOTAL && (value += ' 小计');
                            //console.log(value, header.value, header)
                            return (tr += '<td ' + headerStyle + ' colspan="' + header.hspan(true) + '" rowspan="' + header.vspan(true) + '">' + value + '</td>');
                        }, '');
                        var dataRow = pgridwidget.dataRows[i];
                        rowStr += dataRow.reduce(function(tr, dataCell, index) {
                            var formatFunc = config.dataFields[index = index % config.dataFields.length].formatFunc;
                            var value = dataCell.value == null ? '' : formatFunc ? formatFunc()(dataCell.value) : dataCell.value;
                            return (tr += '<td>' + value + '</td>');
                        }, '');
                        str += rowStr + '</tr>';
                    }
                    return str;
                }());

                function toBase64(str) {
                    return str;
                    //return utils.btoa(unescape(encodeURIComponent(str)));
                }

                return uriHeader +
                    toBase64(docHeader +
                        '<table>' + dataFields + sep + columnFields + columnHeaders + rowHeadersAndDataCells + '</table>' +
                        docFooter);
            };
        }, {
            "./orb.themes": 11,
            "./orb.ui.header": 14,
            "./orb.utils": 17
        }],
        7: [function(_dereq_, module, exports) {

            var utils = _dereq_('./orb.utils');

            var filtering = module.exports = {
                ALL: '#All#',
                NONE: '#None#',
                BLANK: '#Blank#"'
            };

            filtering.expressionFilter = function(operator, term, staticValue, excludeStatic) {
                var self = this;

                this.operator = ops.get(operator);
                this.regexpMode = false;
                this.term = term || null;
                if (this.term && this.operator && this.operator.regexpSupported) {
                    if (utils.isRegExp(this.term)) {
                        this.regexpMode = true;
                        if (!this.term.ignoreCase) {
                            this.term = new RegExp(this.term.source, 'i');
                        }
                    }
                }

                this.staticValue = staticValue;
                this.excludeStatic = excludeStatic;

                this.test = function(value) {
                    if (utils.isArray(self.staticValue)) {
                        var found = self.staticValue.indexOf(value) >= 0;
                        return (self.excludeStatic && !found) || (!self.excludeStatic && found);
                    } else if (self.term) {
                        return self.operator.func(value, self.term);
                    } else if (self.staticValue === true || self.staticValue === filtering.ALL) {
                        return true;
                    } else if (self.staticValue === false || self.staticValue === filtering.NONE) {
                        return false;
                    } else {
                        return true;
                    }
                };

                this.isAlwaysTrue = function() {
                    return !(self.term || utils.isArray(self.staticValue) || self.staticValue === filtering.NONE || self.staticValue === false);
                };
            };

            var ops = filtering.Operators = {
                get: function(opname) {
                    switch (opname) {
                        case ops.MATCH.name:
                            return ops.MATCH;
                        case ops.NOTMATCH.name:
                            return ops.NOTMATCH;
                        case ops.EQ.name:
                            return ops.EQ;
                        case ops.NEQ.name:
                            return ops.NEQ;
                        case ops.GT.name:
                            return ops.GT;
                        case ops.GTE.name:
                            return ops.GTE;
                        case ops.LT.name:
                            return ops.LT;
                        case ops.LTE.name:
                            return ops.LTE;
                        default:
                            return ops.NONE;
                    }
                },
                NONE: null,
                MATCH: {
                    name: 'Matches',
                    func: function(value, term) {
                        if (value) {
                            return value.toString().search(utils.isRegExp(term) ? term : new RegExp(term, 'i')) >= 0;
                        } else {
                            return !(!!term);
                        }
                    },
                    regexpSupported: true
                },
                NOTMATCH: {
                    name: 'Does Not Match',
                    func: function(value, term) {
                        if (value) {
                            return value.toString().search(utils.isRegExp(term) ? term : new RegExp(term, 'i')) < 0;
                        } else {
                            return !!term;
                        }
                    },
                    regexpSupported: true
                },
                EQ: {
                    name: '=',
                    func: function(value, term) {
                        return value == term;
                    },
                    regexpSupported: false
                },
                NEQ: {
                    name: '<>',
                    func: function(value, term) {
                        return value != term;
                    },
                    regexpSupported: false
                },
                GT: {
                    name: '>',
                    func: function(value, term) {
                        return value > term;
                    },
                    regexpSupported: false
                },
                GTE: {
                    name: '>=',
                    func: function(value, term) {
                        return value >= term;
                    },
                    regexpSupported: false
                },
                LT: {
                    name: '<',
                    func: function(value, term) {
                        return value < term;
                    },
                    regexpSupported: false
                },
                LTE: {
                    name: '<=',
                    func: function(value, term) {
                        return value <= term;
                    },
                    regexpSupported: false
                }
            };

        }, {
            "./orb.utils": 17
        }],
        8: [function(_dereq_, module, exports) {

            var axe = _dereq_('./orb.axe');
            var configuration = _dereq_('./orb.config').config;
            var filtering = _dereq_('./orb.filtering');
            var query = _dereq_('./orb.query');
            var utils = _dereq_('./orb.utils');

            module.exports = function(config) {

                var defaultfield = {
                    name: '#undefined#'
                };

                var self = this;
                var _iCache;


                this.config = new configuration(config);
                this.filters = self.config.getPreFilters();
                this.filteredDataSource = self.config.dataSource;

                this.rows = new axe(self, axe.Type.ROWS);
                this.columns = new axe(self, axe.Type.COLUMNS);
                this.dataMatrix = {};

                function refresh(refreshFilters) {
                    if (refreshFilters !== false) {
                        refreshFilteredDataSource();
                    }
                    self.rows.update();
                    self.columns.update();
                    computeValues();
                }

                function refreshFilteredDataSource() {
                    var filterFields = utils.ownProperties(self.filters);
                    if (filterFields.length > 0) {
                        self.filteredDataSource = [];

                        for (var i = 0; i < self.config.dataSource.length; i++) {
                            var row = self.config.dataSource[i];
                            var exclude = false;
                            for (var fi = 0; fi < filterFields.length; fi++) {
                                var fieldname = filterFields[fi];
                                var fieldFilter = self.filters[fieldname];

                                if (fieldFilter && !fieldFilter.test(row[fieldname])) {
                                    exclude = true;
                                    break;
                                }
                            }
                            if (!exclude) {
                                self.filteredDataSource.push(row);
                            }
                        }
                    } else {
                        self.filteredDataSource = self.config.dataSource;
                    }
                }

                this.moveField = function(fieldname, oldaxetype, newaxetype, position) {
                    if (self.config.moveField(fieldname, oldaxetype, newaxetype, position)) {
                        refresh(false);
                        return true;
                    }
                    return false;
                };

                this.applyFilter = function(fieldname, operator, term, staticValue, excludeStatic) {
                    self.filters[fieldname] = new filtering.expressionFilter(operator, term, staticValue, excludeStatic);
                    refresh();
                };

                this.refreshData = function(data) {
                    self.config.dataSource = data;
                    refresh();
                };

                this.getFieldValues = function(field, filterFunc) {
                    var values1 = [];
                    var values = [];
                    var containsBlank = false;
                    for (var i = 0; i < self.config.dataSource.length; i++) {
                        var row = self.config.dataSource[i];
                        var val = row[field];
                        if (filterFunc !== undefined) {
                            if (filterFunc === true || (typeof filterFunc === 'function' && filterFunc(val))) {
                                values1.push(val);
                            }
                        } else {
                            if (val !== undefined) {
                                values1.push(val);
                            } else {
                                containsBlank = true;
                            }
                        }
                    }
                    if (values1.length > 1) {
                        if (utils.isNumber(values1[0]) || utils.isDate(values1[0])) {
                            values1.sort(function(a, b) {
                                return a ? (b ? a - b : 1) : (b ? -1 : 0);
                            });
                        } else {
                            values1.sort();
                        }

                        for (var vi = 0; vi < values1.length; vi++) {
                            if (vi === 0 || values1[vi] !== values[values.length - 1]) {
                                values.push(values1[vi]);
                            }
                        }
                    } else {
                        values = values1;
                    }
                    values.containsBlank = containsBlank;
                    return values;
                };

                this.getFieldFilter = function(field) {
                    return self.filters[field];
                };

                this.isFieldFiltered = function(field) {
                    var filter = self.getFieldFilter(field);
                    return filter != null && !filter.isAlwaysTrue();
                };

                this.getData = function(field, rowdim, coldim, aggregateFunc) {
                    var value;
                    if (rowdim && coldim) {

                        var datafieldName = field || (self.config.dataFields[0] || defaultfield).name;
                        var datafield = self.config.getDataField(datafieldName);

                        if (!datafield || (aggregateFunc && datafield.aggregateFunc != aggregateFunc)) {
                            value = self.calcAggregation(
                                rowdim.isRoot ? null : rowdim.getRowIndexes().slice(0),
                                coldim.isRoot ? null : coldim.getRowIndexes().slice(0), [datafieldName],
                                aggregateFunc)[datafieldName];
                        } else {
                            if (self.dataMatrix[rowdim.id] && self.dataMatrix[rowdim.id][coldim.id]) {
                                value = self.dataMatrix[rowdim.id][coldim.id][datafieldName];
                            } else {
                                value = null;
                            }
                        }
                    }

                    return value === undefined ? null : value;
                };

                this.calcAggregation = function(rowIndexes, colIndexes, fieldNames, aggregateFunc) {
                    return computeValue(rowIndexes, colIndexes, rowIndexes, fieldNames, aggregateFunc);
                };

                this.query = query(self);

                refresh();

                function computeValue(rowIndexes, colIndexes, origRowIndexes, fieldNames, aggregateFunc) {

                    var res = {};

                    if (self.config.dataFieldsCount > 0) {

                        var intersection;

                        if (rowIndexes == null) {
                            intersection = colIndexes;
                        } else if (colIndexes == null) {
                            intersection = rowIndexes;
                        } else {
                            intersection = [];
                            for (var ri = 0; ri < rowIndexes.length; ri++) {
                                var rowindex = rowIndexes[ri];
                                if (rowindex >= 0) {
                                    var colrowindex = colIndexes.indexOf(rowindex);
                                    if (colrowindex >= 0) {
                                        rowIndexes[ri] = 0 - (rowindex + 2);
                                        intersection.push(rowindex);
                                    }
                                }
                            }
                        }

                        var emptyIntersection = intersection && intersection.length === 0;
                        var datasource = self.filteredDataSource;
                        var datafield;
                        var datafields = [];

                        if (fieldNames) {
                            for (var fieldnameIndex = 0; fieldnameIndex < fieldNames.length; fieldnameIndex++) {
                                datafield = self.config.getDataField(fieldNames[fieldnameIndex]);
                                if (!aggregateFunc) {
                                    if (!datafield) {
                                        datafield = self.config.getField(fieldNames[fieldnameIndex]);
                                        if (datafield) {
                                            aggregateFunc = datafield.dataSettings ? datafield.dataSettings.aggregateFunc() : datafield.aggregateFunc();
                                        }
                                    } else {
                                        aggregateFunc = datafield.aggregateFunc();
                                    }
                                }

                                if (datafield && aggregateFunc) {
                                    datafields.push({
                                        field: datafield,
                                        aggregateFunc: aggregateFunc
                                    });
                                }
                            }
                        } else {
                            for (var datafieldIndex = 0; datafieldIndex < self.config.dataFieldsCount; datafieldIndex++) {
                                datafield = self.config.dataFields[datafieldIndex] || defaultfield;
                                if (aggregateFunc || datafield.aggregateFunc) {
                                    datafields.push({
                                        field: datafield,
                                        aggregateFunc: aggregateFunc || datafield.aggregateFunc()
                                    });
                                }
                            }
                        }

                        for (var dfi = 0; dfi < datafields.length; dfi++) {
                            datafield = datafields[dfi];
                            // no data
                            if (emptyIntersection) {
                                res[datafield.field.name] = null;
                            } else {
                                res[datafield.field.name] = datafield.aggregateFunc(datafield.field.name, intersection || 'all', self.filteredDataSource, origRowIndexes || rowIndexes, colIndexes);
                            }
                        }
                    }

                    return res;
                }

                function computeRowValues(rowDim) {

                    if (rowDim) {
                        var data = {};
                        var rid = 'r' + rowDim.id;

                        // set cached row indexes for current row dimension
                        if (_iCache[rid] === undefined) {
                            _iCache[rid] = rowDim.isRoot ? null : (_iCache[rowDim.parent.id] || rowDim.getRowIndexes());
                        }

                        // calc grand-total cell
                        data[self.columns.root.id] = computeValue(rowDim.isRoot ? null : _iCache[rid].slice(0), null);

                        if (self.columns.dimensionsCount > 0) {
                            var p = 0;
                            var parents = [self.columns.root];

                            while (p < parents.length) {
                                var parent = parents[p];
                                var rowindexes = rowDim.isRoot ?
                                    null :
                                    (parent.isRoot ?
                                        _iCache[rid].slice(0) :
                                        _iCache['c' + parent.id].slice(0));

                                for (var i = 0; i < parent.values.length; i++) {
                                    var subdim = parent.subdimvals[parent.values[i]];
                                    var cid = 'c' + subdim.id;

                                    // set cached row indexes for this column leaf dimension
                                    if (_iCache[cid] === undefined) {
                                        _iCache[cid] = _iCache[cid] || subdim.getRowIndexes().slice(0);
                                    }

                                    data[subdim.id] = computeValue(rowindexes, _iCache[cid], rowDim.isRoot ? null : rowDim.getRowIndexes());

                                    if (!subdim.isLeaf) {
                                        parents.push(subdim);
                                        if (rowindexes) {
                                            _iCache[cid] = [];
                                            for (var ur = 0; ur < rowindexes.length; ur++) {
                                                var vr = rowindexes[ur];
                                                if (vr != -1 && vr < 0) {
                                                    _iCache[cid].push(0 - (vr + 2));
                                                    rowindexes[ur] = -1;
                                                }
                                            }
                                        }
                                    }
                                }
                                _iCache['c' + parent.id] = undefined;
                                p++;
                            }
                        }

                        return data;
                    }
                }

                function computeValues() {
                    self.dataMatrix = {};
                    _iCache = {};

                    // calc grand total row
                    self.dataMatrix[self.rows.root.id] = computeRowValues(self.rows.root);

                    if (self.rows.dimensionsCount > 0) {
                        var parents = [self.rows.root];
                        var p = 0;
                        var parent;
                        while (p < parents.length) {
                            parent = parents[p];
                            // calc children rows
                            for (var i = 0; i < parent.values.length; i++) {
                                var subdim = parent.subdimvals[parent.values[i]];
                                // calc child row
                                self.dataMatrix[subdim.id] = computeRowValues(subdim);
                                // if row is not a leaf, add it to parents array to process its children
                                if (!subdim.isLeaf) {
                                    parents.push(subdim);
                                }
                            }
                            // next parent
                            p++;
                        }
                    }
                }
            };

        }, {
            "./orb.axe": 3,
            "./orb.config": 4,
            "./orb.filtering": 7,
            "./orb.query": 9,
            "./orb.utils": 17
        }],
        9: [function(_dereq_, module, exports) {

            var utils = _dereq_('./orb.utils');
            var axe = _dereq_('./orb.axe');
            var aggregation = _dereq_('./orb.aggregation');

            var queryBase = function(source, query, filters) {

                var self = this;

                this.source = source;
                this.query = query;
                this.filters = filters;

                this.extractResult = function(aggs, options, outerArgs) {
                    if (outerArgs.multi === true) {
                        var res = {};
                        for (var ai = 0; ai < options.multiFieldNames.length; ai++) {
                            res[options.multiFieldNames[ai]] = aggs[self.getCaptionName(options.multiFieldNames[ai])];
                        }
                        return res;
                    } else {
                        return aggs[outerArgs.datafieldname];
                    }
                };

                this.measureFunc = function(datafieldname, multi, aggregateFunc, fieldsConfig) {

                    var outerArgs = {
                        datafieldname: self.getCaptionName(datafieldname),
                        multi: multi,
                        aggregateFunc: aggregateFunc
                    };

                    return function(options) {
                        options = self.cleanOptions(options, arguments, outerArgs);
                        var aggs = self.compute(options, fieldsConfig, multi);
                        return self.extractResult(aggs, options, outerArgs);
                    };
                };

                this.setDefaultAggFunctions = function(param) {

                    // if there is a registered field with a name or caption 'val', use 'val_'
                    var valname = self.query.val ? 'val_' : 'val';
                    self.query[valname] = self.measureFunc(undefined, true, undefined, param);


                    var aggFunctions = utils.ownProperties(aggregation);
                    for (var funcIndex = 0; funcIndex < aggFunctions.length; funcIndex++) {
                        var funcName = aggFunctions[funcIndex];
                        if (funcName !== 'toAggregateFunc') {
                            self.query[funcName] = self.measureFunc(
                                undefined,
                                true,
                                aggregation[funcName],
                                param
                            );
                        }
                    }
                };

            };

            var pgridQuery = function(pgrid) {

                queryBase.call(this, pgrid, {}, {});

                var self = this;

                this.getCaptionName = function(caption) {
                    return self.source.config.captionToName(caption);
                };

                this.cleanOptions = function(options, innerArgs, outerArgs) {
                    var opts = {
                        fieldNames: []
                    };

                    if (outerArgs.multi === true) {
                        if (options && typeof options === 'object') {
                            opts.aggregateFunc = options.aggregateFunc;
                            opts.multiFieldNames = options.fields;
                        } else {
                            opts.aggregateFunc = outerArgs.aggregateFunc;
                            opts.multiFieldNames = innerArgs;
                        }

                        for (var ai = 0; ai < opts.multiFieldNames.length; ai++) {
                            opts.fieldNames.push(self.getCaptionName(opts.multiFieldNames[ai]));
                        }
                    } else {
                        opts.aggregateFunc = options;
                        opts.fieldNames.push(outerArgs.datafieldname);
                    }

                    if (opts.aggregateFunc) {
                        opts.aggregateFunc = aggregation.toAggregateFunc(opts.aggregateFunc);
                    }

                    return opts;
                };

                this.setup = function(parameters) {
                    var rowFields = self.source.config.rowFields;
                    var colFields = self.source.config.columnFields;
                    var datafields = self.source.config.dataFields;
                    var fIndex;

                    // row fields setup
                    for (fIndex = 0; fIndex < rowFields.length; fIndex++) {
                        self.slice(rowFields[fIndex], axe.Type.ROWS, rowFields.length - fIndex);
                    }

                    // column fields setup
                    for (fIndex = 0; fIndex < colFields.length; fIndex++) {
                        self.slice(colFields[fIndex], axe.Type.COLUMNS, colFields.length - fIndex);
                    }

                    // data fields setup
                    for (fIndex = 0; fIndex < datafields.length; fIndex++) {
                        var df = datafields[fIndex];
                        var dfname = df.name;
                        var dfcaption = df.caption || dfname;

                        self.query[dfname] = self.query[dfcaption] = self.measureFunc(dfname);
                    }

                    if (parameters) {
                        for (var param in parameters) {
                            if (parameters.hasOwnProperty(param)) {
                                self.query[param](parameters[param]);
                            }
                        }
                    }

                    self.setDefaultAggFunctions();

                    return self.query;
                };

                this.slice = function(field, axetype, depth) {
                    self.query[field.name] = self.query[field.caption || field.name] = function(val) {
                        var f = {
                            name: field.name,
                            val: val,
                            depth: depth
                        };
                        (self.filters[axetype] = self.filters[axetype] || []).push(f);
                        return self.query;
                    };
                };

                function filterDimensions(upperDims, filter) {
                    return function(dim) {
                        return dim.value === filter.val &&
                            (!upperDims || upperDims.some(
                                function(upperDim) {
                                    var parent = dim.parent;
                                    if (parent) {
                                        while (parent.depth < upperDim.depth) {
                                            parent = parent.parent;
                                        }
                                    }
                                    return parent === upperDim;
                                }));
                    };
                }

                this.applyFilters = function(axetype) {
                    if (self.filters[axetype]) {
                        var sortedFilters = self.filters[axetype].sort(function(f1, f2) {
                            return f2.depth - f1.depth;
                        });

                        var currAxe = self.source[axetype === axe.Type.ROWS ? 'rows' : 'columns'];
                        var filterIndex = 0;
                        var filtered = null;
                        while (filterIndex < sortedFilters.length) {
                            var filter = sortedFilters[filterIndex];
                            filtered = currAxe.dimensionsByDepth[filter.depth]
                                .filter(filterDimensions(filtered, filter));
                            filterIndex++;
                        }
                        return filtered;
                    }
                    return null;
                };

                this.compute = function(options) {
                    var rowdims = self.applyFilters(axe.Type.ROWS) || [self.source.rows.root];
                    var coldims = self.applyFilters(axe.Type.COLUMNS) || [self.source.columns.root];

                    var aggs;

                    if (rowdims.length === 1 && coldims.length === 1) {
                        aggs = {};
                        for (var ai = 0; ai < options.fieldNames.length; ai++) {
                            aggs[options.fieldNames[ai]] = self.source.getData(options.fieldNames[ai], rowdims[0], coldims[0], options.aggregateFunc);
                        }
                    } else {
                        var rowIndexes = [];
                        var colIndexes = [];

                        for (var rdi = 0; rdi < rowdims.length; rdi++) {
                            rowIndexes = rowIndexes.concat(rowdims[rdi].getRowIndexes());
                        }
                        for (var cdi = 0; cdi < coldims.length; cdi++) {
                            colIndexes = colIndexes.concat(coldims[cdi].getRowIndexes());
                        }

                        aggs = self.source.calcAggregation(rowIndexes, colIndexes, options.fieldNames, options.aggregateFunc);
                    }

                    return aggs;
                };
            };

            var arrayQuery = function(array) {

                queryBase.call(this, array, {}, []);

                var self = this;
                var captionToName = {};

                this.setCaptionName = function(caption, name) {
                    captionToName[caption || name] = name;
                };

                this.getCaptionName = function(caption) {
                    return captionToName[caption] || caption;
                };

                this.cleanOptions = function(options, innerArgs, outerArgs) {
                    var opts = {
                        fieldNames: []
                    };

                    if (outerArgs.multi === true) {
                        if (options && typeof options === 'object') {
                            opts.aggregateFunc = options.aggregateFunc;
                            opts.multiFieldNames = options.fields;
                        } else {
                            opts.aggregateFunc = outerArgs.aggregateFunc;
                            opts.multiFieldNames = innerArgs;
                        }

                        for (var ai = 0; ai < opts.multiFieldNames.length; ai++) {
                            opts.fieldNames.push(self.getCaptionName(opts.multiFieldNames[ai]));
                        }
                    } else {
                        opts.aggregateFunc = options || outerArgs.aggregateFunc;
                        opts.fieldNames.push(outerArgs.datafieldname);
                    }

                    return opts;
                };

                this.setup = function(fieldsConfig) {

                    self.query.slice = function(field, val) {
                        var f = {
                            name: field,
                            val: val
                        };
                        self.filters.push(f);
                        return self.query;
                    };

                    if (fieldsConfig) {

                        var fieldNames = utils.ownProperties(fieldsConfig);

                        for (var fi = 0; fi < fieldNames.length; fi++) {
                            var fname = fieldNames[fi];
                            var f = fieldsConfig[fname];
                            var fcaption = f.caption || f.name;
                            f.name = fname;

                            self.setCaptionName(fcaption, fname);

                            if (f.toAggregate) {
                                self.query[fname] = self.query[fcaption] = self.measureFunc(fname, false, f.aggregateFunc);
                            } else {
                                self.slice(f);
                            }
                        }
                    }

                    self.setDefaultAggFunctions(fieldsConfig);

                    return self.query;
                };

                this.slice = function(field) {
                    self.query[field.name] = self.query[field.caption || field.name] = function(val) {
                        return self.query.slice(field.name, val);
                    };
                };

                this.applyFilters = function() {
                    var rowIndexes = [];

                    for (var i = 0; i < self.source.length; i++) {
                        var row = self.source[i];
                        var include = true;
                        for (var j = 0; j < self.filters.length; j++) {
                            var filter = self.filters[j];
                            if (row[filter.name] !== filter.val) {
                                include = false;
                                break;
                            }
                        }
                        if (include) {
                            rowIndexes.push(i);
                        }
                    }

                    return rowIndexes;
                };

                this.compute = function(options, fieldsConfig, multi) {
                    var rowIndexes = self.applyFilters();

                    var aggs = {};

                    for (var ai = 0; ai < options.fieldNames.length; ai++) {
                        var datafield = options.fieldNames[ai];
                        var aggFunc = aggregation.toAggregateFunc(
                            multi === true ?
                            options.aggregateFunc || (fieldsConfig && fieldsConfig[datafield] ?
                                fieldsConfig[datafield].aggregateFunc :
                                undefined) :
                            options.aggregateFunc);

                        aggs[datafield] = aggFunc(datafield, rowIndexes || 'all', self.source, rowIndexes, null);
                    }

                    return aggs;
                };
            };

            module.exports = function(source, fieldsConfig) {
                if (utils.isArray(source)) {
                    return new arrayQuery(source).setup(fieldsConfig);
                } else {
                    // assume it's a pgrid
                    return function(parameters) {
                        return new pgridQuery(source).setup(parameters);
                    };
                }
            };

        }, {
            "./orb.aggregation": 2,
            "./orb.axe": 3,
            "./orb.utils": 17
        }],
        10: [function(_dereq_, module, exports) {



            module.exports = function() {
                var states = {};

                this.set = function(key, state) {
                    states[key] = state;
                };

                this.get = function(key) {
                    return states[key];
                };
            };
        }, {}],
        11: [function(_dereq_, module, exports) {

            module.exports = (function() {

                var currentTheme = 'blue';
                var themeManager = {};

                function isBootstrap() {
                    return currentTheme === 'bootstrap';
                }

                themeManager.themes = {
                    red: '#C72C48',
                    blue: '#5bc0de',
                    green: '#3fb618',
                    orange: '#df691a',
                    flower: '#A74AC7',
                    gray: '#808080',
                    black: '#000000',
                    white: '#FFFFFF'
                };

                themeManager.current = function(newTheme) {
                    if (newTheme) {
                        currentTheme = themeManager.validateTheme(newTheme);
                    }

                    return currentTheme;
                };

                themeManager.validateTheme = function(themeName) {
                    themeName = (themeName || '').toString().trim();
                    if (!themeManager.themes[themeName] && themeName !== 'bootstrap') {
                        return 'blue';
                    } else {
                        return themeName;
                    }
                };

                themeManager.getPivotClasses = function() {
                    return {
                        container: 'orb-container orb-' + currentTheme,
                        table: 'orb' + (isBootstrap() ? ' table' : '')
                    };
                };

                themeManager.getButtonClasses = function() {
                    return {
                        pivotButton: 'fld-btn' + (isBootstrap() ? ' btn btn-default btn-xs' : ''),
                        orbButton: 'orb-btn' + (isBootstrap() ? ' btn btn-default btn-xs' : ''),
                        scrollBar: isBootstrap() ? ' btn btn-default btn-xs' : ''
                    };
                };

                themeManager.getFilterClasses = function() {
                    return {
                        container: 'orb-' + currentTheme + ' orb fltr-cntnr'
                    };
                };

                themeManager.getGridClasses = function() {
                    return {
                        table: isBootstrap() ? 'table table-condensed' : 'orb-table'
                    };
                };

                themeManager.getDialogClasses = function(visible) {
                    var classes = {
                        overlay: 'orb-overlay orb-overlay-' + (visible ? 'visible' : 'hidden') + ' orb-' + currentTheme,
                        dialog: 'orb-dialog',
                        content: '',
                        header: 'orb-dialog-header',
                        title: '',
                        body: 'orb-dialog-body'
                    };

                    if (isBootstrap()) {
                        classes.overlay += ' modal';
                        classes.dialog += ' modal-dialog';
                        classes.content = 'modal-content';
                        classes.header += ' modal-header';
                        classes.title = 'modal-title';
                        classes.body += ' modal-body';
                    }
                    return classes;
                };

                var utils = themeManager.utils = {
                    hexToRgb: function(hex) {
                        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                        return result ? {
                            r: parseInt(result[1], 16),
                            g: parseInt(result[2], 16),
                            b: parseInt(result[3], 16)
                        } : null;
                    },
                    rgbaToHex: function(rgba) {
                        var matches = rgba.match(/rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)/);
                        if (matches) {
                            var alpah = parseFloat(matches[4]);
                            return '#' +
                                utils.applyAlphaAndToHex(matches[1], alpah) +
                                utils.applyAlphaAndToHex(matches[2], alpah) +
                                utils.applyAlphaAndToHex(matches[3], alpah);
                        }
                        return null;
                    },
                    applyAlphaAndToHex: function(value, alpha) {
                        return (Math.floor(alpha * parseInt(value) + (1 - alpha) * 255) + 256).toString(16).substr(1, 2);
                    },
                    fadeoutColor: function(color, alpha) {
                        color = utils.hexToRgb(color);
                        return '#' +
                            utils.applyAlphaAndToHex(color.r, alpha) +
                            utils.applyAlphaAndToHex(color.g, alpha) +
                            utils.applyAlphaAndToHex(color.b, alpha);
                    }
                };

                return themeManager;
            }());

        }, {}],
        12: [function(_dereq_, module, exports) {

            var axe = _dereq_('./orb.axe');
            var uiheaders = _dereq_('./orb.ui.header');

            module.exports = function(axeModel) {

                var self = this;


                this.axe = axeModel;


                this.headers = [];

                this.dataFieldsCount = function() {
                    return (self.axe.pgrid.config.dataHeadersLocation === 'columns' && self.axe.type === axe.Type.COLUMNS) ||
                        (self.axe.pgrid.config.dataHeadersLocation === 'rows' && self.axe.type === axe.Type.ROWS) ?
                        self.axe.pgrid.config.dataFieldsCount :
                        1;
                };

                this.isMultiDataFields = function() {
                    return self.dataFieldsCount() > 1;
                };

                this.toggleFieldExpansion = function(field, newState) {
                    var toToggle = [];
                    var allExpanded = true;
                    var hIndex;

                    for (var i = 0; i < this.headers.length; i++) {
                        for (hIndex = 0; hIndex < this.headers[i].length; hIndex++) {
                            var header = this.headers[i][hIndex];
                            if (header.type === uiheaders.HeaderType.SUB_TOTAL && (field == null || header.dim.field.name == field.name)) {
                                toToggle.push(header);
                                allExpanded = allExpanded && header.expanded;
                            }
                        }
                    }

                    if (newState !== undefined) {
                        allExpanded = !newState;
                    }

                    if (toToggle.length > 0) {
                        for (hIndex = 0; hIndex < toToggle.length; hIndex++) {
                            if (allExpanded) {
                                toToggle[hIndex].collapse();
                            } else {
                                toToggle[hIndex].expand();
                            }
                        }
                        return true;
                    }

                    return false;
                };
            };

        }, {
            "./orb.axe": 3,
            "./orb.ui.header": 14
        }],
        13: [function(_dereq_, module, exports) {

            var axe = _dereq_('./orb.axe');
            var axeUi = _dereq_('./orb.ui.axe');
            var uiheaders = _dereq_('./orb.ui.header');

            module.exports = function(columnsAxe) {

                var self = this;

                axeUi.call(self, columnsAxe);

                this.leafsHeaders = null;

                this.build = function() {
                    self.headers = [];

                    if (self.axe != null) {
                        // Fill columns layout infos
                        if (self.axe.root.values.length > 0 || self.axe.pgrid.config.grandTotal.columnsvisible) {
                            for (var depth = self.axe.root.depth; depth > 1; depth--) {
                                self.headers.push([]);
                                getUiInfo(depth, self.headers);
                            }

                            if (self.axe.pgrid.config.grandTotal.columnsvisible) {
                                // add grandtotal header
                                (self.headers[0] = self.headers[0] || []).push(new uiheaders.header(axe.Type.COLUMNS, uiheaders.HeaderType.GRAND_TOTAL, self.axe.root, null, self.dataFieldsCount()));
                            }
                        }

                        if (self.headers.length === 0) {
                            self.headers.push([new uiheaders.header(axe.Type.COLUMNS, uiheaders.HeaderType.INNER, self.axe.root, null, self.dataFieldsCount())]);
                        }

                        // generate leafs headers
                        generateLeafsHeaders();
                    }
                };

                function generateLeafsHeaders() {

                    var leafsHeaders = [];

                    function pushsubtotal(pheader) {
                        if (pheader && pheader.dim.field.subTotal.visible) {
                            leafsHeaders.push(pheader.subtotalHeader);
                        }
                    }

                    if (self.headers.length > 0) {
                        // last headers row
                        var infos = self.headers[self.headers.length - 1];
                        var header = infos[0];

                        if (header) {
                            var currparent,
                                prevpar = header.parent;

                            for (var i = 0; i < infos.length; i++) {
                                header = infos[i];
                                currparent = header.parent;
                                // if current header parent is different than previous header parent,
                                // add previous parent
                                if (currparent != prevpar) {
                                    pushsubtotal(prevpar);
                                    if (currparent != null) {
                                        // walk up parent hierarchy and add grand parents if different 
                                        // than current header grand parents
                                        var grandpar = currparent.parent;
                                        var prevgrandpar = prevpar ? prevpar.parent : null;
                                        while (grandpar != prevgrandpar && prevgrandpar != null) {
                                            pushsubtotal(prevgrandpar);
                                            grandpar = grandpar ? grandpar.parent : null;
                                            prevgrandpar = prevgrandpar ? prevgrandpar.parent : null;
                                        }
                                    }
                                    // update previous parent variable
                                    prevpar = currparent;
                                }
                                // push current header
                                leafsHeaders.push(infos[i]);

                                // if it's the last header, add all of its parents up to the top
                                if (i === infos.length - 1) {
                                    while (prevpar != null) {
                                        pushsubtotal(prevpar);
                                        prevpar = prevpar.parent;
                                    }
                                }
                            }
                            // grandtotal is visible for columns and if there is more than one dimension in this axe
                            if (self.axe.pgrid.config.grandTotal.columnsvisible && self.axe.dimensionsCount > 1) {
                                // push also grand total header
                                leafsHeaders.push(self.headers[0][self.headers[0].length - 1]);
                            }
                        }
                    }

                    // add data headers if more than 1 data field and they willbe the leaf headers
                    if (self.isMultiDataFields()) {
                        self.leafsHeaders = [];
                        for (var leafIndex = 0; leafIndex < leafsHeaders.length; leafIndex++) {
                            for (var datafieldindex = 0; datafieldindex < self.dataFieldsCount(); datafieldindex++) {
                                self.leafsHeaders.push(new uiheaders.dataHeader(self.axe.pgrid.config.dataFields[datafieldindex], leafsHeaders[leafIndex]));
                            }
                        }
                        self.headers.push(self.leafsHeaders);
                    } else {
                        self.leafsHeaders = leafsHeaders;
                    }
                }

                this.build();


                function getUiInfo(depth, headers) {

                    var infos = headers[headers.length - 1];
                    var parents = self.axe.root.depth === depth ? [null] :
                        headers[self.axe.root.depth - depth - 1].filter(function(p) {
                            return p.type !== uiheaders.HeaderType.SUB_TOTAL;
                        });

                    for (var pi = 0; pi < parents.length; pi++) {

                        var parent = parents[pi];
                        var parentDim = parent == null ? self.axe.root : parent.dim;

                        for (var di = 0; di < parentDim.values.length; di++) {

                            var subvalue = parentDim.values[di];
                            var subdim = parentDim.subdimvals[subvalue];

                            var subtotalHeader;
                            if (!subdim.isLeaf && subdim.field.subTotal.visible) {
                                subtotalHeader = new uiheaders.header(axe.Type.COLUMNS, uiheaders.HeaderType.SUB_TOTAL, subdim, parent, self.dataFieldsCount());
                            } else {
                                subtotalHeader = null;
                            }

                            var header = new uiheaders.header(axe.Type.COLUMNS, null, subdim, parent, self.dataFieldsCount(), subtotalHeader);
                            infos.push(header);

                            if (!subdim.isLeaf && subdim.field.subTotal.visible) {
                                infos.push(subtotalHeader);
                            }
                        }
                    }
                }
            };

        }, {
            "./orb.axe": 3,
            "./orb.ui.axe": 12,
            "./orb.ui.header": 14
        }],
        14: [function(_dereq_, module, exports) {

            var axe = _dereq_('./orb.axe');
            var state = new(_dereq_('./orb.state'))();

            var HeaderType = module.exports.HeaderType = {
                EMPTY: 1,
                DATA_HEADER: 2,
                DATA_VALUE: 3,
                FIELD_BUTTON: 4,
                INNER: 5,
                WRAPPER: 6,
                SUB_TOTAL: 7,
                GRAND_TOTAL: 8,
                getHeaderClass: function(headerType, axetype) {
                    var cssclass = axetype === axe.Type.ROWS ? 'header-row' : (axetype === axe.Type.COLUMNS ? 'header-col' : '');
                    switch (headerType) {
                        case HeaderType.EMPTY:
                        case HeaderType.FIELD_BUTTON:
                            cssclass = 'empty';
                            break;
                        case HeaderType.INNER:
                            cssclass = 'header ' + cssclass;
                            break;
                        case HeaderType.WRAPPER:
                            cssclass = 'header ' + cssclass;
                            break;
                        case HeaderType.SUB_TOTAL:
                            cssclass = 'header header-st ' + cssclass;
                            break;
                        case HeaderType.GRAND_TOTAL:
                            cssclass = 'header header-gt ' + cssclass;
                            break;
                    }

                    return cssclass;
                },
                getCellClass: function(rowHeaderType, colHeaderType) {
                    var cssclass = '';
                    switch (rowHeaderType) {
                        case HeaderType.GRAND_TOTAL:
                            cssclass = 'cell-gt';
                            break;
                        case HeaderType.SUB_TOTAL:
                            if (colHeaderType === HeaderType.GRAND_TOTAL) {
                                cssclass = 'cell-gt';
                            } else {
                                cssclass = 'cell-st';
                            }
                            break;
                        default:
                            if (colHeaderType === HeaderType.GRAND_TOTAL) {
                                cssclass = 'cell-gt';
                            } else if (colHeaderType === HeaderType.SUB_TOTAL) {
                                cssclass = 'cell-st';
                            } else {
                                cssclass = '';
                            }
                    }
                    return cssclass;
                }
            };

            function CellBase(options) {

                this.axetype = options.axetype;

                this.type = options.type;

                this.template = options.template;

                this.value = options.value;

                this.expanded = true;

                this.cssclass = options.cssclass;

                this.hspan = options.hspan || function() {
                    return 1;
                };

                this.vspan = options.vspan || function() {
                    return 1;
                };

                this.visible = options.isvisible || function() {
                    return true;
                };

                this.key = this.axetype + this.type + this.value;
                this.getState = function() {
                    return state.get(this.key);
                };
                this.setState = function(newState) {
                    state.set(this.key, newState);
                };
            }

            module.exports.header = function(axetype, headerType, dim, parent, datafieldscount, subtotalHeader) {

                var self = this;

                var hspan;
                var vspan;
                var value;

                var isRowsAxe = axetype === axe.Type.ROWS;
                headerType = headerType || (dim.depth === 1 ? HeaderType.INNER : HeaderType.WRAPPER);

                switch (headerType) {
                    case HeaderType.GRAND_TOTAL:
                        value = '总计'; //'Grand Total';
                        hspan = isRowsAxe ? dim.depth - 1 || 1 : datafieldscount;
                        vspan = isRowsAxe ? datafieldscount : dim.depth - 1 || 1;
                        break;
                    case HeaderType.SUB_TOTAL:
                        value = dim.value;
                        hspan = isRowsAxe ? dim.depth : datafieldscount;
                        vspan = isRowsAxe ? datafieldscount : dim.depth;
                        break;
                    default:
                        value = dim.value;
                        hspan = isRowsAxe ? 1 : null;
                        vspan = isRowsAxe ? null : 1;
                        break;
                }

                this.datafield = dim.field;

                CellBase.call(this, {
                    axetype: axetype,
                    type: headerType,
                    template: isRowsAxe ? 'cell-template-row-header' : 'cell-template-column-header',
                    value: value,
                    cssclass: HeaderType.getHeaderClass(headerType, axetype),
                    hspan: hspan != null ? function() {
                        return hspan;
                    } : calcSpan,
                    vspan: vspan != null ? function() {
                        return vspan;
                    } : calcSpan,
                    isvisible: isParentExpanded
                });

                this.subtotalHeader = subtotalHeader;
                this.parent = parent;
                this.subheaders = [];
                this.dim = dim;
                this.expanded = this.getState() ? this.getState().expanded : (headerType !== HeaderType.SUB_TOTAL || !dim.field.subTotal.collapsed);

                this.expand = function() {
                    self.expanded = true;
                    this.setState({
                        expanded: self.expanded
                    });
                };
                this.collapse = function() {
                    self.expanded = false;
                    this.setState({
                        expanded: self.expanded
                    });
                };

                if (parent != null) {
                    parent.subheaders.push(this);
                }

                function isParentExpanded() {
                    if (self.type === HeaderType.SUB_TOTAL) {
                        var hparent = self.parent;
                        while (hparent != null) {
                            if (hparent.subtotalHeader && !hparent.subtotalHeader.expanded) {
                                return false;
                            }
                            hparent = hparent.parent;
                        }
                        return true;
                    } else {

                        var isexpanded = self.dim.isRoot || self.dim.isLeaf || !self.dim.field.subTotal.visible || self.subtotalHeader.expanded;
                        if (!isexpanded) {
                            return false;
                        }

                        var par = self.parent;
                        while (par != null && (!par.dim.field.subTotal.visible || (par.subtotalHeader != null && par.subtotalHeader.expanded))) {
                            par = par.parent;
                        }
                        return par == null || par.subtotalHeader == null ? isexpanded : par.subtotalHeader.expanded;
                    }
                }

                function calcSpan(ignoreVisibility) {
                    var tspan = 0;
                    var subSpan;
                    var addone = false;

                    if (isRowsAxe || ignoreVisibility || self.visible()) {
                        if (!self.dim.isLeaf) {
                            // subdimvals 'own' properties are the set of values for this dimension
                            if (self.subheaders.length > 0) {
                                for (var i = 0; i < self.subheaders.length; i++) {
                                    var subheader = self.subheaders[i];
                                    // if its not an array
                                    if (!subheader.dim.isLeaf) {
                                        subSpan = isRowsAxe ? subheader.vspan() : subheader.hspan();
                                        tspan += subSpan;
                                        if (i === 0 && (subSpan === 0)) {
                                            addone = true;
                                        }
                                    } else {
                                        tspan += datafieldscount;
                                    }
                                }
                            } else {
                                tspan += datafieldscount;
                            }
                        } else {
                            return datafieldscount;
                        }
                        return tspan + (addone ? 1 : 0);
                    }
                    return tspan;
                }
            };

            module.exports.dataHeader = function(datafield, parent) {

                CellBase.call(this, {
                    axetype: null,
                    type: HeaderType.DATA_HEADER,
                    template: 'cell-template-dataheader',
                    value: datafield,
                    cssclass: HeaderType.getHeaderClass(parent.type, parent.axetype),
                    isvisible: parent.visible
                });

                this.parent = parent;
            };

            module.exports.dataCell = function(pgrid, isvisible, rowinfo, colinfo) {

                this.rowDimension = rowinfo.type === HeaderType.DATA_HEADER ? rowinfo.parent.dim : rowinfo.dim;
                this.columnDimension = colinfo.type === HeaderType.DATA_HEADER ? colinfo.parent.dim : colinfo.dim;
                this.rowType = rowinfo.type === HeaderType.DATA_HEADER ? rowinfo.parent.type : rowinfo.type;
                this.colType = colinfo.type === HeaderType.DATA_HEADER ? colinfo.parent.type : colinfo.type;

                this.datafield = pgrid.config.dataFieldsCount > 1 ?
                    (pgrid.config.dataHeadersLocation === 'rows' ?
                        rowinfo.value :
                        colinfo.value) :
                    pgrid.config.dataFields[0];

                CellBase.call(this, {
                    axetype: null,
                    type: HeaderType.DATA_VALUE,
                    template: 'cell-template-datavalue',
                    value: pgrid.getData(this.datafield ? this.datafield.name : null, this.rowDimension, this.columnDimension),
                    cssclass: 'cell ' + HeaderType.getCellClass(this.rowType, this.colType),
                    isvisible: isvisible
                });
            };

            module.exports.buttonCell = function(field) {

                CellBase.call(this, {
                    axetype: null,
                    type: HeaderType.FIELD_BUTTON,
                    template: 'cell-template-fieldbutton',
                    value: field,
                    cssclass: HeaderType.getHeaderClass(HeaderType.FIELD_BUTTON)
                });
            };

            module.exports.emptyCell = function(hspan, vspan) {

                CellBase.call(this, {
                    axetype: null,
                    type: HeaderType.EMPTY,
                    template: 'cell-template-empty',
                    value: null,
                    cssclass: HeaderType.getHeaderClass(HeaderType.EMPTY),
                    hspan: function() {
                        return hspan;
                    },
                    vspan: function() {
                        return vspan;
                    }
                });
            };

        }, {
            "./orb.axe": 3,
            "./orb.state": 10
        }],
        15: [function(_dereq_, module, exports) {

            var axe = _dereq_('./orb.axe');
            var pgrid = _dereq_('./orb.pgrid');
            var uiheaders = _dereq_('./orb.ui.header');
            var uirows = _dereq_('./orb.ui.rows');
            var uicols = _dereq_('./orb.ui.cols');
            //var React = require('react');
            //var OrbReactComps = require('./react/orb.react.compiled');

            module.exports = function(config) {

                var self = this;
                var renderElement;
                //var pivotComponent;
                //var dialog = OrbReactComps.Dialog.create();


                this.pgrid = new pgrid(config);


                this.rows = null;

                this.columns = null;


                this.dataRows = [];

                this.layout = {
                    rowHeaders: {

                        width: null,

                        height: null
                    },
                    columnHeaders: {

                        width: null,

                        height: null
                    },
                    pivotTable: {

                        width: null,

                        height: null
                    }
                };

                this.sort = function(axetype, field) {
                    if (axetype === axe.Type.ROWS) {
                        self.pgrid.rows.sort(field);
                    } else if (axetype === axe.Type.COLUMNS) {
                        self.pgrid.columns.sort(field);
                    } else {
                        return;
                    }

                    buildUi();
                };

                this.refreshData = function(data) {
                    self.pgrid.refreshData(data);
                    buildUi();
                    //pivotComponent.setProps({});
                };

                this.applyFilter = function(fieldname, operator, term, staticValue, excludeStatic) {
                    self.pgrid.applyFilter(fieldname, operator, term, staticValue, excludeStatic);
                    buildUi();
                };

                this.moveField = function(field, oldAxeType, newAxeType, position) {
                    if (self.pgrid.moveField(field, oldAxeType, newAxeType, position)) {
                        buildUi();
                        return true;
                    }
                    return false;
                };

                this.toggleFieldExpansion = function(axetype, field, newState) {
                    if (axetype === axe.Type.ROWS) {
                        return self.rows.toggleFieldExpansion(field, newState);
                    } else if (axetype === axe.Type.COLUMNS) {
                        return self.columns.toggleFieldExpansion(field, newState);
                    }
                    return false;
                };

                this.toggleSubtotals = function(axetype) {
                    if (self.pgrid.config.toggleSubtotals(axetype)) {
                        buildUi();
                        return true;
                    }
                    return false;
                };

                this.areSubtotalsVisible = function(axetype) {
                    return self.pgrid.config.areSubtotalsVisible(axetype);
                };

                this.toggleGrandtotal = function(axetype) {
                    if (self.pgrid.config.toggleGrandtotal(axetype)) {
                        buildUi();
                        return true;
                    }
                    return false;
                };

                this.isGrandtotalVisible = function(axetype) {
                    return self.pgrid.config.isGrandtotalVisible(axetype);
                };

                this.changeTheme = function(newTheme) {
                    //pivotComponent.changeTheme(newTheme);
                };

                this.render = function(element) {
                    renderElement = element;
                    //        if(renderElement) {
                    //            var pivotTableFactory = React.createFactory(OrbReactComps.PivotTable);
                    //            var pivottable = pivotTableFactory({
                    //                pgridwidget: self
                    //            });
                    //
                    //            pivotComponent = React.render(pivottable, element);
                    //        }
                };

                this.drilldown = function(dataCell, pivotId) {
                    //        if(dataCell) {
                    //            var colIndexes = dataCell.columnDimension.getRowIndexes();
                    //            var data = dataCell.rowDimension.getRowIndexes().filter(function(index) {
                    //                return colIndexes.indexOf(index) >= 0;
                    //            }).map(function(index) {
                    //                return self.pgrid.filteredDataSource[index];
                    //            });
                    //
                    //            var title;
                    //            if(dataCell.rowType === uiheaders.HeaderType.GRAND_TOTAL && dataCell.colType === uiheaders.HeaderType.GRAND_TOTAL) {
                    //                title = 'Grand total';
                    //            } else {
                    //                if(dataCell.rowType === uiheaders.HeaderType.GRAND_TOTAL) {
                    //                    title = dataCell.columnDimension.value + '/Grand total ';
                    //                } else if(dataCell.colType === uiheaders.HeaderType.GRAND_TOTAL) {
                    //                    title = dataCell.rowDimension.value + '/Grand total ';
                    //                } else {
                    //                    title = dataCell.rowDimension.value + '/' + dataCell.columnDimension.value;
                    //                }
                    //            }
                    //
                    ////            var pivotStyle = window.getComputedStyle( pivotComponent.getDOMNode(), null );
                    ////
                    ////            dialog.show({
                    ////                title: title,
                    ////                comp: {
                    ////                    type: OrbReactComps.Grid,
                    ////                    props: {                    
                    ////                        headers: self.pgrid.config.getDataSourceFieldCaptions(),
                    ////                        data: data,
                    ////                        theme: self.pgrid.config.theme
                    ////                    }
                    ////                },
                    ////                theme: self.pgrid.config.theme,
                    ////                style: {
                    ////                    fontFamily: pivotStyle.getPropertyValue('font-family'),
                    ////                    fontSize: pivotStyle.getPropertyValue('font-size')
                    ////                }
                    ////            });
                    //        }
                };

                //this.excelExport = function() {
                //    return OrbReactComps.Export.excelExport(this);
                //};

                buildUi();

                function buildUi() {

                    // build row and column headers
                    self.rows = new uirows(self.pgrid.rows);
                    self.columns = new uicols(self.pgrid.columns);

                    var rowsHeaders = self.rows.headers;
                    var columnsLeafHeaders = self.columns.leafsHeaders;

                    // set control layout infos		
                    self.layout = {
                        rowHeaders: {
                            width: (self.pgrid.rows.fields.length || 1) +
                                (self.pgrid.config.dataHeadersLocation === 'rows' && self.pgrid.config.dataFieldsCount > 1 ? 1 : 0),
                            height: rowsHeaders.length
                        },
                        columnHeaders: {
                            width: self.columns.leafsHeaders.length,
                            height: (self.pgrid.columns.fields.length || 1) +
                                (self.pgrid.config.dataHeadersLocation === 'columns' && self.pgrid.config.dataFieldsCount > 1 ? 1 : 0)
                        }
                    };

                    self.layout.pivotTable = {
                        width: self.layout.rowHeaders.width + self.layout.columnHeaders.width,
                        height: self.layout.rowHeaders.height + self.layout.columnHeaders.height
                    };

                    var dataRows = [];
                    var arr;

                    function createVisibleFunc(rowvisible, colvisible) {
                        return function() {
                            return rowvisible() && colvisible();
                        };
                    }
                    if (rowsHeaders.length > 0) {
                        for (var ri = 0; ri < rowsHeaders.length; ri++) {
                            var rowHeadersRow = rowsHeaders[ri];
                            var rowLeafHeader = rowHeadersRow[rowHeadersRow.length - 1];

                            arr = [];
                            for (var colHeaderIndex = 0; colHeaderIndex < columnsLeafHeaders.length; colHeaderIndex++) {
                                var columnLeafHeader = columnsLeafHeaders[colHeaderIndex];
                                var isvisible = createVisibleFunc(rowLeafHeader.visible, columnLeafHeader.visible);
                                arr[colHeaderIndex] = new uiheaders.dataCell(self.pgrid, isvisible, rowLeafHeader, columnLeafHeader);
                            }
                            dataRows.push(arr);
                        }
                    }
                    self.dataRows = dataRows;
                }
            };

        }, {
            "./orb.axe": 3,
            "./orb.pgrid": 8,
            "./orb.ui.cols": 13,
            "./orb.ui.header": 14,
            "./orb.ui.rows": 16
        }],
        16: [function(_dereq_, module, exports) {

            var axe = _dereq_('./orb.axe');
            var axeUi = _dereq_('./orb.ui.axe');
            var uiheaders = _dereq_('./orb.ui.header');

            module.exports = function(rowsAxe) {

                var self = this;

                axeUi.call(self, rowsAxe);

                this.build = function() {
                    var headers = [];
                    var grandtotalHeader;

                    if (self.axe != null) {
                        if (self.axe.root.values.length > 0 || self.axe.pgrid.config.grandTotal.rowsvisible) {
                            headers.push([]);

                            // Fill Rows layout infos
                            getUiInfo(headers, self.axe.root);

                            if (self.axe.pgrid.config.grandTotal.rowsvisible) {
                                var lastrow = headers[headers.length - 1];
                                grandtotalHeader = new uiheaders.header(axe.Type.ROWS, uiheaders.HeaderType.GRAND_TOTAL, self.axe.root, null, self.dataFieldsCount());
                                if (lastrow.length === 0) {
                                    lastrow.push(grandtotalHeader);
                                } else {
                                    headers.push([grandtotalHeader]);
                                }
                            }
                        }

                        if (headers.length === 0) {
                            headers.push([grandtotalHeader = new uiheaders.header(axe.Type.ROWS, uiheaders.HeaderType.INNER, self.axe.root, null, self.dataFieldsCount())]);
                        }

                        if (grandtotalHeader) {
                            // add grand-total data headers if more than 1 data field and they will be the leaf headers
                            addDataHeaders(headers, grandtotalHeader);
                        }
                    }
                    self.headers = headers;
                };

                this.build();

                function addDataHeaders(infos, parent) {
                    if (self.isMultiDataFields()) {
                        var lastInfosArray = infos[infos.length - 1];
                        for (var datafieldindex = 0; datafieldindex < self.dataFieldsCount(); datafieldindex++) {
                            lastInfosArray.push(new uiheaders.dataHeader(self.axe.pgrid.config.dataFields[datafieldindex], parent));
                            if (datafieldindex < self.dataFieldsCount() - 1) {
                                infos.push((lastInfosArray = []));
                            }
                        }
                    }
                }


                function getUiInfo(infos, dimension) {
                    if (dimension.values.length > 0) {

                        var infosMaxIndex = infos.length - 1;
                        var lastInfosArray = infos[infosMaxIndex];
                        var parent = lastInfosArray.length > 0 ? lastInfosArray[lastInfosArray.length - 1] : null;

                        for (var valIndex = 0; valIndex < dimension.values.length; valIndex++) {
                            var subvalue = dimension.values[valIndex];
                            var subdim = dimension.subdimvals[subvalue];

                            var subTotalHeader;
                            if (!subdim.isLeaf && subdim.field.subTotal.visible) {
                                subTotalHeader = new uiheaders.header(axe.Type.ROWS, uiheaders.HeaderType.SUB_TOTAL, subdim, parent, self.dataFieldsCount());
                            } else {
                                subTotalHeader = null;
                            }

                            var newHeader = new uiheaders.header(axe.Type.ROWS, null, subdim, parent, self.dataFieldsCount(), subTotalHeader);

                            if (valIndex > 0) {
                                infos.push((lastInfosArray = []));
                            }

                            lastInfosArray.push(newHeader);

                            if (!subdim.isLeaf) {
                                getUiInfo(infos, subdim);
                                if (subdim.field.subTotal.visible) {
                                    infos.push([subTotalHeader]);

                                    // add sub-total data headers if more than 1 data field and they will be the leaf headers
                                    addDataHeaders(infos, subTotalHeader);
                                }
                            } else {
                                // add data headers if more than 1 data field and they will be the leaf headers
                                addDataHeaders(infos, newHeader);
                            }
                        }
                    }
                }
            };

        }, {
            "./orb.axe": 3,
            "./orb.ui.axe": 12,
            "./orb.ui.header": 14
        }],
        17: [function(_dereq_, module, exports) {
            (function(global) {

                module.exports = {

                    ns: function(identifier, parent) {
                        var parts = identifier.split('.');
                        var i = 0;
                        parent = parent || window;
                        while (i < parts.length) {
                            parent[parts[i]] = parent[parts[i]] || {};
                            parent = parent[parts[i]];
                            i++;
                        }
                        return parent;
                    },

                    ownProperties: function(obj) {
                        var arr = [];
                        for (var prop in obj) {
                            if (obj.hasOwnProperty(prop)) {
                                arr.push(prop);
                            }
                        }
                        return arr;
                    },

                    isArray: function(obj) {
                        return Object.prototype.toString.apply(obj) === '[object Array]';
                    },

                    isNumber: function(obj) {
                        return Object.prototype.toString.apply(obj) === '[object Number]';
                    },

                    isDate: function(obj) {
                        return Object.prototype.toString.apply(obj) === '[object Date]';
                    },

                    isString: function(obj) {
                        return Object.prototype.toString.apply(obj) === '[object String]';
                    },

                    isRegExp: function(obj) {
                        return Object.prototype.toString.apply(obj) === '[object RegExp]';
                    },

                    escapeRegex: function(re) {
                        return re.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    },

                    findInArray: function(array, predicate) {
                        if (this.isArray(array) && predicate) {
                            for (var i = 0; i < array.length; i++) {
                                var item = array[i];
                                if (predicate(item)) {
                                    return item;
                                }
                            }
                        }
                        return undefined;
                    },

                    jsonStringify: function(obj, censorKeywords) {
                        function censor(key, value) {
                            return censorKeywords && censorKeywords.indexOf(key) > -1 ? undefined : value;
                        }
                        return JSON.stringify(obj, censor, 2);
                    }
                };

                // from: https://github.com/davidchambers/Base64.js

                (function(object) {
                    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

                    function InvalidCharacterError(message) {
                        this.message = message;
                    }
                    InvalidCharacterError.prototype = new Error();
                    InvalidCharacterError.prototype.name = 'InvalidCharacterError';
                    // encoder
                    // [https://gist.github.com/999166] by [https://github.com/nignag]
                    object.btoa = global && global.btoa ? function(str) {
                            return global.btoa(str);
                        } :
                        function(input) {
                            var str = String(input);
                            for (
                                // initialize result and counter
                                var block, charCode, idx = 0, map = chars, output = '';
                                // if the next str index does not exist:
                                // change the mapping table to "="
                                // check if d has no fractional digits
                                str.charAt(idx | 0) || (map = '=', idx % 1);
                                // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
                                output += map.charAt(63 & block >> 8 - idx % 1 * 8)
                            ) {
                                charCode = str.charCodeAt(idx += 3 / 4);
                                if (charCode > 0xFF) {
                                    throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
                                }
                                block = block << 8 | charCode;
                            }
                            return output;
                        };

                    // decoder
                    // [https://gist.github.com/1020396] by [https://github.com/atk]
                    object.atob = global && global.atob ? function(str) {
                            return global.atob(str);
                        } :
                        function(input) {
                            var str = String(input).replace(/=+$/, '');
                            if (str.length % 4 == 1) {
                                throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
                            }
                            for (
                                // initialize result and counters
                                var bc = 0, bs, buffer, idx = 0, output = '';
                                // get next character
                                (buffer = str.charAt(idx++));
                                // character found in table? initialize bit storage and add its ascii value;
                                ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                                    // and if not first of each 4 characters,
                                    // convert the first 8 bits to one ascii character
                                    bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
                            ) {
                                // try to find character in table (0-63, not found => -1)
                                buffer = chars.indexOf(buffer);
                            }
                            return output;
                        };
                }(module.exports));

            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
        }, {}]
    }, {}, [1])(1)
});
