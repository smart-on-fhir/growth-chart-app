/*global Chart, GC, PointSet, Raphael, console, $ */
/*jslint eqeq: true, nomen: true, plusplus: true */

/**
 * Class Chart - the base class for all the charts
 * @author Vladimir Ignatov <vlad.ignatov@gmail.com>
 * @file charts/chart.js
 * @constructor
 */
function Chart( pane )
{
    this.id        = Raphael.createUUID();
    this.pane      = null;
    this._nodes    = [];
    this.settings  = GC.chartSettings;
    this.__CACHE__ = {};

    if ( pane ) {
        this.init( pane );
    }
}

Chart.prototype = {

    // Just in case, if nothing custom was set, draw 300x200 at 0x0
    width     : 300,
    height    : 200,
    minWidth  : 100,
    minHeight : 200,
    x         : 0,
    y         : 0,

    dataSet        : "",
    problemDataSet : "",
    isInLastRow    : true,
    title          : "Chart",

    /**
     * Initializes the chart
     */
    init : function( pane )
    {
        this.pane      = pane;
        this.__CACHE__ = {};
        this._nodes    = [];
        this._selectionNodes = { selected: [], hover : [] };
        this.ID = Raphael.createUUID();
        this._titleSet = this.pane.paper.set();
        this._axisSet  = this.pane.paper.set();
    },

    /**
     * Clears the cache and removes all nodes
     * @return {Chart} Returns this instance
     */
    clear : function()
    {
        this.__CACHE__ = {};

        var i;

        function removeElem(elem) {
            try { // Raphael bug
                elem.remove();
            } catch (ex) {
                if (elem.node.parentNode) {
                    elem.node.parentNode.removeChild(elem.node);
                }
            }
        }

        for ( i = this._nodes.length - 1; i >= 0; i-- ) {
            if (this._nodes[i].type == "set") {
                this._nodes[i].forEach(removeElem);
                this._nodes[i].clear();
            }
            else if (this._nodes[i].remove) {
                removeElem(this._nodes[i]);
            }
            else if (this._nodes[i].parentNode) {
                this._nodes[i].parentNode.removeChild(this._nodes[i]);
            }
        }
        this._nodes = [];

        // Delete previous selection points
        this.unsetSelection();

        return this;
    },

    /**
     * Get cached properties by name
     */
    get : function( key, args )
    {
        if ( this.__CACHE__[ key ] === undefined ) {
            var getter = "_get_" + key;
            this.__CACHE__[key] = this[getter](args);
        }
        return this.__CACHE__[key];
    },

    /**
     * Tries to avoid using setAttribute for repeating tasks by using CSS. For
     * VML mode this will set the needed properties using attr(), but in SVG
     * mode, it will create a dynamic stylesheet and just add className to the
     * elements...
     */
    css : function( elem, selector )
    {
        if (!this.svgCss) {
            this.svgCss = {
                ".axis" : this.settings.axis,
                ".fill-region" : this.settings.fillRegion || {
                    "stroke-width"   : 0,
                    "fill"           : this.settings.lines.stroke,
                    "fill-opacity"   : 0.3
                },
                ".label-glow" : {
                    "text-anchor"    : "start",
                    "stroke"         : GC.Util.brighten(this.settings.lines.stroke, 0.7),
                    "stroke-width"   : 3,
                    "stroke-opacity" : 0.9
                },
                ".label-dot" : {
                    "fill"        : this.settings.lines.stroke,
                    "stroke-width": 0
                },
                ".label-text" : {
                    "text-anchor" : "start",
                    "fill"        : GC.Util.darken(this.settings.lines.stroke, 0.6)
                },
                ".region-shadow" : {
                    "stroke-width"  : 3,
                    "stroke-opacity": 0.2,
                    "stroke" : "#000",
                    //"transform"     : "t0,2",
                    "-webkit-transform" : "translateY(2px)",
                    "-moz-transform" : "translateY(2px)",
                    "-o-transform" : "translateY(2px)",
                    "-ms-transform" : "translateY(2px)",
                    "transform" : Raphael.vml ? "t0,2" : "translateY(2px)"
                },
                ".chart-lines" : this.settings.lines
            };

            var id = this.ID;
            $.each(this.svgCss, function( _selector, style ) {
                $.each(style, function(k, v) {
                    style[$.camelCase(k)] = v;
                });

                $.helperStyle(_selector + "-" + id, style);
            });
        }

        if ( Raphael.vml ) {
            elem.attr(this.svgCss[selector]);
        } else {
            elem.addClass( selector.replace(/^\s*\.\s*/, "") + "-" + this.ID );
        }
    },

    /**
     * Checks if this chart is currently visible
     * @returns {Boolean}
     */
    isVisible : function()
    {
        if ( GC.App.getViewType() != "graphs" ) {
            return false;
        }
        if ( this.stack && this.stack.getCurrentChart() !== this ) {
            return false;
        }
        return true;
    },

    // Cached Getters
    // =========================================================================
    // @hasData
    _get_hasData : function() {
        var pts = this.getPatientDataPoints();
        return pts && pts._length;
    },

    // @primaryCurvesData
    _get_primaryCurvesData : function() {
        return GC.Util.cropCurvesDataX(
            GC.Util.getCurvesData( this.dataSet ),
            GC.App.getStartAgeMos(),
            GC.App.getEndAgeMos()
        );
    },

    // @primaryCurvesDataScaled
    _get_primaryCurvesDataScaled : function() {
        var inst = this,
            data = this.get("primaryCurvesData");
        $.each(data, function(i, line) {
            $.each(line.data, function(j, p) {
                p.chartX = inst._scaleX(p.x);
                p.chartY = inst._scaleY(p.y);
            });
        });

        return data;
    },

    // @secondaryCurvesDataScaled
    _get_secondaryCurvesDataScaled : function() {
        var inst = this,
            data = this.get("secondaryCurvesData");
        $.each(data, function(i, line) {
            $.each(line.data, function(j, p) {
                p.chartX = inst._scaleX(p.x);
                p.chartY = inst._scaleY(p.y);
            });
        });

        return data;
    },

    // @secondaryCurvesData
    _get_secondaryCurvesData : function() {
        return GC.Util.cropCurvesDataX(
            GC.Util.getCurvesData( this.problemDataSet ),
            GC.App.getStartAgeMos(),
            GC.App.getEndAgeMos()
        );
    },

    // @primaryCurvesDataRaw
    _get_primaryCurvesDataRaw : function() {
        return GC.Util.getCurvesData( this.dataSet );
    },

    // @secondaryCurvesDataRaw
    _get_secondaryCurvesDataRaw : function() {
        return GC.Util.getCurvesData( this.problemDataSet );
    },

    // @primaryDataRange
    _get_primaryDataRange : function() {
        return this._getDataRange( this.get("primaryCurvesData") );
    },

    // @secondaryDataRange
    _get_secondaryDataRange : function() {
        return this._getDataRange( this.get("secondaryCurvesData") );
    },

    // @dataBounds
    _get_dataBounds : function()
    {
        var out = {
                minX : [ Number.MAX_VALUE ],
                maxX : [ Number.MIN_VALUE ],
                minY : [ Number.MAX_VALUE ],
                maxY : [ Number.MIN_VALUE ]
            }, range, points, bounds;

        points = this.getPatientDataPoints();
        if ( points && points._length ) {
            bounds = points.getBounds();
            out.minX.push(bounds.agemos.min);
            out.minY.push(bounds.value.min);
            out.maxX.push(bounds.agemos.max);
            out.maxY.push(bounds.value.max);
        }

        if ( this.dataSet ) {
            range = this.get("primaryDataRange");
            out.minX.push(range.minX);
            out.minY.push(range.minY);
            out.maxX.push(range.maxX);
            out.maxY.push(range.maxY);
        }

        if ( this.problemDataSet ) {
            range = this.get("secondaryDataRange");
            out.minX.push(range.minX);
            out.minY.push(range.minY);
            out.maxX.push(range.maxX);
            out.maxY.push(range.maxY);
        }

        out.minX = Math.min.apply({}, out.minX);
        out.minY = Math.min.apply({}, out.minY);
        out.maxX = Math.max.apply({}, out.maxX);
        out.maxY = Math.max.apply({}, out.maxY);

        return out;
    },

    // @bounds
    _get_bounds : function()
    {
        var out = {
                topLeft : {
                    x : this.x,
                    y : this.y
                },
                topRight : {
                    x : this.x + this.width,
                    y : this.y
                },
                bottomRight : {
                    x : this.x + this.width,
                    y : this.y + this.height
                },
                bottomLeft : {
                    x : this.x,
                    y : this.y + this.height
                }
            }, range, points;

        points = this.getPatientDataPoints();
        if ( points && points._length ) {
            out.topLeft.y     = this._scaleY(points._data[0].value);
            out.bottomLeft.y  = this._scaleY(points._data[0].value);
            out.topRight.y    = this._scaleY(points._data[points._length - 1].value);
            out.bottomRight.y = this._scaleY(points._data[points._length - 1].value);
        }

        if ( this.dataSet ) {
            range = this._get_primaryDataRange();
            out.bottomLeft.y  = this._scaleY( range.minYstart );
            out.bottomRight.y = this._scaleY( range.minYend   );
            out.topLeft.y     = this._scaleY( range.maxYstart );
            out.topRight.y    = this._scaleY( range.maxYend   );
        }

        if ( this.problemDataSet ) {
            range = this._get_secondaryDataRange();

            if ( range.minYstart > Number.MIN_VALUE ) {
                out.bottomLeft.y = Math.max( out.bottomLeft.y, this._scaleY( range.minYstart ) );
            }
            if ( range.minYend > Number.MIN_VALUE ) {
                out.bottomRight.y = Math.max( out.bottomRight.y, this._scaleY( range.minYend ) );
            }
            if ( range.maxYstart < Number.MAX_VALUE ) {
                out.topLeft.y = Math.min( out.topLeft.y, this._scaleY( range.maxYstart ) );
            }
            if ( range.maxYend < Number.MAX_VALUE ) {
                out.topRight.y = Math.min( out.topRight.y, this._scaleY( range.maxYend ) );
            }
        }

        return out;
    },

    // @topOutline
    _get_topOutline : function()
    {
        var line   = $.extend(true, [], this.get("topBoundary")),
            len    = line.length,
            startX = this.x,
            endX   = this.x + this.width,
            axisCoordinates;

        if ( len ) {

            if ( line[0][0] > startX ) {
                line.unshift([ startX, line[0][1] ]);
            }

            if (line[line.length - 1][0] < endX) {
                line.push([ endX, line[line.length - 1][1] ]);
            }

            axisCoordinates = this.get("axisCoordinates");
            line.unshift([ axisCoordinates.pA.x, axisCoordinates.pA.y ]);
            line.push   ([ axisCoordinates.pB.x, axisCoordinates.pB.y ]);
        }

        return line;
    },

    // @bottomOutline
    _get_bottomOutline : function()
    {
        var line   = $.extend(true, [], this.get("bottomBoundary")),
            len    = line.length,
            startX = this.x,
            endX   = this.x + this.width,
            axisCoordinates;

        if ( len ) {

            if ( line[0][0] > startX ) {
                line.unshift([ startX, line[0][1] ]);
            }

            if (line[line.length - 1][0] < endX) {
                line.push([ endX, line[line.length - 1][1] ]);
            }

            axisCoordinates = this.get("axisCoordinates");
            line.unshift([ axisCoordinates.pD.x, axisCoordinates.pD.y ]);
            line.push   ([ axisCoordinates.pC.x, axisCoordinates.pC.y ]);
        }

        return line;
    },

    // @bottomBoundary
    _get_bottomBoundary : function()
    {
        var out    = null,
            // inst   = this,
            lines  = [],
            // l1     = [],
            l2     = [],
            l3     = [],
            // points = this.getPatientDataPoints(),
            data,
            linesLen,
            pointsLen,
            p,
            i;

        // Start ith the patient data line -------------------------------------
        /*if ( points && points._length > 1 ) {
            $.each(points._data, function(i, pt) {
                l1.push([
                    inst._scaleX( pt[ points.dimensionX ] ),
                    inst._scaleY( pt[ points.dimensionY ] )
                ]);
            });
            lines.push(l1);
        }*/

        // Primary dataSet - bottom line ---------------------------------------
        data = this.get("primaryCurvesDataScaled");
        linesLen = data.length;
        if ( linesLen ) {
            pointsLen = data[0].data.length;
            if ( pointsLen ) {
                for ( i = 0; i < pointsLen; i++ ) {
                    p = data[0].data[i];
                    l2[i] = [ p.chartX, p.chartY ];
                }
                lines.push(l2);
            }
        }

        // Secondary dataSet - bottom line -------------------------------------
        if ( this.problemDataSet ) {
            data = this.get("secondaryCurvesDataScaled");
            linesLen = data.length;
            if ( linesLen ) {
                pointsLen = data[0].data.length;
                if ( pointsLen ) {
                    for ( i = 0; i < pointsLen; i++ ) {
                        p = data[0].data[i];
                        l3[i] = [ p.chartX, p.chartY ];
                    }
                    lines.push(l3);
                }
            }
        }

        // Sum lines
        $.each(lines, function(j, l) {
            if ( j === 0 ) {
                out = l;
            } else {
                out = GC.Util.sumLinesY(out, l, "max", 100);
            }
        });

        return out && out.length ? out : [
            [this.x             , this.y + this.height],
            [this.x + this.width, this.y + this.height]
        ];
    },

    // @topBoundary
    _get_topBoundary : function()
    {
        var out    = null,
            // inst   = this,
            lines  = [],
            // l1     = [],
            l2     = [],
            l3     = [],
            data,
            linesLen,
            pointsLen,
            line,
            p,
            i;

        // Start ith the patient data line -------------------------------------
        /*line = this.getPatientDataPoints();
        if ( line && line._length > 1 ) {
            $.each(line._data, function(i, pt) {
                l1.push([
                    inst._scaleX( pt[ line.dimensionX ] ),
                    inst._scaleY( pt[ line.dimensionY ] )
                ]);
            });
            lines.push(l1);
        }*/

        // Primary dataSet - top line ------------------------------------------
        data = this.get("primaryCurvesDataScaled");
        linesLen = data.length;
        if ( linesLen ) {
            line = data[linesLen - 1].data;
            pointsLen = line.length;
            if ( pointsLen ) {
                for ( i = 0; i < pointsLen; i++ ) {
                    p = line[i];
                    l2[i] = [ p.chartX, p.chartY ];
                }
                lines.push(l2);
            }
        }

        // Secondary dataSet - bottom line -------------------------------------
        if ( this.problemDataSet ) {
            data = this.get("secondaryCurvesDataScaled");
            linesLen = data.length;
            if ( linesLen ) {
                line = data[linesLen - 1].data;
                pointsLen = line.length;
                if ( pointsLen ) {
                    for ( i = 0; i < pointsLen; i++ ) {
                        p = line[i];
                        l3[i] = [ p.chartX, p.chartY ];
                    }
                    lines.push(l3);
                }
            }
        }

        // Sum lines
        $.each(lines, function(j, l) {
            if ( j === 0 ) {
                out = l;
            } else {
                out = GC.Util.sumLinesY(out, l, "min", 100);
            }
        });

        return out && out.length ? out : [
            [this.x             , this.y],
            [this.x + this.width, this.y]
        ];
    },

    // @dataPoints
    _get_dataPoints : function( dataType )
    {
        var lines = {};

        $.each(["lengthAndStature", "weight", "headc", "bmi"], function(j, type) {

            if ( dataType && dataType != type ) {
                return true;
            }

            var points = GC.App.getPatient().data[type],
                len    = points.length,
                out    = [],
                min    = Math.max(GC.App.getStartAgeMos(), 0),
                max    = Math.min(GC.App.getEndAgeMos(), 250),
                ptPrev = null,
                ptNext = null,
                i;

            for ( i = 0; i < len; i++ ) {
                if ( points[i].agemos < min ) {
                    if ( !ptPrev || ptPrev[0] < points[i].agemos ) {
                        ptPrev = [ points[i].agemos, points[i].value ];
                    }
                }
                else if ( points[i].agemos > max ) {
                    if ( !ptNext || ptNext[0] > points[i].agemos ) {
                        ptNext = [ points[i].agemos, points[i].value ];
                    }
                }
                else {
                    out.push( [ points[i].agemos, points[i].value ] );
                }
            }

            if ( ptPrev ) {
                out.unshift( ptPrev );
            }

            if ( ptNext ) {
                out.push( ptNext );
            }

            lines[type] = out;
        });

        return lines;
    },

    // @axisCoordinates
    _get_axisCoordinates : function()
    {
        var bounds      = this.get("bounds"),
            startYleft  = bounds.topLeft.y,
            startYright = bounds.topRight.y,
            endYleft    = bounds.bottomLeft.y,
            endYright   = bounds.bottomRight.y,
            left        = this.x,
            right       = this.x + this.width;

        if ( this.rowIndex === 0 ) {
            startYleft = startYright = this.y;
        } else {
            if ( startYleft > startYright ) {
                startYleft  = Math.floor( startYleft ) - 30;
                startYright = this.y;
            } else {
                startYright = Math.floor( startYright ) - 30;
                startYleft  = this.y;
            }
        }

        if ( this.isInLastRow ) {
            endYleft = endYright = Math.ceil(this.y + this.height);
        } else {
            endYleft  = Math.ceil( endYleft  ) + 30;
            endYright = Math.ceil( endYright ) + 30;
        }

        return new GC.Rect(
            left , startYleft,
            right, startYright,
            right, endYright,
            left , endYleft
        );
    },

    /**
     * Returns a meta-data object that describes the currently used data. The
     * information includes min/max values in all directions and ranges between
     * them...
     * @param {Object} data The data to analyze
     * @returns {Object}
     */
    _getDataRange : function( data ) {
        var l1 = data.length,
            out  = {
                minX      : Number.MAX_VALUE,
                maxX      : Number.MIN_VALUE,
                minY      : Number.MAX_VALUE,
                maxY      : Number.MIN_VALUE,
                minYstart : Number.MAX_VALUE,
                maxYstart : Number.MIN_VALUE,
                minYend   : Number.MAX_VALUE,
                maxYend   : Number.MIN_VALUE,
                rangeX    : 0,
                rangeY    : 0
            }, i, j = 0, x, y, l2, left = [], right = [];

        for ( i = 0; i < l1; i++ ) { // lines
            if (data[i].data) {
                l2 = data[i].data.length;
                for ( j = 0; j < l2; j++ ) { // points
                    x = data[i].data[j].x;
                    y = data[i].data[j].y;
                    out.minX = Math.min(out.minX, x);
                    out.minY = Math.min(out.minY, y);
                    out.maxX = Math.max(out.maxX, x);
                    out.maxY = Math.max(out.maxY, y);

                    if ( j === 0 ) {
                        left.push( data[i].data[j] );
                    }
                    if ( j === l2 - 1 ) {
                        right.push( data[i].data[j] );
                    }
                }
            }
        }

        $.each( left, function(i2, o) {
            out.minYstart = Math.min(out.minYstart, o.y);
            out.maxYstart = Math.max(out.maxYstart, o.y);
        });

        $.each( right, function(i2, o) {
            out.minYend = Math.min(out.minYend, o.y);
            out.maxYend = Math.max(out.maxYend, o.y);
        });

        out.rangeX = out.maxX - out.minX;
        out.rangeY = out.maxY - out.minY;

        return out;
    },

    /**
     * @returns PointSet | null
     */
    getPatientDataPoints : function()
    {
        if ( this.patientDataType ) {
            var patient  = GC.App.getPatient(),
                pointSet = new PointSet( patient.data[this.patientDataType], "agemos", "value" );

            // Get only the points within the current time range
            pointSet.clip(
                GC.App.getStartAgeMos(),
                GC.App.getEndAgeMos() - this.getInnerAxisShadowWidth() / this.pane.pixelsPerMonth( this.colIndex)
            );

            // Merge the duplicated points that may be added by pointSet.clip()
            return pointSet.compact();
        }
        return null;
    },

    /**
     * Returns different width for the InnerAxisShadow (the grey rectangle at
     * the right side of the charts), depending on if percentiles or Z-scores
     * should be displayed there.
     * @returns {Number}
     */
    getInnerAxisShadowWidth : function()
    {
        return GC.App.getPCTZ() == "z" ? 34 : 20;
    },

    // Setters
    // =========================================================================

    /**
     * Sets the width of the chart and it's height to match the 3/5 ratio.
     * @return Chart Returns this instance
     */
    setWidth : function(w)
    {
        this.width  = Math.max(w, this.minWidth);
        this.setHeight(this.width * 3 / 5);
        return this;
    },

    /**
     * Set the height of the chart
     * @param {Number}
     */
    setHeight : function(h)
    {
        this.height = Math.max(h, this.minHeight);
        return this;
    },

    /**
     * Returns the height of the chart. This is called by the ChartPane
     * container while it is trying to align it's chart children.
     * @returns {Number}
     */
    getHeight : function()
    {
        return this.height;
    },

    /**
     * Sets the X position of the chart
     * @param {Number}
     */
    setX : function( x )
    {
        this.x = x;
        return this;
    },

    /**
     * Sets the Y position of the chart
     * @param {Number}
     */
    setY : function( y )
    {
        this.y = y;
        return this;
    },

    /**
     * This can be called by the sub-classes (e.g. their "setDataSource" or
     * "setProblem" methods) to do the dirty work
     * @param {String} type     "primary|secondary"
     * @param {String} src      "CDC|WHO|BB|DS"
     * @param {String} dataType "LENGTH|WEIGHT|HEADC|BMI"
     */
    _setDataSource : function( type, src, dataType )
    {
        var ds = GC.getDataSet(
            src,
            dataType,
            GC.App.getGender(),
            GC.App.getStartAgeMos(),
            GC.App.getEndAgeMos()
        );

        if ( type == "primary" ) {
            this.dataSet = ds ? ds.name : "";
        }
        else if ( type == "secondary" ) {
            this.problemDataSet = ds ? ds.name : "";
        }

        return this;
    },

    /**
     * This does nothing here, but it can be implemented differently in
     * sub-classes to set the name of the primary data source.
     * @returns {Chart} Returns this instance
     */
    setDataSource : function( /*src*/ )
    {
        return this;
    },

    /**
     * This does nothing here, but it can be implemented differently in
     * sub-classes to set the name of the secondary data source.
     * @returns {Chart} Returns this instance
     */
    setProblem : function()
    {
        return this;
    },

    /**
     * Returns the units of the chart data as string (to be displayed as axis
     * label, or as suffix to numbers somewhere).
     * @abstract Must be implemented by the sub-classes
     */
    getUnits : function()
    {
        throw "Please implement the 'getUnits' method";
    },

    /**
     * Should return "eng" or "metric"
     */
    getMetrics : function()
    {
        if ( this.dataSet ) {
            return GC.DATA_SETS[ this.dataSet ].measurement;
        }
        return GC.App.getMetrics();
    },

    /**
     * Scales the given X coordinate @n to the current chart rectangle
     * @param {Number} n
     */
    _scaleX : function(n)
    {
        return GC.Util.scale (n, GC.App.getStartAgeMos(), GC.App.getEndAgeMos(), this.x, this.x + this.width);
    },

    /**
     * Scales the given Y coordinate @n to the current chart rectangle
     * @param {Number} n
     */
    _scaleY : function(n)
    {
        var titleHeight = GC.chartSettings.chartLabels.attr["font-size"] * 1.3,
            curvesTop   = this.y + titleHeight,
            dataBounds  = this.get("dataBounds");

        return GC.Util.scale (
            n,
            dataBounds.minY,
            dataBounds.maxY,
            this.y + this.height - 30,
            curvesTop
        );
    },

    /**
     * Removes the selection of the given type. That means all the related nodes
     * will be removed from the DOM and the remaining tooltips (if any) will be
     * re-ordered.
     * @param {String} type One of "selected", "hover"
     */
    unsetSelection : function( type ) {
        if ( this._selectionNodes ) {
            $.each(this._selectionNodes, function(id, elems) {
                if (!type || type === id) {
                    $.map(elems, function(o) {
                        o.remove();
                        return null;
                    });
                }
            });
            GC.Tooltip.reorder();
        }
    },

    /**
     * Given some numeric value @val, this method should return it as formatted
     * string. The formatting includes the units for the type of data that this
     * chart is representing. The rounding precisions, NICU mode and current
     * language are also applied when possible.
     */
    getLocalizedValue : function(val) {
        return GC.Util.format(val, {
            type : this.patientDataType
        });
    },

    /**
     * Draws the points where the time selection line intersects the patient
     * data and show the tooltips there
     * @param {Number} ageWeeks The selected age in weeks
     * @param {String} type
     */
    drawSelectionPoints : function( ageWeeks, type )
    {
        // Delete previous points first
        this.unsetSelection(type);

        // Calculate the new points and draw them, pushing the elements to
        // "this._selectionNodes" collection to make them removable later.
        var pts  = this.getDataPointsAtMonth( GC.Util.weeks2months( ageWeeks ) ),
            l    = pts.length,
            pctz = GC.App.getPCTZ(),
            // metrics = GC.App.getMetrics(),
            arrowType = false,
            text2,
            tmp,
            bg,
            i;

        function hasSamePoint(point) {
            return function(pt) {
                return  pt.data &&
                        Math.abs(pt.data("x") - point.x) < 1 &&
                        Math.abs(pt.data("y") - point.y) < 1;
            };
        }

        bg   = Raphael.color(this.settings.color);
        bg.s = Math.min(1, bg.s * 1.1);
        bg.l = Math.max(0, bg.l / 1.1);
        bg = Raphael.hsl(bg.h, bg.s, bg.l);

        for ( i = 0; i < l; i++ ) {
            if (type == "selected" || !$.grep(this._selectionNodes.selected, hasSamePoint(pts[i])).length) {

                text2 = pctz == "pct" && pts[i].data.pct !== undefined ?
                    GC.Util.format(pts[i].data.pct * 100, {type : "percentile" }) :
                    pctz == "z" && pts[i].data.z !== undefined ?
                        GC.Util.format(pts[i].data.z, {type : "zscore" }) :
                        "N/A";

                if (type == "hover") {
                    var selected = GC.SELECTION.selected;
                    //console.log(selected)
                    if (selected && selected.age) {

                        var patient = GC.App.getPatient(),
                            selectedRecord = patient.getModelEntryAtAgemos(selected.age.getMonths());

                        if (selectedRecord && selectedRecord[this.patientDataType] !== undefined) {

                            var atRecord = {
                                agemos : pts[i].data.agemos
                            };
                            atRecord[this.patientDataType] = pts[i].data.value;

                            var v = GC.App.getPatient().getVelocity(
                                this.patientDataType,
                                atRecord,
                                selectedRecord
                            );

                            if (v !== null && this.getLocalizedValue) {
                                tmp = this.getLocalizedValue(v.value);
                                if (tmp) {
                                    text2 += " | " + tmp + v.suffix;
                                    arrowType = true;
                                }
                            }
                        }
                    }
                }

                this._selectionNodes[type].push(
                    this.pane.paper.circle(
                        pts[i].x, pts[i].y, 5
                    ).attr({
                        fill   : "#000",
                        stroke : "none"
                    })
                    .data("x", pts[i].x)
                    .data("y", pts[i].y)
                    .addClass("tooltip-point")
                    .toggleClass("hover", type == "hover")
                    .toggleClass("selected", type == "selected")
                    .toFront(),

                    GC.tooltip(this.pane.paper, {
                        x      : pts[i].x,
                        y      : pts[i].y,
                        shiftY : 30,
                        shadowOffsetX : -15,
                        shadowOffsetY : 5,

                        bg : type == "selected" ?
                            GC.chartSettings.selectionLine.stroke :
                            GC.chartSettings.hoverSelectionLine.stroke,

                        text : pts[i].data.label === undefined ?
                            "No data" :
                            pts[i].data.label,

                        text2     : text2,
                        text2bg   : bg,
                        arrowType : arrowType
                    })
                );
            }
        }

        return pts;
    },

    /**
     * Returns an array of useful data for the ponts where the given age in
     * months intersects the patien line. Tis is used on click to look for
     * intersection points and draw to tooltips based on that...
     * @param {Number} m The selected age in months
     * @returns {Array}
     */
    getDataPointsAtMonth : function( m )
    {
        var lines    = this.get("dataPoints"),
            out      = [],
            type     = "",
            // inst     = this,
            colWidth = this.pane.getColumnWidth( this.colIndex, true ),
            gender   = GC.App.getGender(),
            point    = null,
            pxMonth  = this.pane.pixelsPerMonth(this.colIndex),
            pct, z, data, o;

        function forEachPoint(i, p) {
            var dX = Math.abs(p[0] - m) * pxMonth;
            if (dX < GC.chartSettings.timeline.snapDistance * colWidth / 100) {
                if ( !point || Math.abs(point[0] - m) * pxMonth > dX) {
                    point = p;
                }
            }
        }

        for ( type in lines ) {
            if (lines[type]) {
                o = lines[type];
                point = null;
                $.each(o, forEachPoint);

                if (point) {

                    pct = this.dataSet ?
                        GC.findPercentileFromX(
                            point[1],
                            GC.DATA_SETS[this.dataSet],
                            gender,
                            point[0]
                        ) :
                        null;

                    z = this.dataSet ?
                        GC.findZFromX(
                            point[1],
                            GC.DATA_SETS[this.dataSet],
                            gender,
                            point[0]
                        ) :
                        null;

                    data = {
                        agemos : point[0],
                        value  : point[1],
                        color  : this.settings.color,
                        label  : this.getTooltipLabel(point[1]),
                        isLast : point === lines[type][lines[type].length - 1]
                    };

                    if ( pct !== null && !isNaN(pct) && isFinite(pct) ) {
                        data.pct = pct;
                    }

                    if ( z !== null &&!isNaN(z) && isFinite(z) ) {
                        data.z = z;
                    }

                    out.push(
                        new GC.Point(
                            this._scaleX(point[0]),
                            this._scaleY(point[1]),
                            data
                        )
                    );
                }
            }
        }

        return out;
    },

    /**
     * Returns the text to be displayed at the point tooltips.
     * @param {Number} val The value to compile the text for.
     * @returns {String} The tooltip text
     */
    getTooltipLabel : function( val ) {
        return this.getLocalizedValue(val);
    },

    /**
     * Returns an array of the intersection points between the vertical line at
     * "x" and the dataSet percentile lines.
     * @param {Number} x The X coordinate of the intersection
     * @returns {Array}
     */
    getValueAtX : function(x)
    {
        if (!this.dataSet) {
            return [];
        }

        var data     = this.get("primaryCurvesData"),
            linesLen = data.length,
            out      = [],
            before,
            after,
            ptA, ptB,
            points,
            pointsLen,
            i, j, val;

        if (linesLen < 1) {
            return out;
        }

        // In all these charts the "x" is the age in moths
        x /= this.pane.pixelsPerMonth( this.colIndex );
        x += GC.App.getStartAgeMos();

        for ( i = 0; i < linesLen; i++ ) {
            points    = data[i].data;
            pointsLen = points.length;
            if (pointsLen) {
                ptA       = points[0];
                ptB       = points[pointsLen - 1];
                before    = { x : GC.Util.findMinMax(points, "x").min, y : ptA.y };
                after     = { x : GC.Util.findMinMax(points, "x").max, y : ptB.y };
                for ( j = 0; j < pointsLen; j++ ) {
                    if (points[j].x < x && points[j].x > before.x) {
                        before = points[j];
                    }
                    if (points[j].x > x && points[j].x < after.x) {
                        after = points[j];
                    }
                }

                val = GC.Util.getYatX(x, before.x, before.y, after.x, after.y);
                if ( !isNaN( val ) && isFinite( val ) ) {
                    out[i] = GC.Util.getYatX(x, before.x, before.y, after.x, after.y);
                }
            }
        }

        return out;
    },

    // @verticalGridPlaces
    _get_verticalGridPlaces : function() {
        var inst = this,
            type = this.pane.getVerticalGridIntervalType(),
            out  = [],
            points,
            left,
            x;

        if ( type ) {
            points = this.pane.getIntervalPoints( type, this.colIndex );
            left   = GC.chartSettings.leftgutter;
            $.each( points, function(j, point) {
                x = inst.x + point.x - left;
                if (x > inst.x && x < inst.x + inst.width) {
                    out.push(x);
                }
            });
        }

        return out;
    },

    // =========================================================================
    // Drawing methods
    // =========================================================================

    /**
     * Draws a color-filled rectangle to act as chart background. This is only
     * used for visual debugging.
     */
    drawChartBackground : function()
    {
        this._nodes.push(
            this.pane.paper.rect(this.x, this.y, this.width, this.height)
            .attr(GC.chartSettings.chartBackground)
            .toBack()
        );
    },

    /**
     * Draw the vertical grid lines (time lines).
     */
    drawVerticalGrid : function()
    {
        var pts  = this.get("verticalGridPlaces"),
            axis = this.get("axisCoordinates"),
            y1   = Math.min(axis.pA.y, axis.pB.y),
            y2   = Math.max(axis.pC.y, axis.pD.y),
            inst = this;

        $.each(pts, function(j, x) {
            inst._nodes.push(
                inst.pane.paper.path("M" + x + "," + y1 + "V" + y2)
                .attr(GC.chartSettings.gridLineY)
                .addClass("grid-line-y")
                .toBack()
            );
        });
    },

    /**
     * Clear and draw everything!
     */
    draw : function()
    {
        if ( !this.isVisible() ) {
            return;
        }

        this.clear();

        if ( GC.chartSettings.drawChartBackground ) {
            this.drawChartBackground();
        }

        this.drawInnerAxisShadow();
        this.drawAxis();
        this.drawWaterMark();
        this.drawVerticalGrid();
        this.drawTitle();

        if ( !this.dataSet ) {
            this.drawNoData(GC.str("STR_6046"));
        } else {

            if ( GC.chartSettings.drawChartOutlines ) {
                this.drawOutlines();
            }

            var data     = this.get("primaryCurvesDataScaled"),
                len      = data.length,
                pcts     = GC.Preferences.prop("percentiles"),
                rShWidth = this.getInnerAxisShadowWidth(),
                point,
                // txt,
                p = [], // points
                n = 0,  // points counter
                elem,
                i,      // Increments on each line point
                j,      // Increments on each dataset line
                l,
                x = 0,
                y = 0,
                _x,
                _y,
                x2 = this.x + this.width - rShWidth;

            if ( len < 2 ) {
                this.drawNoData(GC.str("STR_6046"));
            } else {

                this.drawFillChartRegion(data);

                // Chart lines
                // =====================================================================
                for ( j = 0; j < len; j++ ) {
                    l = data[j].data.length;//console.log(l);

                    for ( i = 0; i < l; i++ ) {
                        point = data[j].data[i];
                        _x = point.chartX;
                        _y = point.chartY;

                        // Clip each line with s.rightAxisInnerShadow.width pixels from
                        // it's right side (if it goes beyond that X coordinate)
                        if ( _x > x2 ) {
                            _y = GC.Util.getYatX( x2, x, y, _x, _y );
                            _x = x2;
                        }

                        x = _x;
                        y = _y;

                        p[n++] = (!i ? "M" : "L") + x + "," + y;

                        // last point of each line - draw dot and line label
                        if ( i === l - 1 ) {
                            this.drawDataLineLabel(x, y, pcts[j]);
                        }
                    }


                    // Bottom-most line decoration (shadow)
                    //if (!j && Raphael.svg) {
                    //  elem = this.pane.paper.path(p);
                    //  this.css(elem, ".region-shadow");
                    //  //elem.blur(2);
                    //  this._nodes.push(elem);
                    //}
                }

                // 2 points or more - draw line
                if ( n > 1 ) {
                    elem = this.pane.paper.path(p).attr(this.settings.lines);
                    //this.css(elem, ".chart-lines");
                    this._nodes.push(elem);
                }
            }
        }

        this.drawProblemRegion();
        if (this.labels) {
            this.labels.toFront();
        }
        this.drawPatientData();

        return this;
    },

    /**
     * Draws the little percentile/Z-score labels at the right end of each
     * percentile line.
     */
    drawDataLineLabel : function(x, y, percentile) {
        var txt = GC.App.getPCTZ() == "z" ?
            GC.Util.roundToPrecision( Math.normsinv(percentile), 2 ) :
            String(Number(percentile).toFixed(2)).replace("0.", "");

        this.labels = this.pane.paper.set();
        this._nodes.push(this.labels);

        // The dot
        this.labels.push(this.pane.paper.circle(x, y, 2.5).attr({
            "fill"        : this.settings.lines.stroke,
            "stroke-width": 0
        }));

        // The label text glow
        this.labels.push(this.pane.paper.text(x + 5, y, txt).attr({
            "text-anchor"    : "start",
            "stroke"         : GC.Util.brighten(this.settings.lines.stroke, 0.7),
            "stroke-width"   : 3,
            "stroke-opacity" : 0.9
        }));

        // The label text
        this.labels.push(this.pane.paper.text(x + 5, y, txt).attr({
            "text-anchor" : "start",
            "fill"        : GC.Util.darken(this.settings.lines.stroke, 0.7)
        }));
    },

    /**
     * Draws the pail grey rectangle on the inner side of the right axis.
     */
    drawInnerAxisShadow : function()
    {
        var w = this.getInnerAxisShadowWidth(),
            a = this.get("axisCoordinates");

        this._nodes.push(
            this.pane.paper.rect(
                this.x + this.width - w,
                a.pB.y,
                w,
                a.pC.y - a.pB.y
            ).attr(GC.chartSettings.rightAxisInnerShadow.attr).toBack()
        );
    },

    /**
     * Draws the "No Data" label at the center of the chart.
     * @param {String} msg The text to draw. Defaults to "No data available!"
     * @param {Number} fontSize
     */
    drawNoData : function(msg, fontSize)
    {
        this._nodes.push(this.pane.paper.text(
            this.x + this.width / 2,
            this.y + this.height / 2,
            msg || GC.str("STR_6045")
        ).attr({
            "font-size" : fontSize || 30,
            "fill" : "#A60",
            "fill-opacity" : 0.4
        }));
    },

    /**
     * Traws the chart title. It can be curved, rotated  or just horizontal,
     * depending on the situation and the browser support.
     */
    drawTitle : function()
    {
        if ( this.stack && this.stack.getCurrentChart() !== this ) {
            return;
        }

        if ( this._titleSet ) {
            this._titleSet.remove();
        }

        // The text to display
        var titleText = this.getTitle(),

            // The style and attributes to set
            color = GC.Util.darken(this.settings.color, 0.85),
            titleAttr = $.extend({}, GC.chartSettings.chartLabels.attr, {
                "fill"           : color//,
                //"stroke"         : color,
                //"stroke-width"   : 0.66,
                //"stroke-opacity" : 0.5
            }),

            // Now check if the text should be curved, or rotated or displayed
            // horizontally
            doRotate  = Raphael.vml,
            doCurve   = Raphael.svg,
            refPoints = this.get("topBoundary"),
            l         = refPoints.length,
            ps, p, i, refId, path, txt, attr, vals, box, p1, p2, angle;

        // If there is no chart data or it ends before the end of the title
        // rectangle - render horizontal title without any FX
        if ( !l ||
            (!this.dataSet && !this.problemDataSet) ||
            refPoints[ l - 1 ][0] < this.x + this.width * 0.85) {
            doRotate = false;
            doCurve = false;
        }

        if (!this.dataSet || (this.dataSet && this.problemDataSet && this.dataSet != this.problemDataSet)) {
            doRotate = false;
            doCurve = false;
        }

        // Try to render curved text on SVG browsers
        if ( doCurve ) {

            // Create path string from the topBoundaryPoints array
            // TODO: This needs to be smooth line
            if ( !this.dataSet && !this.problemDataSet ) {
                ps = new PointSet(refPoints, 0, 1);
                ps.smooth(2);
                ps.forEach(function(point) {
                    point[ this.dimensionY ] -= 10;
                });
                refPoints = ps._data;
            }

            p = "";
            for ( i = 0; i < l; i++ ) {
                p += (i && i % 2 ? " L " : " ") + refPoints[i][0] + ", " + refPoints[i][1];
            }

            if (p) {
                refId = this.id + "titlepath";

                // Create the reference path in defs if needed
                path = document.getElementById(refId);
                if (!path) {
                    path    = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.id = refId;
                    path.setAttribute("transform", "translate(0, -12)");
                    path.setAttribute("d", "M " + p);
                    this.pane.paper.defs.appendChild(path);
                }

                txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
                for ( attr in titleAttr ) {
                    txt.setAttribute(attr, titleAttr[attr]);
                }
                txt.setAttribute("class", "chart-title-curved"); // Some CSS extras

                path = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
                path.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + refId);
                path.setAttribute("startOffset", "90%");
                //path.setAttribute("text-anchor", "end");
                path.appendChild(document.createTextNode(titleText));
                this.pane.paper.canvas.appendChild(txt);
                txt.appendChild(path);
                this._titleSet.push(new Raphael.el.constructor(txt, this.pane.paper));
                this._nodes.push(this._titleSet);
                return;
            }
        }

        // Render "normal" horizontal title
        txt = this.pane.paper.text().attr(titleAttr).attr({
            x   : this.x + (this.width - this.getInnerAxisShadowWidth()) * 0.9,
            y   : this.y + GC.chartSettings.chartLabels.attr["font-size"] / 2,
            text: titleText
        });

        // Rotate the title (used on VML only)
        if ( doRotate ) {
            box  = txt.getBBox();
            vals = this.getValueAtX( box.x );
            p1 = {
                x : box.x,
                y : this._scaleY(vals[vals.length - 1])
            };

            vals = this.getValueAtX( box.x2 );
            p2 = {
                x : box.x2,
                y : this._scaleY(vals[vals.length - 1])
            };
            angle = 360 - Raphael.angle( p2.x, p2.y, p1.x, p1.y );

            vals = this.getValueAtX( box.x + box.width/2 );


            txt.attr({
                "transform": "r-" + angle,
                y : this._scaleY(vals[vals.length - 1]) -
                    GC.chartSettings.chartLabels.attr["font-size"] * 2/3
            });
        }

        this._titleSet.push(txt);
        this._nodes.push(this._titleSet);
    },

    /**
     * Draws left and right axis, axis labels and horizontal grid lines.
     */
    drawAxis : function()
    {
        if ( this._axisSet ) {
            this._axisSet.remove();
        }

        var bounds                   = this.get("dataBounds"),
            minY                     = bounds.minY,
            maxY                     = bounds.maxY,
            //verticalPoints           = this.get("verticalGridPlaces"),
            axis                     = this.get("axisCoordinates"),
            topOutline               = this.get("topOutline"),
            bottomOutline            = this.get("bottomOutline"),
            currentMeasurementSystem = GC.App.getMetrics(),
            sourceMeasurementSystem  = this.getMetrics(),
            currentUnits             = this.getUnits(),
            sourceUnits              = this.dataSet ?
                GC.DATA_SETS[this.dataSet].units || "" :
                "",
            prefSteps = [1,2,5,10,20,50,100,200,500,1000],
            q                        = 1,
            range                    = 0,
            i, y, node, step, val, precision, intersectTop,
            intersectBottom;

        if ( currentMeasurementSystem !== sourceMeasurementSystem ) {
            switch ( sourceUnits ) {
            case "cm":
                q = GC.Constants.METRICS.INCHES_IN_CENTIMETER;
                break;
            case "kg":
                q = GC.Constants.METRICS.POUNDS_IN_KILOGRAM;
                break;
            }
        }

        minY *= q;
        maxY *= q;
        range = Math.ceil( maxY - minY );

        if (!range) {
            return this;
        }

        // Vertical (left and right) Axis Lines
        // =====================================================================
        node = this.pane.paper.path(
            "M" + axis.pA.x + "," + axis.pA.y +
            "L" + axis.pD.x + "," + axis.pD.y +
            "M" + axis.pB.x + "," + axis.pB.y +
            "L" + axis.pC.x + "," + axis.pC.y +

            "M" + ( axis.pA.x - 2.5 ) + "," + axis.pA.y + "h5" +
            "M" + ( axis.pD.x - 2.5 ) + "," + axis.pD.y + "h5" +
            "M" + ( axis.pB.x - 2.5 ) + "," + axis.pB.y + "h5" +
            "M" + ( axis.pC.x - 2.5 ) + "," + axis.pC.y + "h5"
        ).attr(this.settings.axis).addClass("crispedges");
        //this.css(node, ".axis");
        this._axisSet.push(node);


        // Unit labels
        // =====================================================================
        this._axisSet.push(
            this.pane.paper.text(axis.pA.x - 4, axis.pA.y + 3, currentUnits)
            .attr(this.settings.axisLabels)
            .attr({ "text-anchor": "end", "font-weight" : "bold" })
        );
        this._axisSet.push(
            this.pane.paper.text(axis.pB.x + 4, axis.pB.y + 3, currentUnits)
            .attr(this.settings.axisLabels)
            .attr({ "text-anchor": "start", "font-weight" : "bold" })
        );

        // Horizontal Grid and labels
        // =====================================================================
        step = range / 8;

        if (range > 1) {
            step = Math.ceil(step);
            minY = Math.ceil(minY);
            $.each(prefSteps, function(_i, n) {
                if (_i > 0 && step > prefSteps[_i - 1] && step <= n) {
                    step = n;
                    minY = step;
                    return false;
                }
            });
        }

        // Top H line
        if (axis.pA.y === axis.pB.y) {
            this._axisSet.push(
                this.pane.paper.path(
                    "M" + axis.pA.x + "," + axis.pA.y  + "H" + axis.pB.x
                ).attr(GC.chartSettings.gridLineX).addClass("grid-line-x")
            );
        }

        // Bottom H line
        if (axis.pC.y === axis.pD.y) {
            this._axisSet.push(
                this.pane.paper.path(
                    "M" + axis.pD.x + "," + axis.pD.y  + "H" + axis.pC.x
                ).attr(GC.chartSettings.gridLineX).addClass("grid-line-x")
            );
        }

        for ( i = Math.round(minY);
              i <= maxY;
              i = range <= 1 ? i + step : Math.ceil(i + step) ) {

            // If the range is less than 1 use floats rounded to double
            // precision. Otherwise use integers.
            precision = range <= 1 ? 2 : 0;
            y   = GC.Util.roundToPrecision(this._scaleY(i / q), precision);
            val = GC.Util.roundToPrecision(i, precision);

            // Horizontal lines ------------------------------------------------
            intersectTop    = GC.Util.getLineXatY(topOutline, y) - 20;
            intersectBottom = GC.Util.getLineXatY(bottomOutline, y) + 20;

            intersectTop = Math.min(
                Math.max(intersectTop, this.x),
                this.x + this.width
            );

            intersectBottom = Math.min(
                Math.max(intersectBottom, this.x),
                this.x + this.width
            );

            // line inside the region
            this._axisSet.push(
                this.pane.paper.path(
                    "M" + intersectTop + "," + y  + "H" + intersectBottom
                ).attr(GC.chartSettings.gridLineX).addClass("grid-line-x")
            );

            // Line to the left axis
            if (intersectTop > axis.pA.x && y > axis.pA.y && y < axis.pD.y) {
                this._axisSet.push(
                    this.pane.paper.path(
                        "M" + intersectTop + "," + y  + "H" + (axis.pA.x - 2)
                    ).attr(GC.chartSettings.gridLineX).addClass("grid-line-x")
                );
            }

            // Line to the right axis
            if (intersectBottom < axis.pC.x && y > axis.pB.y && y < axis.pC.y) {
                this._axisSet.push(
                    this.pane.paper.path(
                        "M" + intersectBottom + "," + y  + "H" + (axis.pB.x + 2)
                    ).attr(GC.chartSettings.gridLineX).addClass("grid-line-x")
                );
            }

            // Right labels
            if ( y > axis.pB.y + 16 && y <= axis.pC.y ) {
                this._axisSet.push(
                    this.pane.paper.text(axis.pB.x + 6, y, val)
                    .attr("text-anchor", "start").attr(this.settings.axisLabels)
                );
            }

            // Left labels
            if ( y > axis.pA.y + 16 && y <= axis.pD.y ) {
                this._axisSet.push(
                    this.pane.paper.text(axis.pA.x - 6, y, val)
                    .attr("text-anchor", "end").attr(this.settings.axisLabels)
                );
            }
        }

        this._nodes.push(this._axisSet);

        return this;
    },

    /**
     * Darws the provided data as region (path)
     * @param {Object} data
     * @returns {path} Returns the Raphael's paper.path for the region, even if
     * it has not been drawn because the data is not enough.
     */
    drawRegion : function(data)
    {
        var l = data.length,
            path = this.pane.paper.path(),
            i,
            p = [],
            n = 0,
            line;

        this._nodes.push(path);

        if (!l || !data[0].data.length) {
            return path;
        }

        // first (bottom) line - bottom/right to bottom/left
        line = data[0].data;
        for ( i = line.length - 1; i >= 0; i-- ) {
            p[n++] = [ line[i].chartX, line[i].chartY ];
        }

        // last (top) line
        line = data[l - 1].data;

        for ( i = 0; i < line.length; i++ ) {
            p[n++] = [ line[i].chartX, line[i].chartY ];
        }

        p = $.map(p, function(item, index) {
            return (index ? "L" : "M") + item.join(",");
        }).join("");

        return path.attr("path", p + "Z");
    },

    /**
     * Draws the top and bottom chart outlines. This is only used for visual
     * debugging!
     */
    drawOutlines : function()
    {
        var line = this.get("topOutline"),
            len  = line.length;
        if (len) {
            line = "M" + line.join("L");
            this._nodes.push(this.pane.paper.path(line).attr({
                "stroke-width"   : 5,
                "stroke"         : "blue",
                "stroke-opacity" : 0.4,
                "stroke-linecap" : "round",
                "stroke-linejoin": "round"
            }));
        }

        line = this.get("bottomOutline");
        len  = line.length;
        if (len) {
            line = "M" + line.join("L");
            this._nodes.push(this.pane.paper.path(line).attr({
                "stroke-width"   : 5,
                "stroke"         : "blue",
                "stroke-opacity" : 0.4,
                "stroke-linecap" : "round",
                "stroke-linejoin": "round"
            }));
        }
    },

    /**
     * Draws the secondary dataset (if available) as dashed region
     */
    drawProblemRegion : function()
    {
        if ( !GC.App.getCorrectionalChartType() ) {
            return;
        }

        if ( this.problemDataSet ) {
            var data = this.get("secondaryCurvesDataScaled");

            if ( data.length > 1 && data[0].data.length ) {
                Chart.fillAsSecondaryRegion(
                    this.drawRegion(data),
                    this.settings.problemRegion,
                    this.id
                );
            }
        }
    },

    /**
     * Darws the provided data as region and decorates it as fill-region
     * (applies dashed pattern background to it)
     * @param {Object} data
     */
    drawFillChartRegion : function(data)
    {
        //this.css(this.drawRegion(data), ".fill-region");
        this.drawRegion(data).attr(this.settings.fillRegion);
    },

    /**
     * Draws the patient data (line and dots)
     */
    drawPatientData : function()
    {
        var pointSet = this.getPatientDataPoints(),
            patient,
            lastPoint,
            p,// the line
            dots,
            inst,
            elem,
            x, y, entry;

        if ( !pointSet || !pointSet._length ) {
            return;
        }

        patient   = GC.App.getPatient();
        lastPoint = pointSet._originalData[pointSet._originalData.length - 1];
        p         = [];
        dots      = [];
        inst      = this;

        // Iterate over each point
        pointSet.forEach(function( point, i/*, points*/ ) {

            // Find the X/Y coordinates of the current point
            x = inst._scaleX( point.agemos );
            y = inst._scaleY( point.value  );

            // Register this point as line point
            p[i] = [ x, y ];

            // Nothing more needs to be done for virtual points, so just
            // continue with the next iteration
            if ( point.virtual ) {
                return true;
            }

            // Gestational Arrows
            inst.drawGestArrow({
                startX      : x,
                startY      : y,
                curAgemos   : point.agemos,
                curValue    : point.value,
                isLastPoint : point === lastPoint
            });

            // Draw the dot
            entry = patient.getModelEntryAtAgemos(point.agemos);
            elem = inst.drawDot(x, y, {
                firstMonth : point.agemos <= 1,
                annotation : entry.annotation,
                point      : point,
                record     : entry
            }).toFront();
            inst._nodes.push(elem);
            dots.push(elem);

        });

        // Draw line if there are more than one points
        if ( pointSet._length > 1 ) {

            if ( pointSet._data[pointSet._length - 1].virtual ) {

                this._nodes.push(this._drawGradientLine(
                    p.pop(),
                    p[p.length - 1],
                    GC.chartSettings.patientData.lines["stroke-width"],
                    "#000",
                    GC.Util.mixColors(
                        this.settings.fillRegion.fill,
                        "#FFF",
                        this.settings.fillRegion["fill-opacity"]
                    )
                )
                //.toFront()
                );

            }

            p = "M" + p.join("L");
            elem = this.pane.paper.path(p)
                .attr(GC.chartSettings.patientData.lines);
            this._nodes.push(elem.toFront());
        }

        // Move the dots on top
        $.each(dots, function() { this.toFront(); });

        return this;
    },

    /**
     * Draws gradient line
     * @param {Array} p1 The first point as array like [x, y]
     * @param {Array} p2 The second point as array like [x, y]
     * @param {Number} h The line tickness
     * @param {String} c1 The start color of the gradient fil.
     * @param {String} c2 The end color of the gradient fil.
     * @returns {Object} The path element representing the line
     */
    _drawGradientLine : function(p1, p2, h, c1, c2) {
        return this.pane.paper.path(
            "M" + p1[0] + "," + ( p1[1] - h/2 ) +
            "L" + p2[0] + "," + ( p2[1] - h/2 ) +
            "v" + h +
            "L" + p1[0] + "," + ( p1[1] + h/2 ) +
            "Z"
        ).attr({
            //"fill"   : Raphael.angle(p1[0], p1[1], p2[0], p2[1]) + "-" + c1 + "-" + c2,
            "fill"   : "0-" + c1 + "-" + c2,
            "stroke" : "none"
        });
    },

    /**
     * Draws the gestational correction arrows if needed.
     * @param {Object} cfg
     */
    drawGestArrow : function( cfg )
    {
        /**
         * Returns the period to show the gest. correction arrous in months
         * @param {Number} ga The current patient's gestationAge in months
         */
        function getCorrectionMonths( weeker ) {
            return (weeker < GC.Preferences.prop("gestCorrectionTreshold") ?
                2 :
                1) * 12;
        }

        var weeker       = GC.App.getPatient().weeker,
            caFixed      = weeker ? Math.min(0, ((40 - weeker) || 0) * -1) : 0,
            correctUntil = getCorrectionMonths( weeker ),
            arrowType    = GC.chartSettings.gestCorrectionType,
            canDraw      = arrowType != "none" && !GC.DATA_SETS[this.dataSet].isPremature,
            startX       = cfg.startX,
            startY       = cfg.startY,
            caDeclining,
            xDeclining,
            xFixed,
            drawBigCrop,
            drawSmallCrop,
            drawEndDot,
            drawSmallArrow,
            colorLight,
            colorDark,
            endX,
            elem,
            x,
            a2,
            a3;

        if ( caFixed && canDraw && cfg.curAgemos < correctUntil ) {

            caDeclining = caFixed - caFixed * (cfg.curAgemos / correctUntil);
            xFixed      = this._scaleX( cfg.curAgemos + caFixed / GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH );
            xDeclining  = this._scaleX( cfg.curAgemos + caDeclining / GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH );

            xDeclining = Math.min(Math.max(xDeclining, this.x), this.x + this.width);
            xFixed     = Math.min(Math.max(xFixed    , this.x), this.x + this.width);

            drawBigCrop   = arrowType == "both"       && (xFixed === this.x || xFixed === this.x + this.width);
            drawSmallCrop = (arrowType == "declining" && (xDeclining === this.x || xDeclining === this.x + this.width)) ||
                            (arrowType == "fixed"     && (xFixed     === this.x || xFixed     === this.x + this.width));

            drawEndDot     = arrowType == "both" && !drawBigCrop;
            drawSmallArrow = arrowType != "both";

            colorLight = this.settings.lines.stroke;
            colorDark  = GC.Util.darken(this.settings.lines.stroke, 0.6);

            if ( arrowType != "both" ) {
                xFixed     -= 2 * (caFixed < 0 ? -1 : 1);
                xDeclining -= 2 * (caFixed < 0 ? -1 : 1);
            } else {
                xDeclining -= 6 * (caFixed < 0 ? -1 : 1);
            }

            endX = arrowType == "declining" ? xDeclining : xFixed;

            // The line --------------------------------------------------------
            this._nodes.push(this.pane.paper.path().attr({
                "path"           : "M" + startX + "," + startY + "H" + endX,
                "stroke"         : cfg.isLastPoint ? colorDark : colorLight,
                "stroke-width"   : cfg.isLastPoint ? 1 : 2
            }).addClass("crispedges"));


            // The small arrow head --------------------------------------------
            if ( drawSmallArrow ) {
                this._nodes.push(this.pane.paper.path().attr({
                    "path"  : "M" + (endX - 10 * (caFixed < 0 ? -1 : 1)) + "," + (startY - 4) +
                              "L" + endX + "," + startY +
                              "L" + (endX - 10 * (caFixed < 0 ? -1 : 1)) + "," + (startY + 4) +
                              "L" + (endX - 7 * (caFixed < 0 ? -1 : 1)) + "," + startY + "Z",
                    "stroke"       : colorDark,
                    "fill"         : colorLight,
                    "stroke-width" : 1
                }));
            }

            // The small crop indicator ----------------------------------------
            if ( drawSmallCrop ) {
                x = (caFixed < 0 ? this.x : this.x + this.width);
                elem = this.pane.paper.rect(
                    x - 1,
                    startY - 5,
                    2,
                    10
                ).attr({
                    "fill"   : colorLight,
                    "stroke" : GC.Util.darken(this.settings.lines.stroke, 0.9)
                }).addClass("crispedges");
                this._nodes.push(elem);
            }

            // The circle at the end -------------------------------------------
            if ( drawEndDot ) {
                this._nodes.push(this.pane.paper.circle(endX, startY, 4).attr({
                    "fill"   : colorLight,
                    "stroke" : colorDark
                }));
            }

            // The big crop indicator ------------------------------------------
            if ( drawBigCrop ) {
                elem = this.pane.paper.path().attr({
                    "path" : "M" + endX + "," + (startY - 8) + "v16",
                    "stroke"         : colorDark,
                    "stroke-width"   : 5,
                    "stroke-linecap" : "round"
                });
                this._nodes.push(elem);

                elem = elem.clone().attr({
                    "stroke"       : colorLight,
                    "stroke-width" : 4
                });
                this._nodes.push(elem);
            }

            // The bolder arrow ------------------------------------------------
            if ( arrowType == "both" ) {
                a2 = this.pane.paper.path().attr({
                    "path": "M" + startX + "," + startY + "H" + xDeclining +
                            "M" + (xDeclining - 12 * (caFixed < 0 ? -1 : 1)) + "," + (startY - 8) +
                            "L" + xDeclining + "," + startY +
                            "L" + (xDeclining - 12 * (caFixed < 0 ? -1 : 1)) + "," + (startY + 8),
                    "stroke"         : colorDark,
                    "stroke-width"   : 5,
                    "stroke-linecap" : "round"
                });
                this._nodes.push(a2);

                a3 = a2.clone().attr({
                    "stroke"       : colorLight,
                    "stroke-width" : 4
                });

                this._nodes.push(a3);
            }
        }
    },

    /**
     * Draws a point representing patient data.
     * @param {Number} cx The X coordinate of the dot
     * @param {Number} cy The Y coordinate of the dot
     * @param {Object} settings
     * @returns {Raphael.set} The set containing all the nodes used to draw the
     * point.
     */
    drawDot : function(cx, cy, settings)
    {
        var cfg = $.extend({
                firstMonth : false,
                annotation : ""
            }, settings),
            set = this.pane.paper.set();

        var useFirstMonthStyle = GC.Preferences._data.enableFirstMonthStyling;

        // The point shadow
        if (!cfg.firstMonth || !useFirstMonthStyle) {
            set.push(
                this.pane.paper.circle(cx, cy + 0.5, (cfg.firstMonth && useFirstMonthStyle) ? 6 : 5)
                .attr({
                    blur : Raphael.svg ? 1 : 0,
                    fill : "#000"
                }).addClass("point")
            );
        }

        set.push(

          // The point white outline
          this.pane.paper.circle(cx, cy, (cfg.firstMonth && useFirstMonthStyle) ? 5 : 4).attr({
              stroke : "#FFF",
              "stroke-opacity": (cfg.firstMonth && useFirstMonthStyle) ? 0.75 : 1,
              "stroke-width" : (cfg.firstMonth && useFirstMonthStyle) ? 4 : 2
          }).addClass("point"),

          // The inner point
          this.pane.paper.circle(cx, cy, 3).attr({
              fill   : cfg.annotation ?
                      this.settings.pointsColor :
                      GC.Util.brighten(this.settings.pointsColor),
              stroke : "none"
          }).addClass("point")
        );

        this._nodes.push(set);

        return set;
    },

    /**
     * Draws watermark text on the chart
     */
    drawWaterMark : function()
    {
        // Only the charts at first and last row have watermarks.
        if ( this.rowIndex > 0 && !this.isInLastRow ) {
            return;
        }

        var patient = GC.App.getPatient(),
            life1   = new GC.TimeInterval(),
            life2   = new GC.TimeInterval(),
            start   = GC.App.getStartAgeMos(),
            end     = GC.App.getEndAgeMos(),
            txt1    = "",     // the primary DS text
            txt2    = "",     // the secondary DS text
            txt3    = [],     // the small text (tokens)
            posY    = "top",  // top | !top
            posX    = "left", // left | !left
            hasDs2  = this.problemDataSet || GC.App.getCorrectionalChartType(),
            x,             // X for both texts
            y1,            // Y for the big text
            y2,            // Y for the small text
            // y, w, h,
            box, box2,
            // box3,
            attrBigFont = {
                "fill"         : "#333",
                "fill-opacity" : 0.4,
                "font-size"    : 20
            },
            attrSmallFont = {
                "fill"         : "#333",
                "fill-opacity" : 0.4,
                "font-size"    : 12
            };

        // Compile the texts
        // ---------------------------------------------------------------------
        txt1 += this.dataSet ?
            GC.DATA_SETS[this.dataSet].source :
            GC.App.getPrimaryChartType();

        if (hasDs2) {
            txt1 += " / ";
            txt2 += this.problemDataSet ?
                GC.DATA_SETS[this.problemDataSet].source :
                GC.App.getCorrectionalChartType();
        }

        // Compile the small text
        life1.setMonths( start );
        life2.setMonths( end );
        //txt3.push( patient.gender == "male" ? "Boy, " : "Girl, ");
        txt3.push( GC.Util.ucfirst(GC.str("STR_SMART_GENDER_" + patient.gender)) + ", ");
        txt3.push(
            (start === 0 ? "0" : life1.toString(GC.chartSettings.timeInterval)) +
            " - " + life2.toString(GC.chartSettings.timeInterval)
        );
        txt3 = txt3.join("");

        // Calculate watermark position (top-left for first row, or bottom-right
        // for last row or chartStack).
        // ---------------------------------------------------------------------
        if ( this.stack || this.isInLastRow ) {
            posX = "right";
            posY = "bottom";
        }

        x = posX == "right" ?
            this.x + this.width - this.getInnerAxisShadowWidth() - 16 :
            this.x + 10;

        y1 = posY == "top" ?
            this.y + 20 :
            this.y + this.height - 20;

        y2 = y1;

        // If 2 rows
        if ( txt1 && txt3 ) {
            if ( posY == "top" ) { // move the second row down
                y2 += 22;
            } else { // move the first row up
                y1 -= 22;
            }
        }

        // Draw the texts on the paper
        // ---------------------------------------------------------------------
        txt1 = this.pane.paper.text( x, y1, txt1 ).attr(attrBigFont).attr(
            "text-anchor", posX == "right" ? "end" : "start"
        );
        this._nodes.push(txt1);
        box = txt1.getBBox();

        if ( txt2 ) {
            txt2 = this.pane.paper.text( box.x2 + 10, y1, txt2 ).attr(attrBigFont).attr(
                "text-anchor", posX == "right" ? "end" : "start"
            );
            this._nodes.push(txt1);
            box2 = txt2.getBBox();

            if ( posX == "right" ) {
                txt1.attr("x", box2.x - 10);
            }
        }

        // Draw the small text
        if ( txt3 ) {
            txt3 = this.pane.paper.text( x, y2, txt3 ).attr(attrSmallFont).attr(
                "text-anchor", posX == "right" ? "end" : "start"
            );
            this._nodes.push(txt3);
            // box3 = txt3.getBBox();
        }


        // Draw the rect
        // ---------------------------------------------------------------------
        /*x   = box.x - 3;
        y   = box.y - 1;
        w   = box.width  + 6;
        h   = box.height + 2;

        if (txt3) {
            x    = Math.min(x, box3.x - 3);
            y    = Math.min(y, box3.y - 1);
            w    = Math.max(w, box3.width + 6);
            h    = box3.y2 + 1 - y;
        }

        this._nodes.push(
            this.pane.paper.rect( x, y, w, h, 5 ).attr({
                "fill"        : GC.chartSettings.drawChartBackground ?
                    GC.chartSettings.chartBackground.fill :
                    "#FFF",
                "stroke"      : "none",
                "fill-opacity": 0.7
            })
        );*/

        // Draw shaded rect
        // ---------------------------------------------------------------------
        if (txt2) {
            this._nodes.push(
                this.pane.paper.rect(
                    box2.x - 5,
                    box2.y - 2,
                    box2.width  + 10,
                    box2.height + 4
                ).attr({
                    "fill"        : $("html").is(".before-print") ?
                        "#EEE" :
                        "url(img/dash-dark.png)",
                    "stroke"      : "none",
                    "fill-opacity": 0.7
                })
            );

            this._nodes.push(
                txt2.clone().attr({
                    "text-anchor"  : posX == "right" ? "end" : "start",
                    "fill"         : "#FFF",
                    "stroke"       : "#FFF",
                    "stroke-width" : 4
                })
            );
        }


        txt1.toFront();
        if (txt2) {
            txt2.toFront();
        }
        if (txt3) {
            txt3.toFront();
        }
    }

};

/**
 * Fills any element @elem using the secondary region style. This may have three
 * different representations - for print, for SVG, and for VML
 * @param {Object} elem
 * @param {Object} settings
 * @param {Object} id
 */
Chart.fillAsSecondaryRegion = function(elem, settings, id) {
    var refId, pattern, path;
    if ($("html").is(".before-print")) {
        elem.attr({
            stroke : GC.Util.mixColors("#000", settings.fillColor, 0.4),
            fill   : GC.Util.mixColors("#000", settings.fillColor, 0.33),
            "fill-opacity" : 0.3,
            "stroke-width" : 1,
            "stroke-opacity" : 0.3
        });
    }
    else if ( Raphael.svg ) {
        refId   = "secondary-region-pattern-" + id;
        pattern = document.getElementById(refId);
        if (!pattern) {
            // Create the reference pattern in defs if needed
            pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
            pattern.id = refId;
            pattern.setAttribute("patternUnits", "userSpaceOnUse");
            pattern.setAttribute("x", "0");
            pattern.setAttribute("y", "0");
            pattern.setAttribute("width", "5");
            pattern.setAttribute("height", "5");
            pattern.setAttribute("viewBox", "0 0 5 5");

            path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M 0 0 L 5 0 L 5 5 L 0 5 Z");
            path.setAttribute("fill", settings.fillColor);
            path.setAttribute("fill-opacity", settings.fillOpacity);
            pattern.appendChild(path);

            path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M 5 0 L 0 5");
            path.setAttribute("stroke", "#000");
            path.setAttribute("stroke-opacity", settings.fillOpacity);
            pattern.appendChild(path);

            elem.paper.defs.appendChild(pattern);
        }
        elem.attr("stroke", settings.stroke)
            .addClass("pattern-fill")
            .node.setAttribute("fill", "url(#" + refId + ")");

    } else {
        elem.attr({
            stroke : settings.stroke,
            fill   : settings.fillURL || settings.fillColor,
            "fill-opacity" : 1 // included in the image
        });
    }
};
